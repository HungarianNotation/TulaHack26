import { defineStore } from "pinia";
import { authService } from "@/api/auth-services";
import type { LoginRequest, RegisterRequest } from "@/api/types";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("jwt_token") || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(credentials: LoginRequest) {
      const res = await authService.login(credentials);
      this.token = res.token;
      localStorage.setItem("jwt_token", res.token);
    },
    async register(data: RegisterRequest) {
      const res = await authService.register(data);
      this.token = res.token;
      localStorage.setItem("jwt_token", res.token);
    },
    logout() {
      authService.logout();
      this.token = null;
    },
  },
});
