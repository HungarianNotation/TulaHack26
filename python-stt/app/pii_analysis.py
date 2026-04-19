import re
from natasha import (
    Segmenter, MorphVocab, NewsEmbedding, 
    NamesExtractor, Doc
)
from .gigachat_service import analyze_pii_with_gigachat # ИМПОРТИРУЕМ НАШ СЕРВИС

segmenter = Segmenter()
morph_vocab = MorphVocab()
emb = NewsEmbedding()
names_extractor = NamesExtractor(morph_vocab)

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

    text_parts = [w['word'].capitalize() for w in vosk_words]
    full_text = " ".join(text_parts)
    
    char_to_word = {}
    current_char = 0
    for i, word in enumerate(text_parts):
        for j in range(current_char, current_char + len(word) + 1):
            char_to_word[j] = i
        current_char += len(word) + 1

    # --- 1. БАЗОВЫЙ СЛОЙ: Natasha ---
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

    # --- 2. БАЗОВЫЙ СЛОЙ: Правила цифр ---
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

    # --- 3. ИНТЕЛЛЕКТУАЛЬНЫЙ СЛОЙ: GigaChat ---
    # Передаем текст в нейросеть кусками (чтобы не превысить лимиты токенов для длинных аудио)
    chunk_size = 300 
    for i in range(0, len(text_parts), chunk_size):
        chunk_words = text_parts[i:i + chunk_size]
        chunk_text = " ".join(chunk_words)
        
        # Запрашиваем ПДн из GigaChat
        giga_entities = analyze_pii_with_gigachat(chunk_text)
        
        for entity in giga_entities:
            if not isinstance(entity, dict): continue
            
            entity_text = str(entity.get("text", "")).strip()
            entity_type = str(entity.get("type", "GIGACHAT_PII")).strip()
            
            # Игнорируем случайный мусор
            if len(entity_text) < 2: continue
            
            # Находим, где эта фраза расположена в оригинальном глобальном тексте
            # Это сработает, потому что GigaChat вернёт слова точно так, как они написаны в тексте
            start_idx = full_text.lower().find(entity_text.lower())
            
            while start_idx != -1:
                end_idx = start_idx + len(entity_text)
                
                # Мапим символы фразы на конкретные индексы слов в массиве Vosk
                curr = start_idx
                while curr < end_idx:
                    idx = char_to_word.get(curr)
                    if idx is not None:
                        if idx not in pii_map:
                            pii_map[idx] = set()
                        pii_map[idx].add(entity_type)
                    curr += 1
                
                # Ищем, не встречается ли эта же ПДн где-то еще в тексте (закрашиваем все упоминания)
                start_idx = full_text.lower().find(entity_text.lower(), start_idx + 1)

    return pii_map