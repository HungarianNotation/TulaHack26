'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sun, Moon } from 'lucide-react';
import styles from './Header.module.css';
import NeonParticles from '@/components/Particles/NeonParticles';
import lightLogo from '@/materials/favicon.png';
import darkLogo from '@/materials/favicon-white.png';

export const Header = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        let initialTheme: 'light' | 'dark' = 'light';
        if (savedTheme) {
            initialTheme = savedTheme;
        } else {
            initialTheme = systemPrefersDark ? 'dark' : 'light';
        }

        setTheme(initialTheme);
        applyTheme(initialTheme);
    }, []);

    const applyTheme = (newTheme: 'light' | 'dark') => {
        const root = document.documentElement;
        if (newTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
    };

    const logoSrc = theme === 'dark' ? darkLogo : lightLogo;

    return (
        <header className={`sticky top-0 z-50 w-full bg-custom-bg-secondary/40 backdrop-blur-md ${styles.header}`}>
            <NeonParticles />
            <div className={styles.lineContainer}>
                <div className={styles.line} />
                {/*<div className={styles.glow} />*/}
            </div>

            <div className="px-2 sm:px-4 mx-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 text-custom-main text-xl font-bold hover:opacity-80 transition-opacity">
                            <Image
                                src={logoSrc}
                                alt="Логотип АудиоЩит"
                                className="h-8 w-auto"
                                width={32}
                                height={32}
                                priority
                            />
                            <span>АудиоЩит</span>
                        </Link>
                        <div className="hidden md:flex gap-4">{/* пункты навигации */}</div>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full transition-all duration-200 active:scale-95"
                        aria-label="Переключить тему"
                    >
                        {theme === 'light' ? (
                            <Moon size={20} className="text-custom-main hover:text-custom-accent transition-colors cursor-pointer" />
                        ) : (
                            <Sun size={20} className="text-custom-main hover:text-custom-accent transition-colors cursor-pointer" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};