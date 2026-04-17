import { authService, testService } from "./api/auth-services";
import { RegisterRequest } from "./api/types";

/**
 * Эмуляция localStorage для работы в Node.js (tsx/ts-node).
 * В браузере этот блок будет проигнорирован.
 */
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
    clear: () => {
      /* не используется в тесте */
    },
  };
}

async function runFullTest() {
  console.log("🚀 Запуск полного теста API...");

  // Генерация случайного логина, чтобы не ловить ошибку "User already exists"
  const randomSuffix = Math.floor(Math.random() * 10000);
  const mockUser: RegisterRequest = {
    login: `frontend_dev_${randomSuffix}`,
    password: "secure_password_123",
    name: "Maxim",
    company: "TulaHack",
  };

  try {
    // --- ШАГ 1: РЕГИСТРАЦИЯ ---
    console.log(`\n1. Регистрация пользователя [${mockUser.login}]...`);
    const regData = await authService.register(mockUser);

    // Сохраняем токен в localStorage (имитация поведения браузера)
    localStorage.setItem("jwt_token", regData.token);
    console.log("✅ Успех! JWT получен и сохранен в хранилище.");

    // --- ШАГ 2: ПОВТОРНЫЙ ВХОД (ЛОГИН) ---
    console.log("\n2. Проверка входа (login)...");
    const loginData = await authService.login({
      login: mockUser.login,
      password: mockUser.password,
    });

    if (loginData.token) {
      console.log("✅ Вход выполнен успешно.");
    }

    // --- ШАГ 3: ЗАПРОС ЗАЩИЩЕННЫХ ДАННЫХ ---
    console.log("\n3. Запрос защищенных данных (/api/test)...");
    const data = await testService.getTestData();

    console.log("✅ Доступ разрешен!");
    console.log("Результат из БД:", data);

    // --- ШАГ 4: ПРОВЕРКА ВЫХОДА ---
    console.log("\n4. Проверка выхода...");
    authService.logout();
    console.log("✅ Токен удален из localStorage.");
  } catch (error: any) {
    console.error("\n❌ ТЕСТ ПРОВАЛЕН:");
    if (error.response) {
      console.error(`Статус: ${error.response.status}`);
      console.error(
        `Данные ошибки:`,
        JSON.stringify(error.response.data, null, 2),
      );
      console.error(`URL запроса: ${error.config.url}`);
    } else {
      console.error(`Ошибка сети или кода: ${error.message}`);
    }
    process.exit(1); // Выход с ошибкой
  }

  console.log("\n🏁 Тестирование завершено успешно!");
}

// Запуск
runFullTest();
