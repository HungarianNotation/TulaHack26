'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import PageLoader from '@/components/PageLoader';

const BackgroundScene = dynamic(
    () => import("@/components/BackgroundScene"),
    { ssr: false }
    );

    export default function AuthLayout({
    children,
    }: {
    children: React.ReactNode;
    }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Имитируем загрузку страницы. 
        const timer = setTimeout(() => {
        setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
        <PageLoader isLoading={isLoading} />

        <div style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 2s ease' }}>
            <div className="fixed inset-0 z-0">
            <BackgroundScene />
            </div>
            <div
            className="fixed inset-0 z-10 pointer-events-none"
            style={{
                backdropFilter: "blur(2px) saturate(150%)",
                backgroundColor: "rgba(255, 255, 255, 0)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.2)",
            }}
            />
            <div className="relative z-20 flex flex-col flex-1 items-center justify-center">
            {children}
            </div>
        </div>
        </>
    );
}