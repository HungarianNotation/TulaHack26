import os
import json
from gigachat import GigaChat

# Получаем ключ из переменных окружения (вы уже прокинули его в docker-compose)
GIGACHAT_CREDENTIALS = os.getenv("GIGACHAT_CREDENTIALS")

def analyze_pii_with_gigachat(text: str):
    """
    Отправляет текст в GigaChat для выявления скрытых/сложных ПДн.
    """
    if not GIGACHAT_CREDENTIALS:
        print("[WARN] GIGACHAT_CREDENTIALS не задан. LLM-анализ пропущен.")
        return []
        
    prompt = f"""
    Ты - AI-ассистент по информационной безопасности. 
    Твоя задача — найти в тексте персональные данные: Имена, Фамилии, Отчества, Номера телефонов (в том числе записанные словами), Адреса, Даты рождения.
    Текст получен из системы распознавания речи, поэтому в нем нет знаков препинания и числа могут быть записаны словами.
    
    Верни ТОЛЬКО валидный JSON-массив объектов. Никакого другого текста, никаких пояснений.
    Пример формата ответа:
    [
        {{"text": "Иван Иванович", "type": "NAME"}},
        {{"text": "восемь девятьсот сто двадцать", "type": "CONTACT_INFO"}},
        {{"text": "город Москва улица Ленина", "type": "LOCATION"}}
    ]
    Если ничего не найдено, верни пустой массив [].
    
    Текст для анализа:
    {text}
    """
    
    try:
        # verify_ssl_certs=False помогает избежать проблем с сертификатами Минцифры в Docker
        with GigaChat(credentials=GIGACHAT_CREDENTIALS, verify_ssl_certs=False) as giga:
            response = giga.chat(prompt)
            content = response.choices[0].message.content
            
            # Защита: очищаем ответ от возможных блоков маркдауна (```json ... ```)
            content = content.replace("```json", "").replace("```", "").strip()
            
            result = json.loads(content)
            return result if isinstance(result, list) else []
            
    except Exception as e:
        print(f"[ERROR] Ошибка анализа через GigaChat: {e}")
        return []