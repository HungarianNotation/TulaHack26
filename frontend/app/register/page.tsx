'use client';

import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password || !confirmPassword) {
        setError('All fields are required');
        return;
        }
        if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
        }
        if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
        }

        // API регистрации
        console.log('Registering with:', { email, password });
        alert('Registration successful! (demo)');
    };

    return (
        <div className="min-h-screen bg-custom-bg-main flex items-center justify-center p-4">
        <div
            className="card w-full max-w-md bg-custom-bg-secondary shadow-lg"
            style={{ borderRadius: 'var(--radius-card)' }}
        >
            <div className="card-body p-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-custom-main">Создать аккаунт</h1>
                <p className="text-custom-secondary mt-2">Зарегистрируйтесь, чтобы начать</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                <label className="block text-custom-main text-sm font-medium mb-2">
                    Почта
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-custom-secondary" />
                    <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-custom-secondary/30 focus:border-custom-accent outline-none transition-colors text-custom-main placeholder:text-custom-placeholder"
                    required
                    />
                </div>
                </div>

                {/* Пароль */}
                <div>
                <label className="block text-custom-main text-sm font-medium mb-2">
                    Пароль
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-custom-secondary" />
                    <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-transparent border-b border-custom-secondary/30 focus:border-custom-accent outline-none transition-colors text-custom-main placeholder:text-custom-placeholder"
                    required
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-custom-secondary hover:text-custom-accent transition-colors cursor-pointer"
                    >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                </div>

                {/* Подтверждение пароля */}
                <div>
                <label className="block text-custom-main text-sm font-medium mb-2">
                    Подтверждение пароля
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-custom-secondary" />
                    <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-transparent border-b border-custom-secondary/30 focus:border-custom-accent outline-none transition-colors text-custom-main placeholder:text-custom-placeholder"
                    required
                    />
                    <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-custom-secondary hover:text-custom-accent transition-colors cursor-pointer"
                    >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                </div>

                {/* Ошибка */}
                {error && (
                <div className="bg-red-500/10 text-red-500 text-sm text-center py-2 rounded-full">
                    {error}
                </div>
                )}

                {/* Кнопка регистрации */}
                <button
                type="submit"
                className="btn btn-primary w-full gap-2 mt-8"
                style={{ borderRadius: 'var(--radius-button)' }}
                >
                <UserPlus size={20} />
                Зарегистрироваться
                </button>
            </form>

            <div className="mt-6 text-center text-custom-secondary text-sm">
                Уже есть аккаунт?{' '}
                <Link href="/login" className="text-custom-accent hover:underline">
                Войти
                </Link>
            </div>
            </div>
        </div>
        </div>
    );
}