import asyncio
import asyncssh
import json
import logging
import os

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

from core.models import SSHHost

logger = logging.getLogger("core.consumers")


class MonitorConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.host_id = None
        self.is_running = False
        self.task = None

    async def connect(self):
        self.host_id = self.scope["url_route"]["kwargs"]["host_id"]
        self.is_running = True
        logger.debug("WS connect, host_id=%s", self.host_id)
        await self.accept()

        ssh_host = await self.get_ssh_host()
        if ssh_host is None:
            logger.warning("SSHHost %s not found on connect", self.host_id)
            if self.is_running:
                await self.send(json.dumps({"error": "SSH host not found"}))
            await self.close()
            return

        logger.debug("Starting monitor_loop for host_id=%s", self.host_id)
        self.task = asyncio.create_task(self.monitor_loop(ssh_host))

    async def disconnect(self, close_code):
        logger.debug("WS disconnect, host_id=%s, code=%s", self.host_id, close_code)
        self.is_running = False
        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                logger.debug("monitor_loop cancelled for host_id=%s", self.host_id)

    async def monitor_loop(self, ssh_host):
        logger.debug("monitor_loop started for host_id=%s", self.host_id)
        while self.is_running:
            try:
                ssh_host = await sync_to_async(type(ssh_host).objects.get)(pk=ssh_host.pk)
                logger.debug(
                    "monitor_loop: loaded SSHHost(id=%s, host=%s)",
                    ssh_host.pk,
                    ssh_host.host,
                )

                result = await self.get_docker_compose_status(
                    ssh_host,
                    username=os.getenv("SSH_USERNAME"),
                    password=os.getenv("SSH_PASSWORD"),
                )
                logger.debug("monitor_loop: docker status result=%r", result)

                if not self.is_running:
                    logger.debug("monitor_loop: is_running=False, break")
                    break

                await self.send(
                    json.dumps(
                        {
                            "config_status": result.get("config_status"),
                            "last_update": ssh_host.last_update.isoformat()
                            if ssh_host.last_update
                            else None,
                            "last_commit": ssh_host.last_commit.isoformat()
                            if ssh_host.last_commit
                            else None,
                            "commitHash": ssh_host.commit if ssh_host.commit else None,
                        }
                    )
                )
            except asyncio.CancelledError:
                logger.debug("monitor_loop cancelled inside loop for host_id=%s", self.host_id)
                break
            except Exception as e:
                logger.exception("Exception in monitor_loop for host_id=%s: %s", self.host_id, e)
                if self.is_running:
                    await self.send(json.dumps({"error": f"Internal error: {str(e)}"}))

            try:
                if self.is_running:
                    await asyncio.sleep(5)
            except asyncio.CancelledError:
                logger.debug("monitor_loop sleep cancelled for host_id=%s", self.host_id)
                break

        logger.debug("monitor_loop finished for host_id=%s", self.host_id)

    async def get_ssh_host(self):
        try:
            host = await SSHHost.objects.aget(id=int(self.host_id))
            logger.debug("get_ssh_host: found SSHHost id=%s", host.id)
            return host
        except (SSHHost.DoesNotExist, ValueError) as e:
            logger.warning("get_ssh_host: host not found or bad id (%s): %s", self.host_id, e)
            return None

    async def get_docker_compose_status(self, ssh_host, username, password):
        logger.debug(
            "get_docker_compose_status: connecting to %s:%s as %s",
            ssh_host.host,
            ssh_host.port,
            username,
        )
        try:
            async with asyncssh.connect(
                host=ssh_host.host,
                port=ssh_host.port,
                username=username,
                password=password,
                known_hosts=None,
                connect_timeout=10,
            ) as conn:
                compose_ls = await conn.run(
                    "docker compose ls --format json", check=False
                )
                logger.debug(
                    "docker compose ls: exit=%s stdout=%r stderr=%r",
                    compose_ls.exit_status,
                    compose_ls.stdout,
                    compose_ls.stderr,
                )

                if compose_ls.stderr:
                    return {
                        "error": f"Ошибка при получении списка проектов: {compose_ls.stderr}",
                        "current_config": None,
                        "config_status": None,
                    }

                try:
                    projects = json.loads(compose_ls.stdout)
                    logger.debug("Parsed projects: %r", projects)
                    common_project = next(
                        (p for p in projects if p.get("Name") == "common"), None
                    )
                    if not common_project:
                        logger.info("docker compose: project 'common' not found")
                        return {
                            "current_config": None,
                            "config_status": "Проект common не найден",
                        }

                    config_files = common_project.get("ConfigFiles")
                    status = self.check_configuration(config_files, ssh_host)
                    logger.debug(
                        "common project config_files=%r, config_status=%s",
                        config_files,
                        status,
                    )
                    return {
                        "current_config": config_files,
                        "config_status": status,
                    }
                except json.JSONDecodeError as e:
                    logger.error("JSON decode error for docker compose ls: %s", e)
                    return {
                        "error": "Не удалось разобрать вывод docker compose",
                        "current_config": None,
                        "config_status": None,
                    }
        except Exception as e:
            logger.error("SSH connection error in get_docker_compose_status: %s", e)
            return {
                "error": f"Ошибка подключения: {str(e)}",
                "current_config": None,
                "config_status": None,
            }

    async def receive(self, text_data):
        logger.debug("WS receive from host_id=%s: %s", self.host_id, text_data)
        data = json.loads(text_data)
        ssh_host = await self.get_ssh_host()
        if ssh_host is None:
            if self.is_running:
                await self.send(json.dumps({"error": "SSH host not found"}))
            return

        action = data.get("action")
        logger.debug("receive: action=%s for host_id=%s", action, self.host_id)

        try:
            if action == "toggle_mongo":
                await self.toggle_mongo(
                    ssh_host,
                    username=os.getenv("SSH_USERNAME"),
                    password=os.getenv("SSH_PASSWORD"),
                )
            elif action == "restore_backup":
                await self.restore_backup(
                    ssh_host,
                    username=os.getenv("SSH_USERNAME"),
                    password=os.getenv("SSH_PASSWORD"),
                )
            elif action == "fast_pull":
                await self.fast_pull(
                    ssh_host,
                    username=os.getenv("SSH_USERNAME"),
                    password=os.getenv("SSH_PASSWORD"),
                )
            elif action == "pull_with_reload":
                await self.pull_with_reload(
                    ssh_host,
                    username=os.getenv("SSH_USERNAME"),
                    password=os.getenv("SSH_PASSWORD"),
                )
            else:
                logger.warning("receive: unknown action=%s", action)
        except Exception as e:
            logger.exception("Error in receive for host_id=%s: %s", self.host_id, e)
            if self.is_running:
                await self.send(json.dumps({"error": f"Internal error: {str(e)}"}))

    def check_configuration(self, config_files, ssh_host):
        logger.debug(
            "check_configuration: config_files=%r, docker_base=%r, docker_prod=%r",
            config_files,
            ssh_host.docker_base,
            ssh_host.docker_prod,
        )
        if not config_files:
            return "Конфигурация не определена"

        for config_file in config_files.split(","):
            filename = os.path.basename(config_file.strip())
            if ssh_host.docker_base and ssh_host.docker_base == filename:
                return "Подключена тестовая Монго"
            if ssh_host.docker_prod and ssh_host.docker_prod == filename:
                return "Подключена продакшн Монго"

        first = os.path.basename(config_files.split(",")[0].strip())
        return f"Используется другая конфигурация: {first}"

    async def toggle_mongo(self, ssh_host, username, password):
        logger.debug(
            "toggle_mongo: host=%s:%s user=%s", ssh_host.host, ssh_host.port, username
        )
        try:
            async with asyncssh.connect(
                host=ssh_host.host,
                port=ssh_host.port,
                username=username,
                password=password,
                known_hosts=None,
                connect_timeout=10,
            ) as conn:
                if not self.is_running:
                    logger.debug("toggle_mongo: is_running=False, exit early")
                    return

                await self.send(
                    json.dumps(
                        {
                            "action": "toggle_started",
                            "message": "Переключаем базу",
                        }
                    )
                )
                result = await conn.run(
                    "sudo /usr/local/bin/toggle-mongo", check=False
                )
                logger.debug(
                    "toggle-mongo result: exit=%s stdout=%r stderr=%r",
                    result.exit_status,
                    result.stdout,
                    result.stderr,
                )

                if result.exit_status != 0:
                    if not self.is_running:
                        return
                    await self.send(
                        json.dumps(
                            {
                                "action": "toggle_failed",
                                "error": result.stderr or "Toggle failed",
                            }
                        )
                    )
                    return

                if not self.is_running:
                    return

                await self.send(
                    json.dumps(
                        {
                            "action": "toggle_completed",
                            "result": result.stdout,
                        }
                    )
                )
        except Exception as e:
            logger.exception("toggle_mongo error for host_id=%s: %s", self.host_id, e)
            if not self.is_running:
                return
            await self.send(
                json.dumps(
                    {
                        "action": "toggle_failed",
                        "error": f"Ошибка подключения: {str(e)}",
                    }
                )
            )

    async def restore_backup(self, ssh_host, username, password):
        logger.debug(
            "restore_backup: host=%s:%s user=%s", ssh_host.host, ssh_host.port, username
        )
        try:
            async with asyncssh.connect(
                host=ssh_host.host,
                port=ssh_host.port,
                username=username,
                password=password,
                known_hosts=None,
                connect_timeout=10,
            ) as conn:
                logger.debug("restore_backup: SSH connection established")
                if not self.is_running:
                    logger.debug("restore_backup: is_running=False, exit early")
                    return

                await self.send(
                    json.dumps(
                        {
                            "action": "restore_started",
                            "message": "Начато восстановление дампа PG",
                        }
                    )
                )
                logger.debug("restore_backup: running restore-backup")
                result = await conn.run(
                    "sudo /usr/local/bin/restore-backup", check=False
                )
                logger.debug(
                    "restore-backup result: exit=%s stdout=%r stderr=%r",
                    result.exit_status,
                    result.stdout,
                    result.stderr,
                )

                if result.exit_status != 0:
                    if not self.is_running:
                        return
                    await self.send(
                        json.dumps(
                            {
                                "action": "restore_failed",
                                "error": result.stderr or "Restore failed",
                            }
                        )
                    )
                    return

                if not self.is_running:
                    return

                await self.send(
                    json.dumps(
                        {
                            "action": "restore_completed",
                            "result": result.stdout,
                        }
                    )
                )
                logger.debug("restore_backup: success")
        except Exception as e:
            logger.exception("restore_backup error for host_id=%s: %s", self.host_id, e)
            if not self.is_running:
                return
            await self.send(
                json.dumps(
                    {
                        "action": "restore_failed",
                        "error": f"Restore backup error: {str(e)}",
                    }
                )
            )

    async def fast_pull(self, ssh_host, username, password):
        logger.debug(
            "fast_pull: host=%s:%s user=%s", ssh_host.host, ssh_host.port, username
        )
        try:
            async with asyncssh.connect(
                host=ssh_host.host,
                port=ssh_host.port,
                username=username,
                password=password,
                known_hosts=None,
                connect_timeout=10,
            ) as conn:
                if not self.is_running:
                    logger.debug("fast_pull: is_running=False, exit early")
                    return

                await self.send(
                    json.dumps(
                        {
                            "action": "fast_pull_started",
                            "message": "Пуллим код",
                        }
                    )
                )
                logger.debug("fast_pull: running git pull")
                result = await conn.run(
                    "cd /home/jsand/common && git pull origin main", check=False
                )
                logger.debug(
                    "fast_pull git pull result: exit=%s stdout=%r stderr=%r",
                    result.exit_status,
                    result.stdout,
                    result.stderr,
                )

                if result.exit_status != 0:
                    if not self.is_running:
                        return
                    await self.send(
                        json.dumps(
                            {
                                "action": "fast_pull_failed",
                                "error": result.stderr or "Fast pull failed",
                            }
                        )
                    )
                    return

                if not self.is_running:
                    return

                await self.send(
                    json.dumps(
                        {
                            "action": "fast_pull_completed",
                            "result": result.stdout,
                        }
                    )
                )
                ssh_host.last_update = timezone.now()
                await sync_to_async(ssh_host.save)()
                logger.debug(
                    "fast_pull: success, last_update set to %s", ssh_host.last_update
                )
        except Exception as e:
            logger.exception("fast_pull error for host_id=%s: %s", self.host_id, e)
            if not self.is_running:
                return
            await self.send(
                json.dumps(
                    {
                        "action": "fast_pull_failed",
                        "error": f"Fast pull error: {str(e)}",
                    }
                )
            )

    async def pull_with_reload(self, ssh_host, username, password):
        logger.debug(
            "pull_with_reload: host=%s:%s user=%s",
            ssh_host.host,
            ssh_host.port,
            username,
        )
        try:
            async with asyncssh.connect(
                host=ssh_host.host,
                port=ssh_host.port,
                username=username,
                password=password,
                known_hosts=None,
                connect_timeout=10,
            ) as conn:
                if not self.is_running:
                    logger.debug("pull_with_reload: is_running=False, exit early")
                    return

                await self.send(
                    json.dumps(
                        {
                            "action": "pull_with_reload_started",
                            "message": "Пуллим код и перезагружаемся",
                        }
                    )
                )

                async def run_command_or_fail(command, step_name):
                    logger.debug("pull_with_reload: %s command=%r", step_name, command)
                    result = await conn.run(command, check=False, input=password)
                    logger.debug(
                        "pull_with_reload: %s exit=%s stdout=%r stderr=%r",
                        step_name,
                        result.exit_status,
                        result.stdout,
                        result.stderr,
                    )
                    if result.exit_status != 0:
                        error_msg = result.stderr or (
                            f"{step_name} failed with unknown error"
                        )
                        logger.error(
                            "pull_with_reload: %s error: %s", step_name, error_msg
                        )
                        if self.is_running:
                            await self.send(
                                json.dumps(
                                    {
                                        "action": "pull_with_reload_failed",
                                        "error": error_msg,
                                    }
                                )
                            )
                        raise Exception(f"{step_name} failed: {error_msg}")
                    return result

                await run_command_or_fail(
                    "cd /home/jsand/common && git fetch origin", "Git fetch"
                )
                await run_command_or_fail(
                    "cd /home/jsand/common && git checkout -B main origin/main",
                    "Git force checkout main",
                )
                await run_command_or_fail(
                    "sudo /usr/local/bin/deploy_remote", "Deploy remote"
                )

                docker_compose_file = ssh_host.docker_base
                logger.debug(
                    "pull_with_reload: using docker compose file %s", docker_compose_file
                )
                result = await run_command_or_fail(
                    f"cd /home/jsand/common && docker compose -f {docker_compose_file} up -d --build --force-recreate",
                    "Docker compose up",
                )

                if not self.is_running:
                    logger.debug("pull_with_reload: is_running=False after commands")
                    return

                await self.send(
                    json.dumps(
                        {
                            "action": "pull_with_reload_completed",
                            "result": result.stdout,
                        }
                    )
                )
                ssh_host.last_update = timezone.now()
                await sync_to_async(ssh_host.save)()
                logger.debug(
                    "pull_with_reload completed successfully, last_update=%s",
                    ssh_host.last_update,
                )
                return "All operations completed successfully"
        except Exception as e:
            logger.exception("Error in pull_with_reload for host_id=%s: %s", self.host_id, e)
            raise Exception(f"Pull with reload error: {str(e)}")
