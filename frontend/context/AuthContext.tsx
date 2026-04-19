"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authService } from "@/services/auth-services";
import { useRouter } from "next/navigation";

interface User {
  login: string;
  name?: string;
  company?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: {
    login: string;
    password?: string;
    name?: string;
    company?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Утилиты для работы с куками
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    const login = localStorage.getItem("user_login");
    const name = localStorage.getItem("user_name") || undefined;
    const company = localStorage.getItem("user_company") || undefined;
    if (token && login) {
      setUser({ login, name, company });
    }
    setIsLoading(false);
  }, []);

  const login = async (login: string, password: string) => {
    const response = await authService.login({ login, password });

    // ИСПРАВЛЕНИЕ: Сохраняем токен и в localStorage (для клиента) и в куки (для SSR / route.ts)
    localStorage.setItem("jwt_token", response.token);
    setCookie("jwt_token", response.token);

    localStorage.setItem("user_login", login);
    setUser({ login, name: undefined, company: undefined });
  };

  const register = async (data: {
    login: string;
    password?: string;
    name?: string;
    company?: string;
  }) => {
    const response = await authService.register(data);

    // ИСПРАВЛЕНИЕ: Сохраняем токен и в localStorage, и в куки
    localStorage.setItem("jwt_token", response.token);
    setCookie("jwt_token", response.token);

    localStorage.setItem("user_login", data.login);
    if (data.name) localStorage.setItem("user_name", data.name);
    if (data.company) localStorage.setItem("user_company", data.company);
    setUser({ login: data.login, name: data.name, company: data.company });
  };

  const logout = () => {
    authService.logout();

    // Очищаем и localStorage, и куки
    localStorage.removeItem("user_login");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_company");
    localStorage.removeItem("jwt_token");
    deleteCookie("jwt_token");

    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
