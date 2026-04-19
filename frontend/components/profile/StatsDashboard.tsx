"use client";

import { useEffect, useState } from "react";
import { callService } from "@/services/call-services";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Phone, Shield, AlertTriangle, TrendingUp } from "lucide-react";

interface StatsData {
    totalCallsProcessed: number;
    totalPiiIncidentsFound: number;
    piiTypeDistribution: Record<string, number>;
}

const PII_COLORS: Record<string, string> = {
    NAME: "#775ee1",
    CONTACT_INFO: "#f97316",
    DEFAULT: "#3b82f6",
};

export default function StatsDashboard() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await callService.getStats();
                setStats(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch stats:", err);
                setError("Не удалось загрузить статистику");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="bg-custom-bg-secondary rounded-card p-6 shadow-lg animate-pulse">
                <div className="h-32 bg-custom-bg-main/50 rounded"></div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="bg-custom-bg-secondary rounded-card p-6 shadow-lg text-center">
                <p className="text-red-500 text-sm">{error || "Нет данных"}</p>
            </div>
        );
    }

    // Подготовка данных для круговой диаграммы
    const pieData = Object.entries(stats.piiTypeDistribution).map(([name, value]) => ({
        name: name === "NAME" ? "Имена" : name === "CONTACT_INFO" ? "Контакты" : name,
        value,
        color: PII_COLORS[name] || PII_COLORS.DEFAULT,
    }));

    return (
        <div className="bg-custom-bg-secondary rounded-card shadow-lg p-6">
            <h3 className="text-lg font-semibold text-custom-main mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-custom-accent" />
                Статистика анонимизации
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Левая колонка: карточки KPI */}
                <div className="space-y-4">
                    <div className="bg-custom-bg-main/30 rounded-lg p-4 flex items-center gap-4">
                        <div className="p-3 bg-custom-accent/20 rounded-full">
                            <Phone size={24} className="text-custom-accent" />
                        </div>
                        <div>
                            <p className="text-sm text-custom-secondary">Всего обработано звонков</p>
                            <p className="text-2xl font-bold text-custom-main">
                                {stats.totalCallsProcessed}
                            </p>
                        </div>
                    </div>

                    <div className="bg-custom-bg-main/30 rounded-lg p-4 flex items-center gap-4">
                        <div className="p-3 bg-orange-500/20 rounded-full">
                            <Shield size={24} className="text-orange-500" />
                        </div>
                        <div>
                            <p className="text-sm text-custom-secondary">Найдено инцидентов с ПД</p>
                            <p className="text-2xl font-bold text-custom-main">
                                {stats.totalPiiIncidentsFound}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Правая колонка: круговая диаграмма */}
                <div className="space-y-2">
                    <p className="text-sm text-custom-secondary text-center">
                        Распределение типов персональных данных
                    </p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--color-custom-bg-secondary)",
                                        border: "none",
                                        borderRadius: "var(--radius-card)",
                                        color: "var(--color-custom-main)",
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}