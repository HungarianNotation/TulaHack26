import { apiClient } from "./auth-services";
import { CallDetailsDto, CallRecordDto, StatsResponse } from "./types";

export const callService = {
  async uploadAudioFile(
    file: File,
  ): Promise<{ message: string; callRecordId: number }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{
      message: string;
      callRecordId: number;
    }>("calls/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async getMyCalls(): Promise<CallRecordDto[]> {
    // Добавляем очистку кэша и для списка звонков, чтобы статусы обновлялись сразу
    const response = await apiClient.get<CallRecordDto[]>(
      `calls/my?t=${Date.now()}`,
    );
    return response.data;
  },

  async getCallDetails(id: number): Promise<CallDetailsDto> {
    const response = await apiClient.get<CallDetailsDto>(
      `calls/${id}?t=${Date.now()}`,
    );
    return response.data;
  },

  async getRedactedAudio(id: number): Promise<Buffer> {
    // ВАЖНО: Добавляем ?t=Date.now() чтобы заставить браузер скачать файл заново
    const response = await apiClient.get(
      `calls/${id}/audio/redacted?t=${Date.now()}`,
      {
        responseType: "arraybuffer",
      },
    );
    return response.data;
  },

  async getStats(): Promise<StatsResponse> {
    const response = await apiClient.get<StatsResponse>(
      `calls/stats?t=${Date.now()}`,
    );
    return response.data;
  },

  async getOriginalAudio(id: number): Promise<ArrayBuffer> {
    // ВАЖНО: Добавляем ?t=Date.now() чтобы заставить браузер скачать файл заново
    const response = await apiClient.get(
      `calls/${id}/audio/original?t=${Date.now()}`,
      {
        responseType: "arraybuffer",
      },
    );
    return response.data;
  },
};
