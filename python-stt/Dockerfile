FROM python:3.10-slim

# Установка ffmpeg для работы со звуком
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Установка библиотек
RUN pip install fastapi uvicorn vosk natasha gigachat pydub python-multipart python-dotenv

COPY . .

# Ожидаем, что модель будет примонтирована или скопирована сюда
# Для хакатона лучше скачать vosk-model-small-ru и положить в папку python-stt/vosk-model

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]