// File: ./backendtest/api/call-services.ts
import FormData from "form-data";
import fs from "fs";
import { apiClient } from "./auth-services";
import { CallDetailsDto, CallRecordDto, StatsResponse } from "./types";

export const callService = {
  // 1. Загрузка файла (ДОБАВЛЕН ВЫБОР РЕЖИМА)
  async uploadAudio(
    filePath: string,
    mode: "turbo" | "smart" = "turbo", // По умолчанию используем turbo
  ): Promise<{ message: string; callRecordId: number; mode: string }> {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    formData.append("mode", mode); // Передаем режим на бэкенд

    const response = await apiClient.post<{
      message: string;
      callRecordId: number;
      mode: string;
    }>("calls/upload", formData, { headers: { ...formData.getHeaders() } });
    return response.data;
  },

  // 2. Получение всех звонков
  async getMyCalls(): Promise<CallRecordDto[]> {
    const response = await apiClient.get<CallRecordDto[]>("calls/my");
    return response.data;
  },

  // 3. Получение деталей звонка (с транскриптом)
  async getCallDetails(id: number): Promise<CallDetailsDto> {
    const response = await apiClient.get<CallDetailsDto>(`calls/${id}`);
    return response.data;
  },

  // 4. Скачивание анонимизированного аудио
  async getRedactedAudio(id: number): Promise<Buffer> {
    const response = await apiClient.get(`calls/${id}/audio/redacted`, {
      responseType: "arraybuffer",
    });
    return response.data;
  },

  // 5. Получение статистики
  async getStats(): Promise<StatsResponse> {
    const response = await apiClient.get<StatsResponse>("calls/stats");
    return response.data;
  },
};
