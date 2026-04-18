import FormData from "form-data";
import fs from "fs";
import { apiClient } from "./auth-services";
import { CallDetailsDto, CallRecordDto, StatsResponse } from "./types";

export const callService = {
    // Загрузка файла
    async uploadAudio(
        filePath: string,
    ): Promise<{ message: string; callRecordId: number }> {
        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));

        const response = await apiClient.post<{
        message: string;
        callRecordId: number;
        }>("calls/upload", formData, { headers: { ...formData.getHeaders() } });
        return response.data;
    },

    // Получение всех звонков
    async getMyCalls(): Promise<CallRecordDto[]> {
        const response = await apiClient.get<CallRecordDto[]>("calls/my");
        return response.data;
    },

    // Получение деталей звонка (с транскриптом)
    async getCallDetails(id: number): Promise<CallDetailsDto> {
        const response = await apiClient.get<CallDetailsDto>(`calls/${id}`);
        return response.data;
    },

    // Скачивание анонимизированного аудио
    async getRedactedAudio(id: number): Promise<Buffer> {
        const response = await apiClient.get(`calls/${id}/audio/redacted`, {
        responseType: "arraybuffer",
        });
        return response.data;
    },

    // Получение статистики (ДОБАВЛЕНО)
    async getStats(): Promise<StatsResponse> {
        const response = await apiClient.get<StatsResponse>("calls/stats");
        return response.data;
    },
};
