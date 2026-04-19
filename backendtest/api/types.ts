// File: ./backendtest/api/types.ts

// --- Авторизация ---
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

// --- Сущности API ---
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
  piiTypes: string[]; // <-- ДОБАВЛЕНО ПОЛЕ
}

export interface CallDetailsDto {
  callRecord: CallRecordDto;
  segments: TranscriptSegmentDto[];
}

// --- Статистика ---
export interface StatsResponse {
  totalCallsProcessed: number;
  totalPiiIncidentsFound: number;
  piiTypeDistribution: Record<string, number>;
}
