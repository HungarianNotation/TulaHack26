import axios from "axios";
import {
    AuthResponse,
    RegisterRequest,
    LoginRequest,
    TestModel,
} from "./types";


const API_URL = "http://localhost:8080/api/";

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    if (typeof localStorage !== "undefined") {
        const token = localStorage.getItem("jwt_token");
        if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export const authService = {
    async register(data: RegisterRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>("auth/register", data);
        return response.data;
    },

    // Логин
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>("auth/login", data);
        return response.data;
    },

    // Выход
    logout(): void {
        if (typeof localStorage !== "undefined") {
        localStorage.removeItem("jwt_token");
        }
    },
};

export const testService = {
    // Получение тестовых данных (защищенный роут)
    async getTestData(): Promise<TestModel[]> {
        const response = await apiClient.get<TestModel[]>("test");
        return response.data;
    },
};
