import asyncio
import asyncssh
import json
import logging
import os
import traceback

from channels.generic.websocket import AsyncWebsocketConsumer

from core.models import SSHHost

logger = logging.getLogger(__name__)


class MonitorConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.host_id = None
        self.is_running = False
        self.task = None

    async def connect(self):
        self.host_id = self.scope['url_route']['kwargs']['host_id']
        self.is_running = True
        await self.accept()

        ssh_host = await self.get_ssh_host()
        if ssh_host is None:
            await self.send(json.dumps({'error': 'SSH host not found'}))
            await self.close()
            return

        # Запускаем мониторинг в отдельной задаче
        self.task = asyncio.create_task(self.monitor_loop(ssh_host))

    async def disconnect(self, close_code):
        self.is_running = False
        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

    async def monitor_loop(self, ssh_host):
        while self.is_running:
            try:
                result = await self.get_docker_compose_status(
                    ssh_host,
                    username=os.getenv('SSH_USERNAME'),
                    password=os.getenv('SSH_PASSWORD')
                )
                await self.send(json.dumps({
                    'config_status': result['config_status']
                }))
            except asyncio.CancelledError:
                break
            except Exception as e:
                await self.send(json.dumps({'error': f'Internal error: {str(e)}'}))
                print("❌ Exception in monitor_loop:")
                traceback.print_exc()

            try:
                await asyncio.sleep(5)  # обновлять каждые 5 секунд
            except asyncio.CancelledError:
                break

    async def get_ssh_host(self):
        try:
            return await SSHHost.objects.aget(id=int(self.host_id))
        except (SSHHost.DoesNotExist, ValueError):
            return None

    async def get_docker_compose_status(self, ssh_host, username, password):
        try:
            async with asyncssh.connect(
                host=ssh_host.host,
                port=ssh_host.port,
                username=username,
                password=password,
                known_hosts=None,
                connect_timeout=10
            ) as conn:
                # Получаем только информацию о конфигурации
                compose_ls = await conn.run('docker compose ls --format json', check=False)

                if compose_ls.stderr:
                    return {
                        'error': f"Ошибка при получении списка проектов: {compose_ls.stderr}",
                        'current_config': None,
                        'config_status': None
                    }

                try:
                    projects = json.loads(compose_ls.stdout)
                    common_project = next((p for p in projects if p['Name'] == 'common'), None)

                    if not common_project:
                        return {
                            'current_config': None,
                            'config_status': "Проект common не найден"
                        }

                    return {
                        'current_config': common_project['ConfigFiles'],
                        'config_status': self.check_configuration(common_project['ConfigFiles'], ssh_host)
                    }

                except json.JSONDecodeError:
                    return {
                        'error': "Не удалось разобрать вывод docker compose",
                        'current_config': None,
                        'config_status': None
                    }

        except Exception as e:
            return {
                'error': f"Ошибка подключения: {str(e)}",
                'current_config': None,
                'config_status': None
            }

    async def receive(self, text_data):
        data = json.loads(text_data)
        ssh_host = await self.get_ssh_host()
        if ssh_host is None:
            await self.send(json.dumps({'error': 'SSH host not found'}))
            return

        try:
            if data.get('action') == 'toggle_mongo':
                await self.toggle_mongo(
                    ssh_host,
                    username=os.getenv('SSH_USERNAME'),
                    password=os.getenv('SSH_PASSWORD')
                )
            elif data.get('action') == 'restore_backup':
                await self.restore_backup(
                    ssh_host,
                    username=os.getenv('SSH_USERNAME'),
                    password=os.getenv('SSH_PASSWORD')
                )
            elif data.get('action') == 'fast_pull':
                await self.fast_pull(
                    ssh_host,
                    username=os.getenv('SSH_USERNAME'),
                    password=os.getenv('SSH_PASSWORD')
                )
            elif data.get('action') == 'pull_with_reload':
                await self.pull_with_reload(
                    ssh_host,
                    username=os.getenv('SSH_USERNAME'),
                    password=os.getenv('SSH_PASSWORD')
                )
        except Exception as e:
            print(f"Error in receive: {str(e)}")

    def check_configuration(self, config_files, ssh_host):
        if not config_files:
            return "Конфигурация не определена"

        for config_file in config_files.split(','):
            filename = os.path.basename(config_file.strip())

            if ssh_host.docker_base and ssh_host.docker_base == filename:
                return "Подключена тестовая Монго"

            if ssh_host.docker_prod and ssh_host.docker_prod == filename:
                return "Подключена продакшн Монго"
        return f"Используется другая конфигурация: {os.path.basename(config_files.split(',')[0].strip())}"

    async def toggle_mongo(self, ssh_host, username, password):
        try:
            async with asyncssh.connect(
                host=ssh_host.host,
                port=ssh_host.port,
                username=username,
                password=password,
                known_hosts=None,
                connect_timeout=10
            ) as conn:
                await self.send(json.dumps({
                    'action': 'toggle_started',
                    'message': 'Переключаем базу'
                }))

                result = await conn.run('sudo /usr/local/bin/toggle-mongo', check=False)

                if result.exit_status != 0:
                    await self.send(json.dumps({
                        'action': 'toggle_failed',
                        'error': result.stderr or "Toggle failed"
                    }))
                    return

                await self.send(json.dumps({
                    'action': 'toggle_completed',
                    'result': result.stdout
                }))

        except Exception as e:
            await self.send(json.dumps({
                'action': 'toggle_failed',
                'error': f"Ошибка подключения: {str(e)}"
            }))

    async def restore_backup(self, ssh_host, username, password):
        try:
            async with asyncssh.connect(
                host=ssh_host.host,
                port=ssh_host.port,
                username=username,
                password=password,
                known_hosts=None,
                connect_timeout=10
            ) as conn:
                logger.info("Соединение установлено. Начинаем восстановление дампа.")
                await self.send(json.dumps({
                    'action': 'restore_started',
                    'message': 'Начато восстановление дампа PG'
                }))

                result = await conn.run('sudo /usr/local/bin/restore-backup', check=False)

                if result.exit_status != 0:
                    raise Exception(result.stderr or "Restore failed")

                await self.send(json.dumps({
                    'action': 'restore_completed',
                    'result': result.stdout
                }))

        except Exception as e:
            raise Exception(f"Restore backup error: {str(e)}")

    async def fast_pull(self, ssh_host, username, password):
        try:
            async with asyncssh.connect(
                host=ssh_host.host,
                port=ssh_host.port,
                username=username,
                password=password,
                known_hosts=None,
                connect_timeout=10
            ) as conn:
                await self.send(json.dumps({
                    'action': 'fast_pull_started',
                    'message': 'Пуллим код'
                }))

                result = await conn.run('cd /home/jsand/common && git pull origin main', check=False)

                if result.exit_status != 0:
                    await self.send(json.dumps({
                        'action': 'fast_pull_failed',
                        'error': result.stderr or "Fast pull failed"
                    }))
                    return
                
                await self.send(json.dumps({
                    'action': 'fast_pull_completed',
                    'result': result.stdout
                }))

                if result.exit_status != 0:
                    raise Exception(result.stderr or "Fast pull failed")
                return result.stdout

        except Exception as e:
            raise Exception(f"Fast pool error: {str(e)}")

    async def pull_with_reload(self, ssh_host, username, password):
        try:
            async with asyncssh.connect(
                host=ssh_host.host,
                port=ssh_host.port,
                username=username,
                password=password,
                known_hosts=None,
                connect_timeout=10
            ) as conn:
                await self.send(json.dumps({
                    'action': 'pull_with_reload_started',
                    'message': 'Пуллим код и перезагружаемся'
                }))

                # 1. Git pull
                result = await conn.run('cd /home/jsand/common && git pull origin main', check=False)
                if result.exit_status != 0:
                    raise Exception(f"Git pull failed: {result.stderr or 'Unknown error'}")
                
                if result.exit_status != 0:
                    await self.send(json.dumps({
                        'action': 'pull_with_reload_failed',
                        'error': result.stderr or "Pull with reload failed"
                    }))
                    return
                
                # 2. Deploy remote
                result = await conn.run('sudo /usr/local/bin/deploy_remote', check=False)
                if result.exit_status != 0:
                    raise Exception(f"Deploy remote failed: {result.stderr or 'Unknown error'}")
                
                if result.exit_status != 0:
                    await self.send(json.dumps({
                        'action': 'pull_with_reload_failed',
                        'error': result.stderr or "Pull with reload failed"
                    }))
                    return
                
                # 3. Docker compose up
                docker_compose_file = ssh_host.docker_base              
                result = await conn.run(f'cd /home/jsand/common && docker-compose -f {docker_compose_file} up -d', check=False)
                if result.exit_status != 0:
                    raise Exception(f"Docker compose up failed: {result.stderr or 'Unknown error'}")
                
                if result.exit_status != 0:
                    await self.send(json.dumps({
                        'action': 'pull_with_reload_failed',
                        'error': result.stderr or "Pull with reload failed"
                    }))
                    
                await self.send(json.dumps({
                    'action': 'pull_with_reload_completed',
                    'result': result.stdout
                }))
                
                return "All operations completed successfully"

        except Exception as e:
            raise Exception(f"Pool with reload error: {str(e)}")
