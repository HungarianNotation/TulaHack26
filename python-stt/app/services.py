import os
from vosk import Model

# Инициализация Vosk
MODEL_PATH = "/app/vosk-model"
model = None
if os.path.exists(MODEL_PATH):
    model = Model(MODEL_PATH)
else:
    print(f"Ошибка: Модель не найдена в {MODEL_PATH}")

def get_vosk_model():
    return model
