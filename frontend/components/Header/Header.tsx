'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sun, Moon, User, LogOut } from 'lucide-react';
import styles from './Header.module.css';
import NeonParticles from '@/components/Particles/NeonParticles';
import { useAuth } from '@/context/AuthContext';
import lightLogo from '@/materials/favicon.png';
import darkLogo from '@/materials/favicon-white.png';

export const Header = () => {
    const router = useRouter();
    const { user, logout } = useAuth();
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

    const handleLogout = () => {
        logout();
    };

    const handleProfileClick = () => {
        router.push('/profile');
    };

    const logoSrc = theme === 'dark' ? darkLogo : lightLogo;
    const displayName = user?.name || user?.login || 'Пользователь';

    // Активный пункт меню можно определить по текущему пути (для подсветки), но для простоты оставим базовые анимации
    return (
        <header className={`sticky top-0 z-50 w-full bg-custom-bg-secondary/40 backdrop-blur-md ${styles.header}`}>
            <NeonParticles />
            <div className={styles.lineContainer}>
                <div className={styles.line} />
            </div>

            <div className="px-2 sm:px-4 mx-8">
                {/* Используем grid для точного центрирования: три колонки одинаковой ширины */}
                <div className="grid grid-cols-3 items-center h-16">
                    {/* Левая колонка: логотип + (опционально) дополнительная информация */}
                    <div className="flex justify-start">
                        <Link href="/" className="flex items-center gap-2 text-custom-main text-xl font-bold hover:opacity-80 transition-opacity group">
                            <Image
                                src={logoSrc}
                                alt="Логотип АудиоЩит"
                                className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
                                width={32}
                                height={32}
                                priority
                            />
                            <span className="hidden sm:inline">АудиоЩит</span>
                        </Link>
                    </div>

                    {/* Центральная колонка: навигация */}
                    <div className="flex justify-center gap-6 md:gap-8">
                        <NavLink href="/">Главная</NavLink>
                        <NavLink href="/profile">Личный кабинет</NavLink>
                        <NavLink href="/api-docs">API</NavLink>
                    </div>

                    {/* Правая колонка: пользовательские кнопки */}
                    <div className="flex justify-end items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-2 bg-custom-bg-primary/50 rounded-full pl-2 pr-1 py-1 transition-all duration-200 hover:bg-custom-bg-primary/70">
                                <User size={20} className="text-custom-main" />
                                <button
                                    onClick={handleProfileClick}
                                    className="text-sm text-custom-main hover:text-custom-accent transition-colors hidden sm:inline cursor-pointer"
                                >
                                    {displayName}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-1 rounded-full hover:bg-custom-bg-primary/30 transition-all duration-200 active:scale-90"
                                    aria-label="Выйти"
                                >
                                    <LogOut size={20} className="text-custom-main hover:text-custom-accent transition-colors cursor-pointer" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="text-custom-main hover:text-custom-accent transition-all duration-200 px-3 py-1 rounded-full bg-custom-bg-primary/30 hover:bg-custom-bg-primary/50 active:scale-95"
                            >
                                Войти
                            </Link>
                        )}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full transition-all duration-300 active:scale-90 hover:rotate-12 cursor-pointer"
                            aria-label="Переключить тему"
                        >
                            {theme === 'light' ? (
                                <Moon size={20} className="text-custom-main hover:text-custom-accent transition-colors" />
                            ) : (
                                <Sun size={20} className="text-custom-main hover:text-custom-accent transition-colors" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};


const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    return (
        <Link
            href={href}
            className="relative text-custom-main transition-colors duration-200 hover:text-custom-accent group"
        >
            {children}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-custom-accent transition-all duration-300 group-hover:w-full" />
        </Link>
    );
};