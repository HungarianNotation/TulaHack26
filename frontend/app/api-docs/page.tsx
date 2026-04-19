'use client';

import { useState } from 'react';
import { Key, Copy, Check, Sparkles } from 'lucide-react';

export default function ApiKeyPage() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generateApiKey = async () => {
        setIsLoading(true);
        setError(null);
        // Имитация запроса для получения API-ключа
        try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        // Генерируем случайный ключ
        const newKey = `audioshield_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 8)}`;
        setApiKey(newKey);
        } catch {
        setError('Не удалось получить API-ключ. Попробуйте позже.');
        } finally {
        setIsLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (apiKey) {
        await navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
        <div
            className="w-full max-w-md bg-custom-bg-secondary shadow-lg p-8"
            style={{ borderRadius: 'var(--radius-card)' }}
        >
            <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-custom-accent/10 mb-4">
                <Sparkles className="w-8 h-8 text-custom-accent" />
            </div>
            <h1 className="text-3xl font-bold text-custom-main mb-2">
                API-ключ сервиса
            </h1>
            <p className="text-sm text-custom-secondary">
                Для анонимизации голосовых данных получите персональный ключ доступа
            </p>
            </div>

            <div className="space-y-6">
            {/* Поле для отображения ключа */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-custom-secondary">
                <Key size={18} />
                </div>
                <input
                type="text"
                readOnly
                value={apiKey || ''}
                placeholder="Нажмите «Получить ключ»"
                className="w-full pl-10 pr-12 py-3 bg-transparent border-b border-custom-secondary/30 focus:border-custom-accent outline-none transition-colors text-custom-main placeholder:text-custom-placeholder cursor-default"
                />
                {apiKey && (
                <button
                    onClick={copyToClipboard}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-circle btn-secondary btn-sm"
                    type="button"
                    aria-label="Копировать ключ"
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                )}
            </div>

            {/* Кнопка генерации */}
            <button
                onClick={generateApiKey}
                disabled={isLoading}
                className="btn btn-primary w-full gap-2 mt-2"
            >
                {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
                ) : (
                <Key size={20} />
                )}
                {isLoading ? 'Генерация...' : 'Получить API-ключ'}
            </button>

            {/* Сообщение об ошибке */}
            {error && (
                <div className="bg-red-500/10 text-red-500 text-sm text-center py-2 rounded-full">
                {error}
                </div>
            )}

            {/* Информационная подсказка */}
            <div className="text-xs text-custom-secondary text-center pt-4 border-t border-custom-secondary/20">
                Ключ действует 30 дней. Храните его в безопасности и не передавайте третьим лицам.
            </div>
            </div>
        </div>
        </div>
    );
}