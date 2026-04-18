import re
from natasha import (
    Segmenter, MorphVocab, NewsEmbedding, 
    NewsNERTagger, Doc
)

# Инициализация Natasha (NLP)
segmenter = Segmenter()
morph_vocab = MorphVocab()
emb = NewsEmbedding()
ner_tagger = NewsNERTagger(emb)

NUMBER_MAP = {
    'ноль': '0', 'один': '1', 'одна': '1', 'два': '2', 'две': '2',
    'три': '3', 'четыре': '4', 'пять': '5', 'шесть': '6',
    'семь': '7', 'восемь': '8', 'девять': '9', 'десять': '10',
    'одиннадцать': '11', 'двенадцать': '12', 'тринадцать': '13',
    'четырнадцать': '14', 'пятнадцать': '15', 'шестнадцать': '16',
    'семнадцать': '17', 'восемнадцать': '18', 'девятнадцать': '19',
    'двадцать': '20', 'тридцать': '30', 'сорок': '40', 'пятьдесят': '50',
    'шестьдесят': '60', 'семьдесят': '70', 'восемьдесят': '80', 'девяносто': '90',
    'сто': '100', 'двести': '200', 'триста': '300', 'четыреста': '400',
    'пятьсот': '500', 'шестьсот': '600', 'семьсот': '700', 'восемьсот': '800', 'девятьсот': '900',
    'плюс': '+'
}

def find_pii_words(vosk_words):
    """
    Полный анализ текста (Full-text Analysis) для точного поиска PII.
    Принимает список dict от Vosk: [{'word': '...', 'start': X, 'end': Y}, ...]
    Возвращает dict: { глобальный_индекс_слова: set('PHONE', 'NAME', ...) }
    """
    pii_map = {}
    if not vosk_words:
        return pii_map
        
    def mark_pii(char_start, char_end, mapping_dict, pii_type):
        """Вспомогательная функция для пометки слов как PII по индексам символов"""
        for char_idx in range(char_start, char_end):
            w_idx = mapping_dict.get(char_idx)
            if w_idx is not None:
                if w_idx not in pii_map:
                    pii_map[w_idx] = set()
                pii_map[w_idx].add(pii_type)

    # === ШАГ 1: Оригинальный текст для Natasha (Имена, Адреса) ===
    orig_text = ""
    orig_char_to_word = {}
    for i, w in enumerate(vosk_words):
        start_idx = len(orig_text)
        orig_text += w['word'] + " "
        for j in range(start_idx, len(orig_text)):
            orig_char_to_word[j] = i
            
    doc = Doc(orig_text)
    doc.segment(segmenter)
    doc.tag_ner(ner_tagger)
    
    for span in doc.spans:
        if span.type in ['PER', 'LOC']:
            p_type = "NAME" if span.type == 'PER' else "ADDRESS"
            mark_pii(span.start, span.stop, orig_char_to_word, p_type)

    # === ШАГ 2: Нормализованный текст для регулярок (Телефоны, Паспорта) ===
    norm_text = ""
    norm_char_to_word = {}
    for i, w in enumerate(vosk_words):
        clean_w = re.sub(r'[^\w\s\+]', '', w['word'].lower())
        mapped_w = NUMBER_MAP.get(clean_w, clean_w)
        
        start_idx = len(norm_text)
        norm_text += mapped_w + " "
        for j in range(start_idx, len(norm_text)):
            norm_char_to_word[j] = i

    # Сжимаем пробелы между цифрами (squash) для работы регулярки, 
    # сохраняя связь с оригинальным индексом слова
    squashed_text = ""
    squashed_to_orig = {}
    i = 0
    while i < len(norm_text):
        char = norm_text[i]
        # Пропускаем пробелы, если слева и справа стоят цифры или знак плюса
        if char == ' ' and i > 0 and i < len(norm_text) - 1:
            left_char = norm_text[i-1]
            right_char = norm_text[i+1]
            if (left_char.isdigit() or left_char == '+') and right_char.isdigit():
                i += 1 
                continue
                
        squashed_to_orig[len(squashed_text)] = norm_char_to_word.get(i)
        squashed_text += char
        i += 1

    patterns = {
        "PHONE": r"(\+7|8|7)\d{7,11}",
        "PASSPORT": r"\b\d{4}\s?\d{6}\b",
        "EMAIL": r"[\w\.-]+@[\w\.-]+\.\w+"
    }
    
    for p_type, p_regex in patterns.items():
        for match in re.finditer(p_regex, squashed_text):
            mark_pii(match.start(), match.end(), squashed_to_orig, p_type)

    return pii_map