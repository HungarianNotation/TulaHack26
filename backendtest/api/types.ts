// Авторизация
export interface AuthResponse {
  token: string;
}

export interface RegisterRequest {
  login: string;
  password?: string;
  name?: string;
  company?: string;
}

export interface LoginRequest {
  login: string;
  password?: string;
}

// Сущности БД (на будущее)
export interface User {
  id: number;
  login: string;
  name: string;
  company: string;
  apiToken: string;
}

export interface CallRecord {
  id: number;
  originalAudioPath: string;
  redactedAudioPath?: string;
  durationSeconds: number;
  status: "UPLOADED" | "TRANSCRIBING" | "REDACTING" | "COMPLETED" | "ERROR";
  createdAt: string;
}

export interface TestModel {
  id: number;
  name: string;
}
