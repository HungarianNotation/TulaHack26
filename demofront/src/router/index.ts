// File: ./router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue"; // <-- Добавили импорт
import DashboardView from "@/views/DashboardView.vue";
import CallDetail from "@/views/CallDetail.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginView },
    { path: "/register", component: RegisterView }, // <-- Добавили роут
    { path: "/", component: DashboardView, meta: { requiresAuth: true } },
    { path: "/call/:id", component: CallDetail, meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  // Если нужна авторизация, но пользователь не залогинен — кидаем на логин
  if (to.meta.requiresAuth && !auth.isAuthenticated) return "/login";

  // Опционально: если залогинен и пытается зайти на логин/регистрацию — кидаем на главную
  if (
    (to.path === "/login" || to.path === "/register") &&
    auth.isAuthenticated
  ) {
    return "/";
  }
});

export default router;
