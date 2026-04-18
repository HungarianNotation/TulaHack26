# File: ./python-stt/app/transcription.py
import os
import json
import wave
import re
from fastapi import APIRouter
from pydub import AudioSegment
from vosk import Model, KaldiRecognizer
from .pii_analysis import find_pii_words
from .models import TranscribeRequest

router = APIRouter()

MODEL_PATH = "vosk-model"
# Указываем базовую директорию для сохранения (синхронно с Java)
# Если Java хранит в /app/uploads/original, мы будем в /app/uploads/redacted
BASE_UPLOADS_DIR = "/app/uploads" 

if not os.path.exists(MODEL_PATH):
    raise Exception(f"Vosk model not found at {os.path.abspath(MODEL_PATH)}!")

model = Model(MODEL_PATH)

@router.post("/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    try:
        # Важно: Java передает абсолютный путь, например /app/uploads/original/file.m4a
        result = transcribe(request.file_path)
        return result
    except Exception as e:
        print(f"Global Error: {e}")
        return {"status": "FAILED", "error": str(e)}

def transcribe(file_path):
    try:
        # 1. Загрузка и подготовка
        audio = AudioSegment.from_file(file_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        
        # Временный wav для Vosk (в той же папке, что и оригинал)
        temp_wav = f"{file_path}_tmp.wav"
        audio.export(temp_wav, format="wav")

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
        if os.path.exists(temp_wav): os.remove(temp_wav)

        if not results:
            return {"status": "COMPLETED", "segments": [], "redactedAudioPath": None}

        # 2. Анализ PII
        pii_map = find_pii_words(results)
        redacted_audio = audio 
        
        for word_idx in pii_map.keys():
            w = results[word_idx]
            start_ms = int(w['start'] * 1000)
            end_ms = int(w['end'] * 1000)
            if end_ms > len(redacted_audio): end_ms = len(redacted_audio)
                
            silence = AudioSegment.silent(duration=(end_ms - start_ms))
            redacted_audio = redacted_audio[:start_ms] + silence + redacted_audio[end_ms:]

        # 3. Сегментация для UI
        segments = []
        chunk_size = 15 
        for i in range(0, len(results), chunk_size):
            chunk = results[i:i + chunk_size]
            chunk_pii_types = set()
            original_parts = []
            redacted_parts = []
            
            for j, w in enumerate(chunk):
                idx = i + j
                original_parts.append(w['word'])
                if idx in pii_map:
                    redacted_parts.append("[УДАЛЕНО]")
                    chunk_pii_types.update(pii_map[idx])
                else:
                    redacted_parts.append(w['word'])
            
            red_text = " ".join(redacted_parts)
            red_text = re.sub(r'(\[УДАЛЕНО\]\s*)+', '[ДАННЫЕ УДАЛЕНЫ] ', red_text).strip()

            segments.append({
                "speaker": 1,
                "start": chunk[0]['start'],
                "end": chunk[-1]['end'],
                "originalText": " ".join(original_parts),
                "redactedText": red_text,
                "containsPii": len(chunk_pii_types) > 0,
                "piiTypes": list(chunk_pii_types)
            })

        # 4. Сохранение в общую с Java директорию
        # Определяем путь: берем имя файла и кладем в /app/uploads/redacted/
        redacted_dir = os.path.join(BASE_UPLOADS_DIR, "redacted")
        os.makedirs(redacted_dir, exist_ok=True)
        
        filename = os.path.basename(file_path)
        redacted_filename = f"redacted_{filename}.wav"
        redacted_path = os.path.join(redacted_dir, redacted_filename)
        
        redacted_audio.export(redacted_path, format="wav")

        # 5. Итог (возвращаем АБСОЛЮТНЫЙ путь для Java)
        pii_counts = {}
        for seg in segments:
            for p_type in seg["piiTypes"]:
                pii_counts[p_type] = pii_counts.get(p_type, 0) + 1

        return {
            "status": "COMPLETED",
            "segments": segments,
            "redactedAudioPath": os.path.abspath(redacted_path),
            "stats": {
                "total_incidents": sum(pii_counts.values()),
                "distribution": pii_counts
            }
        }

    except Exception as e:
        print(f"STT Error: {e}")
        raise e