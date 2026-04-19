import { apiClient } from "./auth-services";
import { CallDetailsDto, CallRecordDto, StatsResponse } from "./types";

export const callService = {
    async uploadAudioFile(file: File): Promise<{ message: string; callRecordId: number }> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post<{ message: string; callRecordId: number }>(
        "calls/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
        );
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

    async getRedactedAudio(id: number): Promise<Buffer> {
        const response = await apiClient.get(`calls/${id}/audio/redacted`, {
        responseType: "arraybuffer",
        });
        return response.data;
    },

    async getStats(): Promise<StatsResponse> {
        const response = await apiClient.get<StatsResponse>("calls/stats");
        return response.data;
    },

    async getOriginalAudio(id: number): Promise<ArrayBuffer> {
        const response = await apiClient.get(`calls/${id}/audio/original`, {
            responseType: "arraybuffer",
        });
        return response.data;
    }
};