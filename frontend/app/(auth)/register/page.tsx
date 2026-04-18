'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, UserPlus, User, Building } from 'lucide-react';
import Link from 'next/link';
import { authService } from '@/services/auth-services';

export default function RegisterPage() {
    const router = useRouter();
    const [login, setLogin] = useState('');
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Валидация
        if (!login || !password || !confirmPassword) {
            setError('Все поля обязательны для заполнения');
            return;
        }
        if (!login.includes('@')) {
            setError('Пожалуйста, введите корректный email');
            return;
        }
        if (password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }
        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setIsLoading(true);

        try {
            // Отправляем запрос на регистрацию
            const response = await authService.register({
                login,
                name: name || undefined,
                company: company || undefined,
                password,
            });

            // Сохраняем токен
            if (typeof window !== 'undefined') {
                localStorage.setItem('jwt_token', response.token);
            }

            router.push('/profile');
        } catch (err: any) {
            // Обработка ошибок
            if (err.response?.status === 409) {
                setError('Пользователь с таким email уже существует');
            } else if (err.response?.status === 400) {
                setError('Некорректные данные. Проверьте email и пароль');
            } else {
                setError('Ошибка сервера. Попробуйте позже');
            }
            console.error('Registration error:', err);
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
                            <h1 className="text-3xl font-bold text-custom-main">Создать аккаунт</h1>
                            <p className="text-custom-secondary mt-2">Зарегистрируйтесь, чтобы начать</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email (login) */}
                            <div>
                                <label className="block text-custom-main text-sm font-medium mb-2">
                                    Почта
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-custom-secondary" />
                                    <input
                                        type="email"
                                        value={login}
                                        onChange={(e) => setLogin(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-custom-secondary/30 focus:border-custom-accent outline-none transition-colors text-custom-main placeholder:text-custom-placeholder"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Имя (опционально) */}
                            <div>
                                <label className="block text-custom-main text-sm font-medium mb-2">
                                    Имя
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-custom-secondary" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Иван Иванов"
                                        className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-custom-secondary/30 focus:border-custom-accent outline-none transition-colors text-custom-main placeholder:text-custom-placeholder"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Компания (опционально) */}
                            <div>
                                <label className="block text-custom-main text-sm font-medium mb-2">
                                    Компания
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-custom-secondary" />
                                    <input
                                        type="text"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder="ООО Ромашка"
                                        className="w-full pl-10 pr-4 py-3 bg-transparent border-b border-custom-secondary/30 focus:border-custom-accent outline-none transition-colors text-custom-main placeholder:text-custom-placeholder"
                                        disabled={isLoading}
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
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-custom-secondary hover:text-custom-accent transition-colors cursor-pointer"
                                        disabled={isLoading}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                                    'Регистрация...'
                                ) : (
                                    <>
                                        <UserPlus size={20} />
                                        Зарегистрироваться
                                    </>
                                )}
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
        </div>
    );
}