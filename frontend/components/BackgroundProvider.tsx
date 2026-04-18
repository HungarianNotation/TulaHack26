'use client';

import dynamic from 'next/dynamic';

const ParticlesBackground = dynamic(
    () => import("@/components/Particles/ParticlesBackground"),
    { ssr: false }
);

const BackgroundScene = dynamic(
    () => import("@/components/BackgroundScene"),
    { ssr: false }
);

export default function BackgroundProvider() {
    return (
        <div className="fixed inset-0">
        <BackgroundScene />
        <ParticlesBackground />
        </div>
    );
}