'use client';

import { useEffect, useRef, useState } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
}

export default function NeonParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [accentColor, setAccentColor] = useState('#ff8c32'); // fallback

    useEffect(() => {
        const updateColor = () => {
        const root = document.documentElement;
        const color = getComputedStyle(root).getPropertyValue('--secondary-color').trim();
        if (color) {
            setAccentColor(color);
        }
        };
        updateColor();
        const observer = new MutationObserver(updateColor);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.clientWidth;
        let height = canvas.clientHeight;
        let particles: Particle[] = [];

        const resize = () => {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        };
        resize();
        window.addEventListener('resize', resize);

        let lastSpawn = 0;

        const animate = (now: number) => {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, width, height);

        if (now - lastSpawn > 100) {
            lastSpawn = now;
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            const sigma = width / 4;
            let x = width / 2 + z * sigma;
            x = Math.min(Math.max(x, 0), width);

            particles.push({
            x: x,
            y: height - 1,
            vx: (Math.random() - 0.5) * 0.2,
            vy: -(0.15 + Math.random() * 0.25),
            life: 1.0,
            size: 1.5 + Math.random() * 1,
            });
        }

        particles = particles.filter((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.002;
            return p.life > 0.02 && p.y > -50;
        });

        particles.forEach((p) => {
            ctx.save();
            ctx.shadowBlur = 6;
            ctx.shadowColor = accentColor;
            ctx.globalAlpha = p.life * 0.7;
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);
        return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
        };
    }, [accentColor]);

    return (
        <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 5, width: '100%', height: '100%' }}
        />
    );
}