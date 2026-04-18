import re
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

    # 1. Точный поиск Имен
    text_parts = [w['word'].capitalize() for w in vosk_words]
    full_text = " ".join(text_parts)
    
    # Создаем карту: какой индекс символа к какому индексу слова относится
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
            # Проверка на стоп-слова
            if text_parts[first_word_idx] in STOP_NAMES:
                continue
                
            # Помечаем все слова, входящие в диапазон сущности
            curr = match.start
            while curr < match.stop:
                idx = char_to_word.get(curr)
                if idx is not None:
                    if idx not in pii_map: pii_map[idx] = set()
                    pii_map[idx].add("NAME")
                curr += 1

    # 2. Точный поиск Цифр (Телефон/Дата)
    # Помечаем только те слова, которые реально похожи на цифры, 
    # если они стоят группой (минимум 2 подряд или через одно слово)
    for i in range(len(vosk_words)):
        if is_digit_like(vosk_words[i]['word']):
            # Проверяем соседей (есть ли рядом еще цифры?)
            has_neighbor = False
            for offset in [-2, -1, 1, 2]:
                if 0 <= i + offset < len(vosk_words):
                    if is_digit_like(vosk_words[i + offset]['word']):
                        has_neighbor = True
                        break
            
            # Также помечаем ключевые слова даты, если они вплотную к цифрам
            if has_neighbor:
                if i not in pii_map: pii_map[i] = set()
                pii_map[i].add("CONTACT_INFO")
                
                # Захватываем "года", "мая", "рождения", если они прилипли к цифрам
                for offset in [-1, 1]:
                    if 0 <= i + offset < len(vosk_words):
                        w_low = vosk_words[i+offset]['word'].lower()
                        if w_low in ['года', 'мая', 'марта', 'рождения', 'телефон']:
                            if (i+offset) not in pii_map: pii_map[i+offset] = set()
                            pii_map[i+offset].add("CONTACT_INFO")

    return pii_map