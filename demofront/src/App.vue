<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <!-- Навигация показывается только если юзер залогинен -->
    <nav
      v-if="auth.isAuthenticated"
      class="bg-white border-b sticky top-0 z-50"
    >
      <div
        class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <div class="bg-blue-600 p-2 rounded-lg text-white font-bold">VA</div>
          <span class="text-xl font-bold tracking-tight">VoiceRedactor</span>
        </div>
        <div class="flex items-center gap-6">
          <router-link
            to="/"
            class="text-gray-600 hover:text-blue-600 font-medium"
            >Дашборд</router-link
          >
          <button
            @click="handleLogout"
            class="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md transition text-sm font-semibold"
          >
            Выйти
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-8 px-4">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "./stores/auth";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  auth.logout();
  router.push("/login");
};
</script>
