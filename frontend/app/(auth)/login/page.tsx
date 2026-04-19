'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Оба поля обязательны');
            return;
        }
        if (!email.includes('@')) {
            setError('Пожалуйста, введите правильную почту');
            return;
        }
        if (password.length < 6) {
            setError('Минимальная длина пароля 6 символов');
            return;
        }

        setIsLoading(true);
        try {
            await login(email, password);
            router.push('/profile');
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError('Неправильная почта или пароль');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Ошибка входа, попробуйте позже');
            }
            console.error('Ошибка входа:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-[90vh] w-full items-center justify-center overflow-hidden p-4">
            <div className="w-full max-w-lg pointer-events-auto">
                <div
                    className="card w-full bg-custom-bg-secondary shadow-lg"
                    style={{ borderRadius: 'var(--radius-card)' }}
                >
                    <div className="card-body p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-custom-main">Вход в аккаунт</h1>
                            <p className="text-custom-secondary mt-2">Добро пожаловать!</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-custom-main text-sm font-medium mb-2">Почта</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-custom-secondary" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-custom-secondary/30 focus:border-custom-accent outline-none transition-colors text-custom-main placeholder:text-custom-placeholder"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-custom-main text-sm font-medium mb-2">Пароль</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-custom-secondary" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-12 py-3 bg-transparent border-b border-custom-secondary/30 focus:border-custom-accent outline-none transition-colors text-custom-main placeholder:text-custom-placeholder"
                                        required
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-custom-secondary hover:text-custom-accent transition-colors cursor-pointer"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            {error && (
                                <div className="bg-red-500/10 text-red-500 text-sm text-center py-2 rounded-full">
                                    {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                className="btn btn-primary w-full gap-2 mt-8"
                                style={{ borderRadius: 'var(--radius-button)' }}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <LogIn size={20} />
                                )}
                                {isLoading ? 'Вход...' : 'Войти'}
                            </button>
                        </form>
                        <div className="mt-6 text-center text-custom-secondary text-sm">
                            Нет аккаунта?{' '}
                            <Link href="/register" className="text-custom-accent hover:underline">
                                Зарегистрироваться
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}