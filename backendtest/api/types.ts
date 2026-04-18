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
// File: ./backendtest/api/types.ts

// ... (предыдущие типы AuthResponse, RegisterRequest и т.д. остаются) ...

export type RecordStatus =
  | "UPLOADED"
  | "TRANSCRIBING"
  | "REDACTING"
  | "COMPLETED"
  | "ERROR";

export interface CallRecordDto {
  id: number;
  originalAudioPath: string;
  durationSeconds: number;
  status: RecordStatus;
  createdAt: string;
}

export interface TranscriptSegmentDto {
  id: number;
  speakerId: number;
  startTime: number;
  endTime: number;
  originalText: string;
  redactedText: string;
  containsPii: boolean;
}

export interface CallDetailsDto {
  callRecord: CallRecordDto;
  segments: TranscriptSegmentDto[];
}
