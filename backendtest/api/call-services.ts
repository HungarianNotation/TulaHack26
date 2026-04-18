// File: ./backendtest/api/call-services.ts
import FormData from "form-data";
import fs from "fs";
import { apiClient } from "./auth-services";
import { CallDetailsDto, CallRecordDto } from "./types";

export const callService = {
  // 1. Загрузка файла
  async uploadAudio(
    filePath: string,
  ): Promise<{ message: string; callRecordId: number }> {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const response = await apiClient.post<{
      message: string;
      callRecordId: number;
    }>("calls/upload", formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
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

  // 4. Скачивание/проверка анонимизированного аудио
  async getRedactedAudio(id: number): Promise<Buffer> {
    const response = await apiClient.get(`calls/${id}/audio/redacted`, {
      responseType: "arraybuffer", // Получаем как бинарные данные
    });
    return response.data;
  },
};
