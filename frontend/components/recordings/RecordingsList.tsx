'use client';

import { useEffect, useState, useRef } from 'react';
import { CallRecordDto, CallDetailsDto } from '@/services/types';
import { callService } from '@/services/call-services';
import { WaveformPlayer } from '@/components/WaveformPlayer';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2, AlertCircle, CheckCircle, Clock, Download, ChevronDown, ChevronUp } from 'lucide-react';

interface RecordingsListProps {
    calls: CallRecordDto[] | undefined;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
}

const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getStatusConfig = (status: CallRecordDto['status']) => {
    switch (status) {
        case 'COMPLETED':
            return { icon: CheckCircle, text: 'Готово', className: 'text-custom-accent', bgClass: 'bg-custom-accent/10' };
        case 'TRANSCRIBING':
            return { icon: Loader2, text: 'Транскрибация...', className: 'text-custom-accent', bgClass: 'bg-custom-accent/10' };
        case 'REDACTING':
            return { icon: Loader2, text: 'Анонимизация...', className: 'text-custom-accent', bgClass: 'bg-custom-accent/10' };
        case 'ERROR':
            return { icon: AlertCircle, text: 'Ошибка', className: 'text-orange-500', bgClass: 'bg-orange-500/10' };
        default:
            return { icon: Clock, text: 'В очереди', className: 'text-custom-secondary', bgClass: 'bg-custom-secondary/10' };
    }
};

