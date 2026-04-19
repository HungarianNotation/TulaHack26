import { apiClient } from "./auth-services";
import type { CallDetailsDto, CallRecordDto, StatsResponse } from "./types";

export const callService = {
  // 1. Загрузка файла через браузерный FormData
  async uploadAudio(
    file: File,
  ): Promise<{ message: string; callRecordId: number }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("calls/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async getMyCalls(): Promise<CallRecordDto[]> {
    const response = await apiClient.get<CallRecordDto[]>("calls/my");
    return response.data;
  },

  async getCallDetails(id: number): Promise<CallDetailsDto> {
    const response = await apiClient.get<CallDetailsDto>(`calls/${id}`);
    return response.data;
  },

  async getRedactedAudio(id: number): Promise<Blob> {
    const response = await apiClient.get(`calls/${id}/audio/redacted`, {
      responseType: "blob", // В браузере используем blob для аудио
    });
    return response.data;
  },

  async getStats(): Promise<StatsResponse> {
    const response = await apiClient.get<StatsResponse>("calls/stats");
    return response.data;
  },
};
