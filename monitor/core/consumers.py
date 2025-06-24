import asyncssh
import json
import os
import traceback

from channels.generic.websocket import AsyncWebsocketConsumer
from core.models import SSHHost


class MonitorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

        self.host_id = self.scope['url_route']['kwargs']['host_id']

        ssh_host = await self.get_ssh_host()
        if ssh_host is None:
            await self.send(json.dumps({'error': 'SSH host not found'}))
            await self.close()
            return

        try:
            output = await self.get_docker_compose_status(
                ssh_host,
                username=os.getenv('SSH_USERNAME'),
                password=os.getenv('SSH_PASSWORD')
            )
            await self.send(json.dumps({'output': output}))
        except Exception as e:
            await self.send(json.dumps({'error': f'Internal error: {str(e)}'}))
            print("❌ Exception in WebSocket connect():")
            traceback.print_exc()
            await self.close()

    async def disconnect(self, close_code):
        pass

    async def get_ssh_host(self):
        try:
            return await SSHHost.objects.aget(id=1)
        except SSHHost.DoesNotExist:
            return None

    async def get_docker_compose_status(self, ssh_host, username, password):
        async with asyncssh.connect(
            host=ssh_host.host,
            port=ssh_host.port,
            username=username,
            password=password,
            known_hosts=None  # отключаем проверку known_hosts
        ) as conn:
            result = await conn.run('docker compose ls', check=True)
            return result.stdout