export default function RecordingsList({ calls, isLoading, error, onRetry }: RecordingsListProps) {
    const [detailedCalls, setDetailedCalls] = useState<Map<number, CallDetailsDto>>(new Map());
    const pollingIntervals = useRef<Map<number, NodeJS.Timeout>>(new Map());
    const [audioUrls, setAudioUrls] = useState<Map<number, {
        original: string | null;
        originalError: boolean;
        redacted: string | null;
        redactedError: boolean;
    }>>(new Map());
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [expandedCallId, setExpandedCallId] = useState<number | null>(null);

    // Загрузка деталей звонка (сегментов) по требованию
    const fetchCallDetails = async (callId: number) => {
        if (detailedCalls.has(callId)) return;
        try {
            const details = await callService.getCallDetails(callId);
            setDetailedCalls((prev) => new Map(prev).set(callId, details));
        } catch (err) {
            console.error(`Failed to fetch details for call ${callId}`, err);
        }
    };

    useEffect(() => {
        if (expandedCallId !== null && !detailedCalls.has(expandedCallId)) {
            fetchCallDetails(expandedCallId);
        }
    }, [expandedCallId]);

    // Освобождаем blob URL при размонтировании
    useEffect(() => {
        return () => {
            audioUrls.forEach((urls) => {
                if (urls.original) URL.revokeObjectURL(urls.original);
                if (urls.redacted) URL.revokeObjectURL(urls.redacted);
            });
        };
    }, [audioUrls]);

    // Загрузка оригинального аудио
    useEffect(() => {
        if (!calls || !Array.isArray(calls)) return;
        calls.forEach(async (call) => {
            if (audioUrls.has(call.id) && audioUrls.get(call.id)?.original) return;
            try {
                const buffer = await callService.getOriginalAudio(call.id);
                const blob = new Blob([buffer], { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                setAudioUrls((prev) => {
                    const existing = prev.get(call.id);
                    return new Map(prev).set(call.id, {
                        original: url,
                        originalError: false,
                        redacted: existing?.redacted || null,
                        redactedError: existing?.redactedError || false,
                    });
                });
            } catch (err) {
                console.error(`Ошибка загрузки оригинального аудио для звонка ${call.id}`, err);
                setAudioUrls((prev) => {
                    const existing = prev.get(call.id);
                    return new Map(prev).set(call.id, {
                        original: null,
                        originalError: true,
                        redacted: existing?.redacted || null,
                        redactedError: existing?.redactedError || false,
                    });
                });
            }
        });
    }, [calls]);

    // Загрузка обработанного аудио с повторными попытками
    const loadRedactedAudio = async (callId: number, retryCount = 0) => {
        const existing = audioUrls.get(callId);
        if (existing?.redacted) return;
        if (existing?.redactedError) return;

        try {
            const buffer = await callService.getRedactedAudio(callId);
            const blob = new Blob([buffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            setAudioUrls((prev) => {
                const cur = prev.get(callId);
                return new Map(prev).set(callId, {
                    original: cur?.original || null,
                    originalError: cur?.originalError || false,
                    redacted: url,
                    redactedError: false,
                });
            });
        } catch (err: any) {
            if (err?.response?.status === 404) {
                if (retryCount < 3) {
                    setTimeout(() => loadRedactedAudio(callId, retryCount + 1), 5000);
                } else {
                    setAudioUrls((prev) => {
                        const cur = prev.get(callId);
                        return new Map(prev).set(callId, {
                            original: cur?.original || null,
                            originalError: cur?.originalError || false,
                            redacted: null,
                            redactedError: true,
                        });
                    });
                }
            } else {
                setAudioUrls((prev) => {
                    const cur = prev.get(callId);
                    return new Map(prev).set(callId, {
                        original: cur?.original || null,
                        originalError: cur?.originalError || false,
                        redacted: null,
                        redactedError: true,
                    });
                });
            }
        }
    };

    // Скачивание оригинального аудио
    const downloadOriginalAudio = async (callId: number) => {
        setDownloadingId(callId);
        try {
            const buffer = await callService.getOriginalAudio(callId);
            const blob = new Blob([buffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `original_${callId}.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            alert('Не удалось скачать оригинальный файл. Попробуйте позже.');
            console.error('Download original error:', err);
        } finally {
            setDownloadingId(null);
        }
    };

    // Скачивание обработанного аудио
    const downloadRedactedAudio = async (callId: number) => {
        setDownloadingId(callId);
        try {
            const buffer = await callService.getRedactedAudio(callId);
            const blob = new Blob([buffer], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `redacted_${callId}.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            if (err?.response?.status === 404) {
                alert('Обработанное аудио еще не готово. Пожалуйста, подождите.');
            } else {
                alert('Не удалось скачать файл. Попробуйте позже.');
            }
            console.error('Download error:', err);
        } finally {
            setDownloadingId(null);
        }
    };

    // Поллинг статуса
    const startPolling = (callId: number) => {
        if (pollingIntervals.current.has(callId)) return;

        const poll = async () => {
            try {
                const details = await callService.getCallDetails(callId);
                setDetailedCalls((prev) => new Map(prev).set(callId, details));
                const status = details.callRecord.status;
                if (status === 'COMPLETED') {
                    await loadRedactedAudio(callId);
                    const interval = pollingIntervals.current.get(callId);
                    if (interval) {
                        clearInterval(interval);
                        pollingIntervals.current.delete(callId);
                    }
                } else if (status === 'ERROR') {
                    const interval = pollingIntervals.current.get(callId);
                    if (interval) {
                        clearInterval(interval);
                        pollingIntervals.current.delete(callId);
                    }
                }
            } catch (err) {
                console.error(`Polling error for call ${callId}:`, err);
                const interval = pollingIntervals.current.get(callId);
                if (interval) {
                    clearInterval(interval);
                    pollingIntervals.current.delete(callId);
                }
            }
        };
        poll();
        const interval = setInterval(poll, 5000);
        pollingIntervals.current.set(callId, interval);
    };

    useEffect(() => {
        if (!calls || !Array.isArray(calls)) return;
        pollingIntervals.current.forEach((interval) => clearInterval(interval));
        pollingIntervals.current.clear();

        calls.forEach((call) => {
            const status = call.status;
            if (status !== 'COMPLETED' && status !== 'ERROR') {
                startPolling(call.id);
            } else if (status === 'COMPLETED') {
                loadRedactedAudio(call.id);
                callService.getCallDetails(call.id)
                    .then((details) => setDetailedCalls((prev) => new Map(prev).set(call.id, details)))
                    .catch(console.error);
            }
        });

        return () => {
            pollingIntervals.current.forEach((interval) => clearInterval(interval));
            pollingIntervals.current.clear();
        };
    }, [calls]);

    const getCallStatus = (call: CallRecordDto): CallRecordDto['status'] => {
        const details = detailedCalls.get(call.id);
        return details?.callRecord.status ?? call.status;
    };

    const isCompleted = (call: CallRecordDto) => getCallStatus(call) === 'COMPLETED';
    const isError = (call: CallRecordDto) => getCallStatus(call) === 'ERROR';

    if (!calls || !Array.isArray(calls)) {
        return (
            <div className="bg-custom-bg-secondary rounded-card p-8 text-center shadow-lg">
                <AlertCircle className="w-12 h-12 text-custom-secondary mx-auto mb-4" />
                <p className="text-custom-secondary text-base">Ошибка загрузки данных</p>
                <button onClick={onRetry} className="btn btn-ghost btn-sm mt-4 cursor-pointer">
                    Попробовать снова
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-custom-accent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 text-red-500 text-sm text-center py-2 rounded-full">
                {error}
                <button onClick={onRetry} className="ml-2 underline hover:no-underline cursor-pointer">
                    Попробовать снова
                </button>
            </div>
        );
    }

    if (calls.length === 0) {
        return (
            <div className="bg-custom-bg-secondary rounded-card p-8 text-center shadow-lg">
                <Clock className="w-12 h-12 text-custom-secondary mx-auto mb-4" />
                <p className="text-custom-secondary text-base mb-2">У вас пока нет записей</p>
                <p className="text-sm text-custom-placeholder">
                    Нажмите на кнопку с плюсом в правом нижнем углу, чтобы загрузить первую запись
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="hidden md:grid md:grid-cols-2 gap-6 px-4 text-sm font-medium text-custom-secondary">
                <div>Оригинальная запись</div>
                <div>Анонимизированная запись</div>
            </div>

            {calls.map((call) => {
                const status = getCallStatus(call);
                const statusConfig = getStatusConfig(status);
                const StatusIcon = statusConfig.icon;
                const completed = isCompleted(call);
                const errorStatus = isError(call);
                const createdAt = parseISO(call.createdAt.endsWith('Z') ? call.createdAt : call.createdAt + 'Z');

                const originalUrl = audioUrls.get(call.id)?.original;
                const originalError = audioUrls.get(call.id)?.originalError;
                const redactedUrl = audioUrls.get(call.id)?.redacted;
                const redactedError = audioUrls.get(call.id)?.redactedError;

                const details = detailedCalls.get(call.id);
                const segments = details?.segments;
                const isExpanded = expandedCallId === call.id;

                // Находим первый сегмент с PII для выделения
                let highlightInterval: { start: number; end: number } | null = null;
                if (segments) {
                    const piiSegment = segments.find(seg => seg.containsPii === true);
                    if (piiSegment) {
                        highlightInterval = {
                            start: piiSegment.startTime,
                            end: piiSegment.endTime,
                        };
                    }
                }

                return (
                    <div key={call.id} className="bg-custom-bg-secondary rounded-card shadow-lg overflow-hidden transition-all hover:shadow-xl">
                        <div className="p-6 border-b border-custom-secondary/20">
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs px-3 py-1 rounded-full ${statusConfig.bgClass} ${statusConfig.className} flex items-center gap-1`}>
                                            <StatusIcon className={`w-3 h-3 ${status === 'TRANSCRIBING' || status === 'REDACTING' ? 'animate-spin' : ''}`} />
                                            {statusConfig.text}
                                        </span>
                                    </div>
                                    <p className="text-xs text-custom-placeholder">
                                        Загружено {formatDistanceToNow(createdAt, { addSuffix: true, locale: ru })}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {originalUrl && !originalError && (
                                        <button
                                            onClick={() => downloadOriginalAudio(call.id)}
                                            disabled={downloadingId === call.id}
                                            className="btn btn-ghost btn-sm gap-2 cursor-pointer"
                                        >
                                            {downloadingId === call.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download size={16} />}
                                            Скачать оригинал
                                        </button>
                                    )}
                                    {completed && !redactedError && redactedUrl && (
                                        <button
                                            onClick={() => downloadRedactedAudio(call.id)}
                                            disabled={downloadingId === call.id}
                                            className="btn btn-ghost btn-sm gap-2 cursor-pointer"
                                        >
                                            {downloadingId === call.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download size={16} />}
                                            Скачать обработанное
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Оригинал */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-custom-main flex items-center gap-2">
                                    <span>Исходное аудио</span>
                                </h4>
                                <div className="bg-custom-bg-main/30 rounded-card p-3">
                                    {originalError ? (
                                        <div className="text-red-500 text-sm text-center py-4">
                                            Не удалось загрузить аудио. Файл повреждён или недоступен.
                                        </div>
                                    ) : originalUrl ? (
                                        <WaveformPlayer
                                            backgroundColor="transparent"
                                            height={90}
                                            waveHeight={50}
                                            width="100%"
                                            src={originalUrl}
                                            progressColor="#775ee1"
                                            waveColor="darkgray"
                                            buttonColor="var(--color-custom-accent)"
                                            volumeSliderFillColor='#775ee1'
                                            volumeSliderTrackColor='darkgray'
                                            neon={true}
                                            showTime={true}
                                            neonIntensity={2}
                                        />
                                    ) : (
                                        <div className="flex justify-center py-6">
                                            <Loader2 className="w-6 h-6 animate-spin text-custom-accent" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Обработанное */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-custom-main flex items-center gap-2">
                                    <span>Анонимизированное аудио</span>
                                </h4>
                                <div className="bg-custom-bg-main/30 rounded-card p-3">
                                    {errorStatus ? (
                                        <div className="text-custom-secondary text-sm text-center py-4">
                                            Ошибка обработки. Попробуйте загрузить файл заново.
                                        </div>
                                    ) : redactedError ? (
                                        <div className="text-custom-secondary text-sm text-center py-4">
                                            Не удалось загрузить обработанное аудио. Файл, возможно, повреждён.
                                        </div>
                                    ) : completed && redactedUrl ? (
                                        <WaveformPlayer
                                            backgroundColor="transparent"
                                            height={90}
                                            waveHeight={50}
                                            width="100%"
                                            src={redactedUrl}
                                            progressColor="#775ee1"
                                            waveColor="darkgray"
                                            buttonColor="var(--color-custom-accent)"
                                            volumeSliderFillColor='#775ee1'
                                            volumeSliderTrackColor='darkgray'
                                            neon={true}
                                            showTime={true}
                                            neonIntensity={2}
                                            highlightStart={highlightInterval?.start}
                                            highlightEnd={highlightInterval?.end}
                                            highlightColor="rgba(249, 115, 22, 0.4)"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-3 text-center py-4">
                                            <Loader2 className="w-8 h-8 animate-spin text-custom-accent" />
                                            <p className="text-sm text-custom-secondary">
                                                {status === 'TRANSCRIBING' && 'Выполняется транскрибация...'}
                                                {status === 'REDACTING' && 'Идёт анонимизация...'}
                                                {status === 'UPLOADED' && 'Ожидание обработки...'}
                                                {status === 'COMPLETED' && !redactedUrl && 'Загрузка аудио...'}
                                            </p>
                                            <p className="text-xs text-custom-placeholder">
                                                Обработанное аудио появится автоматически после завершения
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Блок транскрипта */}
                        {completed && (
                            <div className="border-t border-custom-secondary/20 px-6 py-3">
                                <button
                                    onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                                    className="w-full flex justify-between items-center text-custom-main hover:text-custom-accent transition-colors cursor-pointer"
                                >
                                    <span className="text-sm font-medium">
                                        {isExpanded ? 'Скрыть транскрипт' : 'Показать транскрипт'}
                                    </span>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                                {isExpanded && (
                                    <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
                                        {!segments ? (
                                            <div className="flex justify-center py-6">
                                                <Loader2 className="w-6 h-6 animate-spin text-custom-accent" />
                                            </div>
                                        ) : segments.length === 0 ? (
                                            <p className="text-custom-placeholder text-sm text-center py-4">
                                                Транскрипт отсутствует
                                            </p>
                                        ) : (
                                            segments.map((segment) => (
                                                <div key={segment.id} className="border-l-2 border-custom-accent/30 pl-4 py-2">
                                                    <div className="text-sm text-custom-main mb-1">{segment.originalText}</div>
                                                    {segment.redactedText !== segment.originalText && (
                                                        <div className="text-sm text-custom-secondary mb-2">
                                                            → {segment.redactedText}
                                                        </div>
                                                    )}
                                                    {segment.piiTypes && segment.piiTypes.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-1">
                                                            {segment.piiTypes.map((type) => (
                                                                <span key={type} className="text-xs px-2 py-0.5 rounded-full bg-custom-accent/10 text-custom-accent">
                                                                    {type}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}