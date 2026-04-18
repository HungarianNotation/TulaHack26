import os
import json
import wave
import re
from fastapi import APIRouter
from pydub import AudioSegment
from vosk import Model, KaldiRecognizer
from .pii_analysis import find_pii_words, find_pii_words_smart
from .models import TranscribeRequest

router = APIRouter()

MODEL_PATH = "vosk-model"
BASE_UPLOADS_DIR = "/app/uploads" 

if not os.path.exists(MODEL_PATH):
    raise Exception(f"Vosk model not found at {os.path.abspath(MODEL_PATH)}!")

model = Model(MODEL_PATH)

@router.post("/transcribe")
async def transcribe_audio(request: TranscribeRequest):
    try:
        result = transcribe(request.file_path, request.mode.value)
        return result
    except Exception as e:
        print(f"Global Error: {e}")
        return {"status": "FAILED", "error": str(e)}

def transcribe(file_path, mode="turbo"):
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Файл не найден: {file_path}")

        audio = AudioSegment.from_file(file_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        
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

        # Выбор режима анализа PII
        if mode == "smart":
            print("Используется SMART режим (GigaChat)")
            pii_map = find_pii_words_smart(results)
        else:
            print("Используется TURBO режим (Natasha)")
            pii_map = find_pii_words(results)
        
        redacted_audio = audio 
        
        for word_idx in pii_map.keys():
            w = results[word_idx]
            start_ms = int(w['start'] * 1000)
            end_ms = int(w['end'] * 1000)
            
            if end_ms > len(redacted_audio): end_ms = len(redacted_audio)
            
            duration = end_ms - start_ms
            if duration > 0:
                silence = AudioSegment.silent(duration=duration)
                redacted_audio = redacted_audio[:start_ms] + silence + redacted_audio[end_ms:]

        segments = []
        chunk_size = 15
        
        for i in range(0, len(results), chunk_size):
            chunk = results[i:i + chunk_size]
            chunk_pii_types = set()
            original_parts = []
            redacted_parts = []
            is_prev_pii = False
            
            for j, w in enumerate(chunk):
                idx = i + j
                word_text = w['word']
                original_parts.append(word_text)
                
                if idx in pii_map:
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

        redacted_dir = os.path.join(BASE_UPLOADS_DIR, "redacted")
        os.makedirs(redacted_dir, exist_ok=True)
        
        filename = os.path.basename(file_path)
        redacted_filename = f"redacted_{os.path.splitext(filename)[0]}.wav"
        redacted_path = os.path.join(redacted_dir, redacted_filename)
        
        redacted_audio.export(redacted_path, format="wav")

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
        raise e