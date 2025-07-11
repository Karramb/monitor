import json
import time

from rabbitmq.config import RabbitSettings
from rabbitmq.message_provider import RabbitMQProvider


def process_file(filename):
    rabbit_config = RabbitSettings(
        RABBIT_USER='arkan',
        RABBIT_PASS='MPjrTUpFMAhBK4F5',
        RABBIT_HOST='172.20.0.103',
        RABBIT_PORT=5672,
        RABBIT_CONFIG_QUEUE='config_queue',
        RABBIT_COMMAND_QUEUE='command_queue'
    )
    print(rabbit_config)
    provider = RabbitMQProvider(rabbit_config)

    with open(filename, "r") as file:
        data = json.load(file)  # Читаем JSON данные из файла

        for item in data:
            # timedelay = item["timedelay"]
            message = item ["message"]

            # Если в сообщении есть _id, удаляем его, чтобы MongoDB сгенерировала новый
            if "_id" in message:
                 del message["_id"]

            # Задержка перед отправкой данных в MongoDB
            time.sleep(5)
            with provider:
                provider.publish_message(queue_name=message["ident"], message=json.dumps(message))
            print(f"Message sent: {message}")


# Запуск обработки файла
process_file("/home/prog11/common/for_andrew/high-speed-input.json")
# process_file("/home/prog11/common/for_andrew/1message.json")