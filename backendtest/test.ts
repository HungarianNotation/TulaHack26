// File: ./backendtest/test.ts
import fs from "fs";
import { authService } from "./api/auth-services";
import { callService } from "./api/call-services";
import { RegisterRequest } from "./api/types";

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function generateSilentWav(filePath: string) {
  const sampleRate = 16000;
  const durationSeconds = 2;
  const numSamples = sampleRate * durationSeconds;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  fs.writeFileSync(filePath, buffer);
}

const TEST_AUDIO_PATH = "./meow.mp3";
let isGeneratedSilentFile = false;

if (!fs.existsSync(TEST_AUDIO_PATH)) {
  console.log(
    "⚠️ Тестовый аудиофайл не найден. Создаю программно идеальный WAV (тишина 2 сек)...",
  );
  console.log(
    "💡 ВАЖНО: Так как файл состоит из тишины, Vosk ничего не распознает и PII не будет найдено!",
  );
  console.log(
    "💡 Чтобы реально протестировать цензуру с AI, положи файл с речью по пути ./meow.wav\n",
  );

  generateSilentWav(TEST_AUDIO_PATH);
  isGeneratedSilentFile = true;
}

async function runFullE2ETest() {
  console.log("🚀 ЗАПУСК ПОЛНОГО E2E ТЕСТА (Voice Redaction)...\n");

  const randomSuffix = Math.floor(Math.random() * 10000);
  const mockUser: RegisterRequest = {
    login: `operator_${randomSuffix}`,
    password: "secure_password_123",
    name: "Anna QA",
    company: "AituLabs",
  };

  try {
    // --- ШАГ 1: АВТОРИЗАЦИЯ ---
    console.log(`1️⃣ Регистрация и Вход [${mockUser.login}]`);
    const regData = await authService.register(mockUser);
    localStorage.setItem("jwt_token", regData.token);
    console.log("✅ Пользователь зарегистрирован, токен сохранен.");

    // --- ШАГ 2: ЗАГРУЗКА АУДИО В РЕЖИМЕ SMART ---
    const TARGET_MODE = "smart";
    console.log(
      `\n2️⃣ Загрузка файла на сервер (Режим обработки: ${TARGET_MODE.toUpperCase()})...`,
    );

    const uploadRes = await callService.uploadAudio(
      TEST_AUDIO_PATH,
      TARGET_MODE,
    );
    const recordId = uploadRes.callRecordId;
    console.log(
      `✅ Файл загружен. ID записи: ${recordId}. Сервер подтвердил режим: ${uploadRes.mode}`,
    );

    // --- ШАГ 3: ОЖИДАНИЕ ТРАНСКРИБАЦИИ ---
    console.log("\n3️⃣ Ожидание обработки (STT + GigaChat AI Redaction)...");
    let isCompleted = false;
    let attempts = 0;
    const maxAttempts = 30; // Увеличил лимит попыток, так как AI может отвечать чуть дольше

    while (!isCompleted && attempts < maxAttempts) {
      const details = await callService.getCallDetails(recordId);
      process.stdout.write(
        `⏳ Статус: ${details.callRecord.status} (Попытка ${attempts + 1}/${maxAttempts})...\r`,
      );

      if (details.callRecord.status === "COMPLETED") {
        isCompleted = true;
        console.log(`\n✅ Обработка завершена!`);
      } else if (details.callRecord.status === "ERROR") {
        throw new Error(
          "\n❌ Сервер вернул ошибку при обработке файла (смотри логи Python STT)!",
        );
      } else {
        await delay(3000);
        attempts++;
      }
    }

    if (!isCompleted)
      throw new Error("\n❌ Превышено время ожидания обработки.");

    // --- ШАГ 4: ПРОВЕРКА РЕЗУЛЬТАТОВ (ТРАНСКРИПТ) ---
    console.log("\n4️⃣ Проверка результатов транскрибации...");
    const finalDetails = await callService.getCallDetails(recordId);

    // Проверяем, что в базе сохранился правильный режим
    if (finalDetails.callRecord.processingMode !== TARGET_MODE.toUpperCase()) {
      console.log(
        `⚠️ ВНИМАНИЕ: Ожидался режим ${TARGET_MODE.toUpperCase()}, но сервер вернул ${finalDetails.callRecord.processingMode}`,
      );
    } else {
      console.log(
        `✅ Режим обработки сохранен корректно: ${finalDetails.callRecord.processingMode}`,
      );
    }

    console.log(
      `Всего найдено сегментов диалога: ${finalDetails.segments.length}`,
    );
    if (finalDetails.segments.length === 0) {
      console.log(
        "⚠️ Диалог пуст. (Это нормально, так как тестовый файл содержит тишину).",
      );
    }

    finalDetails.segments.forEach((seg) => {
      const speaker = seg.speakerId === 1 ? "Спикер 1" : "Спикер 2";
      const piiFlag = seg.containsPii
        ? `🔴 [PII: ${seg.piiTypes.join(", ")}]`
        : "🟢 [SAFE]";
      console.log(`[${seg.startTime} - ${seg.endTime}] ${speaker} ${piiFlag}:`);
      console.log(`   Оригинал: ${seg.originalText}`);
      if (seg.containsPii) {
        console.log(`   Цензура:  ${seg.redactedText}`);
      }
    });

    // --- ШАГ 5: ПРОВЕРКА СТАТИСТИКИ ---
    console.log("\n5️⃣ Проверка API Статистики...");
    const stats = await callService.getStats();
    console.log(`✅ Статистика получена:`);
    console.log(`   - Всего обработано звонков: ${stats.totalCallsProcessed}`);
    console.log(`   - Найдено инцидентов PII: ${stats.totalPiiIncidentsFound}`);
    console.log(
      `   - Распределение: ${JSON.stringify(stats.piiTypeDistribution)}`,
    );

    // --- ШАГ 6: СКАЧИВАНИЕ АУДИО ---
    console.log("\n6️⃣ Скачивание анонимизированного аудио...");
    const audioBuffer = await callService.getRedactedAudio(recordId);
    console.log(
      `✅ Аудио успешно скачано! Размер: ${audioBuffer.byteLength} байт.`,
    );

    // --- ШАГ 7: НЕГАТИВНЫЙ ТЕСТ ---
    console.log("\n7️⃣ Проверка обработки ошибок (404 Not Found)...");
    try {
      await callService.getCallDetails(9999999);
      throw new Error("Ожидалась ошибка 404, но сервер вернул 200!");
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log(
          "✅ Сервер корректно вернул 404 для неизвестного ID записи.",
        );
      } else {
        throw error;
      }
    }

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
    authService.logout();
    if (isGeneratedSilentFile && fs.existsSync(TEST_AUDIO_PATH)) {
      fs.unlinkSync(TEST_AUDIO_PATH);
    }
  }
}

runFullE2ETest();
