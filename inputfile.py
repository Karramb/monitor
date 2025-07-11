import datetime
import json
import time

from rest_framework.exceptions import ValidationError

current_timestamp = int(time.time())

# Шаблон сообщения

if 'template_message' not in globals():
    raise ValidationError(
        {
            "variables": "Необходим ключ 'template_message' в variables",
            "hint": "Добавьте в variables JSON вида {'template_message': {...}}"
        },
        code="missing_template_message"
    )
else:
    template_message = globals()['template_message'].copy()

template_message = {
    "battery_voltage": 4.246,
    "channel_id": 1216180,
    "connection_state": "gsm",
    "din": 0,
    "dout": 0,
    "engine_generator_status": False,
    "engine_ignition_status": True, # Зажигание ВКЛ/ВЫКЛ
    "engine_motorhours": 573,
    "event_enum": 150,
    "event_seqnum": 0,
    "external_powersource_voltage": 0,
    "gnss_status": True,
    "ident": "352094082202901",
    "peer": "188.170.77.62:31499",
    "position_altitude": 12,
    "position_direction": 73,
    "position_hdop": 0,
    "position_latitude": 0,
    "position_longitude": 0,
    "position_satellites": 16,
    "position_speed": 0,
    "position_timestamp": 0,  # Будет обновлено
    "protocol_id": 17,
    "server_timestamp": 0,  # Будет обновлено
    "server1_connection_status": True,
    "server2_connection_status": False,
    "server3_connection_status": False,
    "timestamp": 0,  # Будет обновлено
}

messages = []
date = datetime.time

# Генерация 10 сообщений с шагом времени 10 секунд (10000 миллисекунд)
for i in range(30):
    message = template_message.copy()

    # Обновляем временные поля на основе текущего времени
    timestamp_value = current_timestamp + (i * 5)  # шаг 5 секунд

    message["timestamp"] = timestamp_value
    message["position_timestamp"] = timestamp_value
    message["server_timestamp"] = timestamp_value
    message["ident"] = "43223323245" #для какой машины Нива 352094082202901 или Лада 868345031813892 или Команды 868184060881466 
    # или а688ке198 (9801190) 866192032630707 н026су790 (9802429) 862057047607392 Тест ДТО 869696049076628 в594мс178 (9806386) 861100060318298 

    # Обновляем значение полей
    if i == 0:
        message["position_speed"] = 40 + i * 5 
        message["custom_ext_voltage"] = 90
        message["position_latitude"] = round(59.914871 + i * 0.001, 6) # Пример: сдвигаем широту
        message["position_longitude"] = round(30.339671 + i * 0.01, 6) # Пример: сдвигаем долготу
        message["custom_fuel_lev_l"] = 500 - i * 1
        message["custom_eng_rpm"] = 15 + i * 2
        message["engine_ignition_status"] = True
        message["vehicle_mileage"] = 980 + i * 10
    elif i < 5:
        message["position_speed"] =  40 + i * 5 
        message["custom_ext_voltage"] = 90
        message["position_latitude"] = round(59.914871 + i * 0.001, 6) # Пример: сдвигаем широту
        message["position_longitude"] = round(30.339671 + i * 0.001, 6) # Пример: сдвигаем долготу
        message["custom_fuel_lev_l"] = 500 - i * 5
        message["custom_eng_rpm"] = 386 + i * 2
        message["engine_ignition_status"] = True
        message["vehicle_mileage"] = 980 + i * 10
    else:
        message["position_speed"] = 40 + i * 5 
        message["custom_ext_voltage"] = 101
        message["position_latitude"] = round(59.914871 + i * 0.008, 6)
        message["position_longitude"] = round(30.339671 + i * 0.008, 6)
        message["custom_fuel_lev_l"] = 500 - i * 10
        message["custom_eng_rpm"] = 0
        message["engine_ignition_status"] = True
        message["vehicle_mileage"] = 980 + i * 10
        # message["alarm_event"] = True

    # Добавляем сообщение с timedelay 5 секунд
    messages.append({
        "message": message
    })

# Сохранение в файл input.json
try:
    with open("media/code-messages/input.json", "w") as outfile:
        json.dump(messages, outfile, indent=4)
except IOError as e:
    raise ValidationError({"file_error": f"Не удалось сохранить файл: {str(e)}"})

print("Файл input.json успешно создан.")

