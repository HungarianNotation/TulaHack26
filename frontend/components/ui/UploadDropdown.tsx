'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { callService } from '@/services/call-services';

interface UploadDropdownProps {
    onSuccess: () => void;
}

export default function UploadDropdown({ onSuccess }: UploadDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Закрытие при клике вне dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
        alert('Пожалуйста, выберите аудиофайл (MP3, WAV, OGG, M4A)');
        return;
        }

        setIsUploading(true);
        try {
        await callService.uploadAudioFile(file);
        onSuccess();
        setIsOpen(false);
        } catch (err) {
        console.error('Upload failed:', err);
        alert('Ошибка при загрузке файла');
        } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
        {/* Кнопка-плюс */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="btn btn-primary btn-circle shadow-lg cursor-pointer"
            aria-label="Добавить запись"
            disabled={isUploading}
        >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload size={20} />}
        </button>

        {/* Dropdown меню */}
        {isOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-custom-bg-secondary rounded-card shadow-lg overflow-hidden z-20">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 text-left text-custom-main hover:bg-custom-accent/10 transition-colors flex items-center gap-2 cursor-pointer"
            >
                <Upload size={16} />
                Выбрать файл
            </button>
            {/* Можно добавить другие опции, например, запись, но у нас уже есть отдельная кнопка */}
            </div>
        )}

        {/* Скрытый input для выбора файла */}
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="audio/*"
            className="hidden"
        />
        </div>
    );
}