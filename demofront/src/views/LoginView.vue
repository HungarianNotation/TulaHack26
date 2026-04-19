<!-- File: ./views/LoginView.vue -->
<template>
  <div
    class="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100 via-gray-50 to-white px-4 relative overflow-hidden"
  >
    <!-- Декоративные элементы на фоне -->
    <div
      class="absolute -top-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"
    ></div>
    <div
      class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"
    ></div>

    <div
      class="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl shadow-blue-900/5 border border-white w-full max-w-md relative z-10"
    >
      <!-- Шапка -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-2xl mb-5 shadow-lg shadow-blue-200 transform transition hover:scale-105"
        >
          VA
        </div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">
          С возвращением!
        </h1>
        <p class="text-gray-500 mt-2 text-sm">Войдите в систему анонимизации</p>
      </div>

      <!-- Форма -->
      <form @submit.prevent="onLogin" class="space-y-5">
        <div>
          <label
            class="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1 tracking-wider"
            >Логин</label
          >
          <div class="relative">
            <div
              class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"
            >
              <MailIcon class="w-5 h-5" />
            </div>
            <input
              v-model="form.login"
              type="text"
              required
              placeholder="email@example.com"
              class="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-700"
            />
          </div>
        </div>

        <div>
          <label
            class="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1 tracking-wider"
            >Пароль</label
          >
          <div class="relative">
            <div
              class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"
            >
              <LockIcon class="w-5 h-5" />
            </div>
            <input
              v-model="form.password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-gray-700"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white mt-2 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Loader2Icon v-if="isLoading" class="w-5 h-5 animate-spin" />
          <span v-else>Войти</span>
        </button>
      </form>

      <!-- Ссылка на регистрацию -->
      <p class="text-center text-sm text-gray-500 mt-8">
        Нет аккаунта?
        <router-link
          to="/register"
          class="font-bold text-blue-600 hover:text-indigo-600 hover:underline transition"
        >
          Зарегистрироваться
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import { MailIcon, LockIcon, Loader2Icon } from "lucide-vue-next";

const auth = useAuthStore();
const router = useRouter();
const isLoading = ref(false);
const form = ref({ login: "", password: "" });

const onLogin = async () => {
  try {
    isLoading.value = true;
    await auth.login(form.value);
    router.push("/");
  } catch (e) {
    alert("Ошибка авторизации. Проверьте логин и пароль.");
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
</style>
