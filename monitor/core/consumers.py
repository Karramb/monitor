import asyncio
import asyncssh
import json
import os
import traceback

from channels.generic.websocket import AsyncWebsocketConsumer
from core.models import SSHHost


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
                output = await self.get_docker_compose_status(
                    ssh_host,
                    username=os.getenv('SSH_USERNAME'),
                    password=os.getenv('SSH_PASSWORD')
                )
                await self.send(json.dumps({'output': output}))
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
                known_hosts=None, #Указать, где лежат ключи или отключить проверку ключа
                connect_timeout=10  # таймаут подключения
            ) as conn:
                result = await conn.run('docker compose ls', check=True)
                return result.stdout
        except Exception as e:
            raise Exception(f"SSH error: {str(e)}")