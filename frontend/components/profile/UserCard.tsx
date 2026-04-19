'use client';

import { useEffect, useState } from 'react';
import { Mail, Building2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { userService } from '@/services/auth-services';
import { decodeJwt } from '@/utils/jwt';
import { useAuth } from '@/context/AuthContext';


interface UserProfile {
    login: string;
    name?: string;
    company?: string;
}

export default function UserCard() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { logout: contextLogout } = useAuth();


    useEffect(() => {
        const fetchProfile = async () => {
        try {
            const data = await userService.getProfile();
            setProfile(data);
        } catch (err: any) {
            console.warn('getProfile failed, falling back to JWT:', err?.response?.status);
            const token = localStorage.getItem('jwt_token');
            if (token) {
            const decoded = decodeJwt(token);
            if (decoded?.sub) {
                setProfile({
                login: decoded.sub,
                name: decoded.name || decoded.sub.split('@')[0],
                company: decoded.company,
                });
            } else {
                setProfile({ login: 'Пользователь' });
            }
            } else {
            setProfile({ login: 'Пользователь' });
            }
        } finally {
            setLoading(false);
        }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        contextLogout();
        router.push('/login');
    };

    const getInitials = () => {
        if (profile?.name) return profile.name.charAt(0).toUpperCase();
        if (profile?.login) return profile.login.charAt(0).toUpperCase();
        return 'U';
    };

    if (loading) {
        return (
        <div className="bg-custom-bg-secondary rounded-card shadow-lg p-6 w-full flex justify-center">
            <div className="w-6 h-6 border-2 border-custom-accent border-t-transparent rounded-full animate-spin" />
        </div>
        );
    }

    return (
        <div className="bg-custom-bg-secondary rounded-card shadow-lg p-6 w-full">
        <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-custom-accent/20 flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-custom-accent">
                {getInitials()}
            </span>
            </div>

            <h2 className="text-xl font-bold text-custom-main mb-1">
            {profile?.name || profile?.login?.split('@')[0] || 'Пользователь'}
            </h2>

            <div className="flex items-center gap-2 text-sm text-custom-secondary mt-2">
            <Mail size={16} />
            <span>{profile?.login}</span>
            </div>

            {profile?.company && (
            <div className="flex items-center gap-2 text-sm text-custom-secondary mt-1">
                <Building2 size={16} />
                <span>{profile.company}</span>
            </div>
            )}

            <div className="w-full h-px bg-custom-secondary/20 my-6"></div>

            <button
            onClick={handleLogout}
            className="btn btn-secondary w-full gap-2 cursor-pointer"
            >
            <LogOut size={18} />
            Выйти
            </button>
        </div>
        </div>
    );
}