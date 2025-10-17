import redis
import json

# Подключение к Redis
r = redis.Redis(
    host='172.20.0.132',
    port=6380,
    db=0,
    decode_responses=True
)

try:
    # Проверка подключения
    print("Подключение к Redis...")
    r.ping()
    print("✓ Подключение успешно!\n")
    
    # Общая информация
    info = r.info()
    print(f"Всего ключей в базе: {r.dbsize()}")
    print(f"Версия Redis: {info['redis_version']}\n")
    
    # Получаем несколько примеров ключей
    print("Примеры ключей (первые 20):")
    keys = r.keys('*')[:20]
    for key in keys:
        key_type = r.type(key)
        ttl = r.ttl(key)
        ttl_str = f"TTL: {ttl}s" if ttl > 0 else "без TTL"
        print(f"  {key} (тип: {key_type}, {ttl_str})")
    
    print(f"\n--- Всего найдено ключей: {len(r.keys('*'))} ---\n")
    
    # Поиск ключей с ident (если есть)
    test_ident = '867236070098977'  # замените на реальный ident
    print(f"\nПоиск ключей с ident '{test_ident}':")
    matching_keys = r.keys(f'*{test_ident}*')
    
    if matching_keys:
        print(f"Найдено ключей: {len(matching_keys)}")
        for key in matching_keys[:5]:  # показываем первые 5
            print(f"\nКлюч: {key}")
            key_type = r.type(key)
            
            if key_type == 'string':
                value = r.get(key)
                try:
                    # Пытаемся распарсить как JSON
                    parsed = json.loads(value)
                    print(f"Значение (JSON):\n{json.dumps(parsed, indent=2, ensure_ascii=False)[:500]}")
                except:
                    print(f"Значение (строка): {value[:200]}")
                    
            elif key_type == 'hash':
                value = r.hgetall(key)
                print(f"Значение (hash):\n{json.dumps(value, indent=2, ensure_ascii=False)[:500]}")
                
            elif key_type == 'list':
                length = r.llen(key)
                print(f"Список, длина: {length}")
                if length > 0:
                    first_item = r.lindex(key, 0)
                    print(f"Первый элемент: {first_item[:200]}")
                    
            elif key_type == 'set':
                members = list(r.smembers(key))[:5]
                print(f"Множество, примеры: {members}")
    else:
        print(f"Ключи с '{test_ident}' не найдены")
        
        # Попробуем найти паттерны
        print("\nПопробуем найти общие паттерны ключей:")
        all_keys = r.keys('*')[:100]
        prefixes = {}
        for key in all_keys:
            prefix = key.split(':')[0] if ':' in key else 'без_префикса'
            prefixes[prefix] = prefixes.get(prefix, 0) + 1
        
        print("\nПрефиксы ключей:")
        for prefix, count in sorted(prefixes.items(), key=lambda x: x[1], reverse=True):
            print(f"  {prefix}: {count} ключей")
            # Показываем пример ключа с этим префиксом
            example = [k for k in all_keys if k.startswith(prefix)]
            if example:
                print(f"    Пример: {example[0]}")

except redis.ConnectionError as e:
    print(f"Ошибка подключения к Redis: {e}")
except Exception as e:
    print(f"Ошибка: {e}")
    import traceback
    traceback.print_exc()
