'use client';
import dynamic from 'next/dynamic';

const ParticlesBackground = dynamic(
    () => import("@/components/Particles/ParticlesBackground"),
    { ssr: false }
);

export default function GlobalParticlesProvider() {
    return (
        <div className="fixed inset-0 z-12 pointer-events-none">
        <ParticlesBackground />
        </div>
    );
}