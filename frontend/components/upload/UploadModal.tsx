'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileAudio, Loader2 } from 'lucide-react';
import { callService } from '@/services/call-services';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen && dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
        } else if (!isOpen && dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
        }
    }, [isOpen]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile && selectedFile.type.startsWith('audio/')) {
        setFile(selectedFile);
        setError(null);
        } else {
        setError('Пожалуйста, выберите аудиофайл');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'] },
        maxFiles: 1,
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
        await callService.uploadAudioFile(file);
        onSuccess();
        handleClose();
        setFile(null);
        } catch (err) {
        console.error('Upload failed:', err);
        setError('Ошибка при загрузке файла. Попробуйте ещё раз.');
        } finally {
        setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setError(null);
        onClose();
    };

    return (
        <dialog
        ref={dialogRef}
        className="modal modal-middle"
        onClose={handleClose}
        >
        <div className="modal-box bg-custom-bg-main p-0 overflow-hidden max-w-md w-full shadow-xl">
            {/* Шапка */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-custom-secondary/20">
            <h3 className="text-xl font-bold text-custom-main">Загрузка аудиозаписи</h3>
            <button
                type="button"
                onClick={handleClose}
                className="btn btn-circle btn-secondary btn-sm cursor-pointer"
                disabled={isUploading}
            >
                <X size={18} />
            </button>
            </div>

            {/* Тело */}
            <div className="p-6">
            {!file ? (
                <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-card p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                    ? 'border-custom-accent bg-custom-accent/5'
                    : 'border-custom-secondary/30 hover:border-custom-accent/50'
                }`}
                >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-custom-secondary mx-auto mb-4" />
                <p className="text-custom-main text-base mb-2">
                    {isDragActive ? 'Отпустите файл здесь' : 'Перетащите аудиофайл сюда'}
                </p>
                <p className="text-custom-placeholder text-sm mb-4">
                    или нажмите для выбора из проводника
                </p>
                <p className="text-custom-placeholder text-xs">
                    Поддерживаемые форматы: MP3, WAV, OGG, M4A
                </p>
                </div>
            ) : (
                <div className="bg-custom-bg-main/50 rounded-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileAudio className="w-8 h-8 text-custom-accent" />
                    <div>
                    <p className="text-custom-main text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                    </p>
                    <p className="text-custom-placeholder text-xs">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    </div>
                </div>
                <button
                    onClick={() => setFile(null)}
                    className="btn btn-circle btn-secondary btn-sm cursor-pointer"
                    disabled={isUploading}
                >
                    <X size={16} />
                </button>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 text-red-500 text-sm text-center py-2 rounded-full mt-6">
                {error}
                </div>
            )}
            </div>

            {/* Футер с кнопками */}
            <div className="flex gap-3 p-6 pt-4 border-t border-custom-secondary/20">
            <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary flex-1 cursor-pointer"
                disabled={isUploading}
            >
                Отмена
            </button>
            <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`btn btn-primary flex-1 gap-2 cursor-pointer ${
                (!file || isUploading) && 'opacity-50 cursor-not-allowed'
                }`}
            >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isUploading ? 'Загрузка...' : 'Загрузить'}
            </button>
            </div>
        </div>

        {/* Бекдроп для закрытия по клику вне модалки */}
        <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={handleClose}>
            close
            </button>
        </form>
        </dialog>
    );
}