import os
import json
import wave
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pydub import AudioSegment
from vosk import Model, KaldiRecognizer

# Для поиска имен и адресов (PII)
from natasha import (
    Segmenter, MorphVocab, NewsEmbedding, 
    NewsNERTagger, Doc  # Исправлено имя NewsNERTagger
)

app = FastAPI()

# Инициализация Vosk
MODEL_PATH = "/app/vosk-model"
model = None
if os.path.exists(MODEL_PATH):
    model = Model(MODEL_PATH)
else:
    print(f"Ошибка: Модель не найдена в {MODEL_PATH}")

# Инициализация Natasha (NLP)
segmenter = Segmenter()
morph_vocab = MorphVocab()
emb = NewsEmbedding()
ner_tagger = NewsNERTagger(emb) # Исправлено имя

class TranscribeRequest(BaseModel):
    file_path: str

def analyze_pii(text):
    """Ищет ПДн и возвращает список найденных сущностей"""
    found_pii = []
    
    # 1. Регулярные выражения (ИНН, СНИЛС, Телефоны, Паспорт)
    patterns = {
        "PHONE": r"(\+7|8|7)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}",
        "PASSPORT": r"\b\d{4}\s\d{6}\b",
        "INN": r"\b\d{10}\b|\b\d{12}\b",
        "SNILS": r"\b\d{3}-\d{3}-\d{3}\s\d{2}\b",
        "EMAIL": r"[\w\.-]+@[\w\.-]+\.\w+"
    }
    
    for p_type, p_regex in patterns.items():
        matches = re.finditer(p_regex, text)
        for m in matches:
            found_pii.append({"type": p_type, "value": m.group()})

    # 2. Natasha NER (Имена, Адреса)
    doc = Doc(text)
    doc.segment(segmenter)
    doc.tag_ner(ner_tagger)
    
    for span in doc.spans:
        if span.type == 'PER':
            found_pii.append({"type": "NAME", "value": span.text})
        elif span.type == 'LOC':
            found_pii.append({"type": "ADDRESS", "value": span.text})
            
    return found_pii

@app.post("/transcribe")
async def transcribe(request: TranscribeRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Vosk модель не загружена")

    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail=f"Файл не найден: {request.file_path}")

    try:
        # 1. Загрузка аудио (AudioSegment сам определит m4a, mp3, wav через ffmpeg)
        audio = AudioSegment.from_file(request.file_path)
        
        # Сохраняем временную копию в PCM для Vosk
        temp_wav = "/tmp/to_vosk.wav"
        audio.set_frame_rate(16000).set_channels(1).set_sample_width(2).export(temp_wav, format="wav")

        # 2. Распознавание Vosk
        wf = wave.open(temp_wav, "rb")
        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetWords(True) 

        results = []
        while True:
            data = wf.readframes(4000)
            if len(data) == 0: break
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                if 'result' in res: results.extend(res['result'])
        
        final_res = json.loads(rec.FinalResult())
        if 'result' in final_res: results.extend(final_res['result'])
        wf.close()

        # 3. Обработка сегментов и "запикивание"
        segments = []
        # Важно: работаем с копией для редактирования
        redacted_audio = audio 
        
        # Группируем слова для контекста NER
        chunk_size = 7
        for i in range(0, len(results), chunk_size):
            chunk = results[i:i + chunk_size]
            original_text = " ".join([w['word'] for w in chunk])
            
            pii_list = analyze_pii(original_text)
            has_pii = len(pii_list) > 0
            
            start_time = chunk[0]['start']
            end_time = chunk[-1]['end']
            
            redacted_text = original_text
            if has_pii:
                redacted_text = "[ДАННЫЕ УДАЛЕНЫ]"
                
                # Переводим секунды в миллисекунды для pydub
                start_ms = int(start_time * 1000)
                end_ms = int(end_time * 1000)
                
                # Накладываем тишину на этот участок
                silence = AudioSegment.silent(duration=(end_ms - start_ms))
                redacted_audio = redacted_audio[:start_ms] + silence + redacted_audio[end_ms:]

            segments.append({
                "speaker": 1,
                "start": start_time,
                "end": end_time,
                "originalText": original_text,
                "redactedText": redacted_text,
                "containsPii": has_pii
            })

        # 4. Сохранение результата
        # Меняем папку /original/ на /redacted/ и форсируем расширение .wav
        base_redacted_path = request.file_path.replace("/original/", "/redacted/")
        redacted_file_path = os.path.splitext(base_redacted_path)[0] + ".wav"
        
        os.makedirs(os.path.dirname(redacted_file_path), exist_ok=True)
        
        # Экспортируем в WAV (самый надежный формат для плеереров)
        redacted_audio.export(redacted_file_path, format="wav")

        # Удаляем временный файл
        if os.path.exists(temp_wav): os.remove(temp_wav)

        return {
            "redactedAudioPath": redacted_file_path,
            "segments": segments
        }

    except Exception as e:
        print(f"Ошибка при обработке: {e}")
        raise HTTPException(status_code=500, detail=str(e))