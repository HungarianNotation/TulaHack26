import os
import json
import wave
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pydub import AudioSegment
from vosk import Model, KaldiRecognizer

app = FastAPI()

# Путь, по которому мы ожидаем распакованную модель Vosk
MODEL_PATH = "/app/vosk-model"

# Ленивая загрузка модели (чтобы сервис стартовал, даже если модель забыли положить, 
# но падал при попытке распознавания с понятной ошибкой)
model = None
if os.path.exists(MODEL_PATH):
    model = Model(MODEL_PATH)
    print("Vosk модель успешно загружена.")
else:
    print(f"ВНИМАНИЕ: Модель не найдена по пути {MODEL_PATH}")

class TranscribeRequest(BaseModel):
    file_path: str

@app.post("/transcribe")
async def transcribe(request: TranscribeRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Vosk модель не загружена на сервере")

    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail=f"Файл не найден: {request.file_path}")

    try:
        # 1. Конвертация аудио в нужный формат (16kHz, Mono, PCM)
        print(f"Конвертация файла {request.file_path}...")
        audio = AudioSegment.from_file(request.file_path)
        audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        
        temp_wav = "/tmp/converted.wav"
        audio.export(temp_wav, format="wav")

        # 2. Распознавание через Vosk
        wf = wave.open(temp_wav, "rb")
        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetWords(True)

        results = []
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                if 'result' in res:
                    results.extend(res['result'])

        # Обработка последнего куска
        res = json.loads(rec.FinalResult())
        if 'result' in res:
            results.extend(res['result'])

        # 3. Формируем ответ (упрощенная сегментация по 5-10 слов или паузам)
        segments = []
        if results:
            current_sentence = []
            start_time = results[0]['start']
            
            for word in results:
                current_sentence.append(word['word'])
                # Если это конец фразы (упрощенно бьем по длине или просто отдаем всё как 1 кусок)
                # Для демо сделаем каждый результат отдельным "сегментом", либо объединим:
            
            # Для упрощения демо: вернем весь текст одним сегментом, 
            # либо разделим на куски по 5 секунд.
            segments.append({
                "speaker": 1, # Пока заглушка для спикера (Vosk Spk требует отдельной модели)
                "start": results[0]['start'],
                "end": results[-1]['end'],
                "text": " ".join(current_sentence)
            })

        # Удаляем временный файл
        os.remove(temp_wav)

        return segments

    except Exception as e:
        print(f"Ошибка распознавания: {e}")
        raise HTTPException(status_code=500, detail=str(e))