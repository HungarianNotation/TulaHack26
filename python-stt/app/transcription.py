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
# Базовая директория для работы с файлами (монтируется в Docker)
BASE_UPLOADS_DIR = "/app/uploads" 

if not os.path.exists(MODEL_PATH):
    raise Exception(f"Vosk model not found at {os.path.abspath(MODEL_PATH)}!")

# Глобальная инициализация модели
model = Model(MODEL_PATH)

@router.post("/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    try:
        # Принимаем путь от Java, например /app/uploads/original/filename.mp3
        result = transcribe(request.file_path)
        return result
    except Exception as e:
        print(f"Global Error: {e}")
        return {"status": "FAILED", "error": str(e)}

def transcribe(file_path):
    try:
        # 1. Подготовка аудио (Конвертация в PCM 16kHz Mono)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл не найден: {file_path}")

        audio = AudioSegment.from_file(file_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        
        # Создаем временный WAV для Vosk
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

        # 2. Анализ PII (вызов логики из pii_analysis.py)
        pii_map = find_pii_words(results)
        
        # 3. Анонимизация аудио (Заглушаем сегменты тишиной)
        # Работаем с копией аудио
        redacted_audio = audio 
        
        for word_idx in pii_map.keys():
            w = results[word_idx]
            # Переводим секунды в миллисекунды
            start_ms = int(w['start'] * 1000)
            end_ms = int(w['end'] * 1000)
            
            if end_ms > len(redacted_audio): end_ms = len(redacted_audio)
            
            # Создаем отрезок тишины нужной длины
            duration = end_ms - start_ms
            if duration > 0:
                silence = AudioSegment.silent(duration=duration)
                redacted_audio = redacted_audio[:start_ms] + silence + redacted_audio[end_ms:]

        # 4. Формирование сегментов транскрипта для фронтенда
        segments = []
        chunk_size = 15 # Группируем слова по предложениям
        
        for i in range(0, len(results), chunk_size):
            chunk = results[i:i + chunk_size]
            chunk_pii_types = set()
            original_parts = []
            redacted_parts = []
            
            is_prev_pii = False # Для группировки плашек [УДАЛЕНО]
            
            for j, w in enumerate(chunk):
                idx = i + j
                word_text = w['word']
                original_parts.append(word_text)
                
                if idx in pii_map:
                    # Если это первое слово в цепочке PII — добавляем плашку
                    if not is_prev_pii:
                        redacted_parts.append("[ДАННЫЕ УДАЛЕНЫ]")
                    
                    chunk_pii_types.update(pii_map[idx])
                    is_prev_pii = True
                else:
                    redacted_parts.append(word_text)
                    is_prev_pii = False
            
            red_text = " ".join(redacted_parts)

            segments.append({
                "speaker": 1,
                "start": chunk[0]['start'],
                "end": chunk[-1]['end'],
                "originalText": " ".join(original_parts),
                "redactedText": red_text,
                "containsPii": len(chunk_pii_types) > 0,
                "piiTypes": list(chunk_pii_types)
            })

        # 5. Сохранение анонимизированного аудио
        redacted_dir = os.path.join(BASE_UPLOADS_DIR, "redacted")
        os.makedirs(redacted_dir, exist_ok=True)
        
        filename = os.path.basename(file_path)
        # Сохраняем как wav для лучшей совместимости
        redacted_filename = f"redacted_{os.path.splitext(filename)[0]}.wav"
        redacted_path = os.path.join(redacted_dir, redacted_filename)
        
        redacted_audio.export(redacted_path, format="wav")

        # 6. Сбор итоговой статистики для Java
        total_pii_count = 0
        pii_dist = {}
        for seg in segments:
            if seg["containsPii"]:
                for t in seg["piiTypes"]:
                    pii_dist[t] = pii_dist.get(t, 0) + 1
                    total_pii_count += 1

        return {
            "status": "COMPLETED",
            "segments": segments,
            "redactedAudioPath": os.path.abspath(redacted_path),
            "stats": {
                "total_incidents": total_pii_count,
                "distribution": pii_dist
            }
        }

    except Exception as e:
        print(f"STT Error: {e}")
        # Прокидываем ошибку дальше, чтобы FastAPI вернул её
        raise e