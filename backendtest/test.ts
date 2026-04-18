// File: ./backendtest/test.ts
import fs from "fs";
import { authService } from "./api/auth-services";
import { callService } from "./api/call-services";
import { RegisterRequest } from "./api/types";

// Эмуляция localStorage (оставляем как было)
if (typeof localStorage === "undefined") {
  const storage: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => storage[k] || null,
    setItem: (k: string, v: string) => {
      storage[k] = v;
    },
    removeItem: (k: string) => {
      delete storage[k];
    },
  };
}

// Вспомогательная функция для ожидания (sleep)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Создаем тестовый файл, если его нет
const TEST_AUDIO_PATH = "./meow.m4a";
if (!fs.existsSync(TEST_AUDIO_PATH)) {
  console.log("⚠️ Тестовый аудиофайл не найден. Создаю валидный пустой WAV...");
  // Байт-код минимального валидного WAV файла (1 секунда тишины)
  const silentWav = Buffer.from(
    "UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA== ",
    "base64",
  );
  fs.writeFileSync(TEST_AUDIO_PATH, silentWav);
}

async function runFullE2ETest() {
  console.log("🚀 ЗАПУСК ПОЛНОГО E2E ТЕСТА (Voice Redaction)...\n");

  const randomSuffix = Math.floor(Math.random() * 10000);
  const mockUser: RegisterRequest = {
    login: `operator_${randomSuffix}`,
    password: "secure_password_123",
    name: "Anna",
    company: "AituLabs",
  };

  try {
    // --- ШАГ 1: АВТОРИЗАЦИЯ ---
    console.log(`1️⃣ Регистрация и Вход [${mockUser.login}]`);
    const regData = await authService.register(mockUser);
    localStorage.setItem("jwt_token", regData.token);
    console.log("✅ Пользователь зарегистрирован, токен сохранен.");

    // --- ШАГ 2: ЗАГРУЗКА АУДИО ---
    console.log(`\n2️⃣ Загрузка файла ${TEST_AUDIO_PATH} на сервер...`);
    const uploadRes = await callService.uploadAudio(TEST_AUDIO_PATH);
    const recordId = uploadRes.callRecordId;
    console.log(`✅ Файл загружен. ID записи: ${recordId}`);

    // --- ШАГ 3: ОЖИДАНИЕ ТРАНСКРИБАЦИИ (POLLING) ---
    console.log("\n3️⃣ Ожидание обработки (STT + PII Redaction)...");
    let isCompleted = false;
    let attempts = 0;
    const maxAttempts = 15; // Ждем максимум 30 секунд (15 попыток * 2 сек)

    while (!isCompleted && attempts < maxAttempts) {
      const details = await callService.getCallDetails(recordId);
      process.stdout.write(`⏳ Статус: ${details.callRecord.status}...\r`);

      if (details.callRecord.status === "COMPLETED") {
        isCompleted = true;
        console.log(`\n✅ Обработка завершена!`);
      } else if (details.callRecord.status === "ERROR") {
        throw new Error("❌ Сервер вернул ошибку при обработке файла!");
      } else {
        await delay(2000); // Ждем 2 секунды перед следующим запросом
        attempts++;
      }
    }

    if (!isCompleted) throw new Error("❌ Превышено время ожидания обработки.");

    // --- ШАГ 4: ПРОВЕРКА РЕЗУЛЬТАТОВ (ТРАНСКРИПТ) ---
    console.log("\n4️⃣ Проверка результатов транскрибации...");
    const finalDetails = await callService.getCallDetails(recordId);

    console.log(
      `Всего найдено сегментов диалога: ${finalDetails.segments.length}`,
    );

    // Выводим диалог в консоль для наглядности
    finalDetails.segments.forEach((seg) => {
      const speaker = seg.speakerId === 1 ? "Клиент" : "Оператор";
      const piiFlag = seg.containsPii ? "🔴 [PII FOUND]" : "🟢 [SAFE]";
      console.log(`[${seg.startTime} - ${seg.endTime}] ${speaker} ${piiFlag}:`);
      console.log(`   Оригинал: ${seg.originalText}`);
      if (seg.containsPii) {
        console.log(`   Цензура:  ${seg.redactedText}`);
      }
    });

    // --- ШАГ 5: ПРОВЕРКА АНОНИМИЗИРОВАННОГО АУДИО ---
    console.log("\n5️⃣ Скачивание анонимизированного аудио...");
    const audioBuffer = await callService.getRedactedAudio(recordId);
    console.log(
      `✅ Аудио успешно скачано! Размер: ${audioBuffer.byteLength} байт.`,
    );

    // Успешный конец
    console.log(
      "\n🏁 E2E ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО! ВСЕ СИСТЕМЫ РАБОТАЮТ!",
    );
  } catch (error: any) {
    console.error("\n❌ ТЕСТ ПРОВАЛЕН:");
    if (error.response) {
      console.error(
        `Status: ${error.response.status} ${error.response.statusText}`,
      );
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  } finally {
    // Чистим за собой
    authService.logout();
    if (fs.readFileSync(TEST_AUDIO_PATH, "utf-8") === "dummy audio content") {
      fs.unlinkSync(TEST_AUDIO_PATH);
    }
  }
}

runFullE2ETest();
