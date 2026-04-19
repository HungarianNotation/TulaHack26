'use client';

import { useEffect, useState } from 'react';
import { callService } from '@/services/call-services';
import { CallRecordDto } from '@/services/types';
import RecordingsList from '@/components/recordings/RecordingsList';
import UploadModal from '@/components/upload/UploadModal';
import AudioRecorderModal from '@/components/upload/AudioRecorderModal';
import UserCard from '@/components/profile/UserCard';
import { Plus, Mic } from 'lucide-react';
import StatsDashboard from "@/components/profile/StatsDashboard";


export default function ProfilePage() {
    const [calls, setCalls] = useState<CallRecordDto[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isRecorderModalOpen, setIsRecorderModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCalls = async () => {
        try {
        setIsLoading(true);
        const data = await callService.getMyCalls();
        setCalls(Array.isArray(data) ? data : []);
        setError(null);
        } catch (err) {
        console.error('Failed to fetch calls:', err);
        setError('Не удалось загрузить список записей');
        setCalls([]);
        } finally {
        setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCalls();
    }, []);

    const handleUploadSuccess = () => {
        fetchCalls();
    };

    return (
        <div className="min-h-screen px-8 py-6 md:px-12 md:py-8">
        <div className="mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-80 flex-1 flex-shrink-0 space-y-6">
                    <UserCard />
                    <StatsDashboard />
                </div>

                <div className="flex-3">
                    <div className="mb-4">
                    <h1 className="text-2xl font-bold text-custom-main">Мои записи</h1>
                    <p className="text-sm text-custom-secondary">
                        Управляйте аудиозаписями для анонимизации
                    </p>
                    </div>
                    <RecordingsList
                    calls={calls}
                    isLoading={isLoading}
                    error={error}
                    onRetry={fetchCalls}
                    />
                </div>
            </div>

            {/* Две кнопки вертикально */}
            <div className="fixed bottom-8 right-8 flex flex-col-reverse gap-3">
            {/* Микрофон - запись */}
            <button
                onClick={() => setIsRecorderModalOpen(true)}
                className="btn btn-primary btn-circle shadow-lg cursor-pointer"
                aria-label="Записать аудио"
            >
                <Mic size={24} />
            </button>

            {/* Плюс - загрузка файла */}
            <button
                onClick={() => setIsUploadModalOpen(true)}
                className="btn btn-primary btn-circle shadow-lg cursor-pointer"
                aria-label="Загрузить файл"
            >
                <Plus size={24} />
            </button>
            </div>

            <UploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onSuccess={handleUploadSuccess}
            />

            <AudioRecorderModal
            isOpen={isRecorderModalOpen}
            onClose={() => setIsRecorderModalOpen(false)}
            onSuccess={handleUploadSuccess}
            />
        </div>
        </div>
    );
}