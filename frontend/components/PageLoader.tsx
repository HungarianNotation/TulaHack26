'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Audio } from 'react-loader-spinner';

interface PageLoaderProps {
    isLoading: boolean;
}

export default function PageLoader({ isLoading }: PageLoaderProps) {
    useEffect(() => {
        if (isLoading) {
        document.body.style.overflow = 'hidden';
        } else {
        document.body.style.overflow = '';
        }
        return () => {
        document.body.style.overflow = '';
        };
    }, [isLoading]);

    return (
        <AnimatePresence>
        {isLoading && (
            <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }} // Длительность и стиль анимации
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-custom-bg-main"
            >
            <div className="flex flex-col items-center justify-center space-y-4">
                {/* Спиннер */}
                <Audio
                height="80"
                width="80"
                color="var(--color-custom-accent)" // Цвет акцента
                ariaLabel="audio-loading"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
                />
                {/* Текст */}
                <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-custom-main text-lg font-medium"
                >
                Загрузка...
                </motion.p>
            </div>
            </motion.div>
        )}
        </AnimatePresence>
    );
}