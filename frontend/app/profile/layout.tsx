'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import PageLoader from '@/components/PageLoader';

const BackgroundScene = dynamic(
    () => import("@/components/BackgroundScene"),
    { ssr: false }
);

export default function ProfileLayout({
    children,
    }: {
    children: React.ReactNode;
    }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
        setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
        <PageLoader isLoading={isLoading} />

        <div style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 2s ease' }}>
            {/* Основной контент страницы профиля */}
            <div className="relative z-20">
            {children}
            </div>
        </div>
        </>
    );
}