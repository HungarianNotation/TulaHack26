"use client";

import { useCallback, useEffect, useState } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";

export default function ParticlesBackground() {
    const [isDarkTheme, setIsDarkTheme] = useState(false);

    // Определяем цвета частиц в зависимости от темы
    const particleColors = isDarkTheme
        ? ["#ffffff", "#e0e0e0", "#c0c0c0"]
        : ["#000000", "#1a1a1a", "#333333"];

    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine);
    }, []);

    useEffect(() => {
        const checkTheme = () => {
            const isDark = document.documentElement.classList.contains("dark");
            setIsDarkTheme(isDark);
        };

        checkTheme();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === "attributes" &&
                    mutation.attributeName === "class"
                ) {
                    checkTheme();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        // Очистка при размонтировании
        return () => observer.disconnect();
    }, []);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
                fpsLimit: 60,
                interactivity: {
                    events: {
                        onHover: {
                            enable: true,
                            mode: ["repulse", "parallax"],
                            parallax: { enable: true, force: 30, smooth: 20 },
                        },
                        onClick: { enable: false },
                        resize: true,
                    },
                    modes: {
                        repulse: {
                            distance: 200,
                            duration: 4,
                            speed: 0.02,
                        },
                    },
                },
                particles: {
                    color: { value: particleColors },
                    move: {
                        enable: true,
                        speed: 0.3,
                        direction: "none",
                        random: true,
                        outModes: { default: "out" },
                        attract: { enable: false },
                    },
                    number: {
                        density: { enable: true, area: 300 },
                        value: 80,
                    },
                    opacity: {
                        value: 0.01,
                        random: true,
                    },
                    shape: { type: "circle" },
                    size: {
                        value: { min: 0.5, max: 2 },
                        random: true,
                    },
                },
                detectRetina: true,
                fullScreen: false,
                background: { color: "transparent" },
            }}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 12,
            }}
        />
    );
}