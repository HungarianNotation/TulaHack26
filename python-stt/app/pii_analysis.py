import os
import json
import logging
import re
from gigachat import GigaChat
from natasha import (
    Segmenter, MorphVocab, NewsEmbedding, 
    NamesExtractor, Doc
)

segmenter = Segmenter()
morph_vocab = MorphVocab()
emb = NewsEmbedding()
names_extractor = NamesExtractor(morph_vocab)

# Список слов, которые ТОЧНО не являются именами (исключения для Natasha)
STOP_NAMES = {'Добрый', 'День', 'Стоматологу', 'Приём', 'Записаться', 'Хотела'}

NUMBER_WORDS = {
    'ноль', 'один', 'одна', 'два', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь',
    'восемь', 'девять', 'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 
    'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 
    'девятнадцать', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят',
    'семьдесят', 'восемьдесят', 'девяносто', 'сто', 'двести', 'триста', 
    'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот', 'тысяча'
}

def is_digit_like(word):
    w = word.lower()
    return w.isdigit() or w in NUMBER_WORDS or w == '+'

def find_pii_words(vosk_words):
    pii_map = {}
    if not vosk_words: return pii_map

    # 1. Точный поиск Имен (Режим Turbo)
    text_parts = [w['word'].capitalize() for w in vosk_words]
    full_text = " ".join(text_parts)
    
    char_to_word = {}
    current_char = 0
    for i, word in enumerate(text_parts):
        for j in range(current_char, current_char + len(word) + 1):
            char_to_word[j] = i
        current_char += len(word) + 1

    matches = names_extractor(full_text)
    for match in matches:
        first_word_idx = char_to_word.get(match.start)
        if first_word_idx is not None:
            if text_parts[first_word_idx] in STOP_NAMES:
                continue
            curr = match.start
            while curr < match.stop:
                idx = char_to_word.get(curr)
                if idx is not None:
                    if idx not in pii_map: pii_map[idx] = set()
                    pii_map[idx].add("NAME")
                curr += 1

    # 2. Точный поиск Цифр
    for i in range(len(vosk_words)):
        if is_digit_like(vosk_words[i]['word']):
            has_neighbor = False
            for offset in [-2, -1, 1, 2]:
                if 0 <= i + offset < len(vosk_words):
                    if is_digit_like(vosk_words[i + offset]['word']):
                        has_neighbor = True
                        break
            if has_neighbor:
                if i not in pii_map: pii_map[i] = set()
                pii_map[i].add("CONTACT_INFO")
                for offset in [-1, 1]:
                    if 0 <= i + offset < len(vosk_words):
                        w_low = vosk_words[i+offset]['word'].lower()
                        if w_low in ['года', 'мая', 'марта', 'рождения', 'телефон']:
                            if (i+offset) not in pii_map: pii_map[i+offset] = set()
                            pii_map[i+offset].add("CONTACT_INFO")

    return pii_map

def find_pii_words_smart(vosk_words):
    """Smart-режим анализа ПДн с использованием GigaChat"""
    if not vosk_words: 
        return {}

    credentials = os.getenv("GIGACHAT_CREDENTIALS")
    if not credentials:
        logging.warning("GIGACHAT_CREDENTIALS не заданы. Откат к режиму Turbo.")
        return find_pii_words(vosk_words)

    # Собираем текст для отправки в ИИ
    text_parts = [w['word'] for w in vosk_words]
    full_text = " ".join(text_parts)

    prompt = f"""Ты эксперт по безопасности ФЗ-152. Найди персональные данные в тексте. 
Категории: NAME, PHONE, ADDRESS, DATE, DOCUMENT. 
Верни ТОЛЬКО JSON формата: [{{"value": "текст", "type": "КАТЕГОРИЯ"}}]. Если данных нет — []. 
Пример: текст "меня зовут анна звоните на восемь девятьсот", выход: [{{"value": "анна", "type": "NAME"}}, {{"value": "восемь девятьсот", "type": "PHONE"}}].

Текст для анализа:
{full_text}"""

    try:
        # Отключаем проверку сертификатов Минцифры для простоты развертывания
        with GigaChat(credentials=credentials, verify_ssl_certs=False) as giga:
            response = giga.chat(prompt)
            ai_content = response.choices[0].message.content.strip()
            
            # Очистка от markdown (например ```json ... ```)
            if ai_content.startswith("```json"): ai_content = ai_content[7:]
            elif ai_content.startswith("```"): ai_content = ai_content[3:]
            if ai_content.endswith("```"): ai_content = ai_content[:-3]
            
            pii_data = json.loads(ai_content.strip())
            
    except Exception as e:
        logging.error(f"Ошибка GigaChat API: {e}. Выполняем fallback на Turbo режим.")
        return find_pii_words(vosk_words)

    # Маппинг строковых значений от ИИ на оригинальные индексы массива слов (Sliding Window)
    pii_map = {}
    for item in pii_data:
        # Убираем знаки препинания, чтобы избежать расхождений со словами STT
        val = re.sub(r'[^\w\s]', '', str(item.get("value", ""))).lower().strip()
        pii_type = item.get("type", "UNKNOWN")
        if not val: continue

        val_words = val.split()
        val_len = len(val_words)

        for i in range(len(vosk_words) - val_len + 1):
            window_words = [re.sub(r'[^\w\s]', '', vosk_words[i+j]['word']).lower().strip() for j in range(val_len)]
            
            # Если последовательность слов совпала
            if " ".join(window_words) == val:
                for j in range(val_len):
                    idx = i + j
                    if idx not in pii_map: pii_map[idx] = set()
                    pii_map[idx].add(pii_type)
                    
    return pii_map