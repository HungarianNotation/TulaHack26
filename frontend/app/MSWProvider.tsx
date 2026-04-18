'use client';
import { useEffect, useState } from 'react';

export const MSWProvider = ({ children }: { children: React.ReactNode }) => {
    const [mswReady, setMswReady] = useState(false);

    useEffect(() => {
        const init = async () => {
        if (false && process.env.NODE_ENV === 'development') { // Для включения убрать false &&
            const { worker } = await import('@/mocks/browser');
            await worker.start({
            serviceWorker: {
                url: '/mockServiceWorker.js',
            },
            onUnhandledRequest: 'bypass',
            });
            worker.events.on('request:start', ({ request }) => {
                console.log('[MSW Диагностика] Исходящий запрос:', request.method, request.url);
            });
            console.log('[MSW] Worker started');
            setMswReady(true);
        } else {
            setMswReady(true);
        }
        };
        init();
    }, []);

    if (!mswReady) return null;
    return <>{children}</>;
};