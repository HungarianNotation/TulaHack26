FROM python:3.10-slim

# Устанавливаем ffmpeg для конвертации аудио (pydub под капотом использует его)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Ожидаем, что модель будет примонтирована или скопирована сюда
# Для хакатона лучше скачать vosk-model-small-ru и положить в папку python-stt/vosk-model

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]