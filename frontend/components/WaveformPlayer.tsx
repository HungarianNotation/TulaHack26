"use client";

import { useRef, useState, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, Volume1, VolumeX } from "lucide-react";

interface WaveformPlayerProps {
    src: string;
    width?: string | number;
    height?: string | number;
    waveHeight?: number;
    backgroundColor?: string;
    waveColor?: string;
    progressColor?: string;
    buttonColor?: string;
    volumeSliderTrackColor?: string;
    volumeSliderFillColor?: string;
    showTime?: boolean;
    neon?: boolean;
    neonColor?: string;
    neonIntensity?: number;
    glowIntensity?: number;
    highlightStart?: number;
    highlightEnd?: number;
    highlightColor?: string;
}

export function WaveformPlayer({
    src,
    width = "100%",
    height = "auto",
    waveHeight = 80,
    backgroundColor = "bg-white dark:bg-zinc-800",
    waveColor = "#d1d5db",
    progressColor = "#3b82f6",
    buttonColor = "#3b82f6",
    volumeSliderTrackColor = "#d1d5db",
    volumeSliderFillColor = "#3b82f6",
    showTime = false,
    neon = false,
    neonColor,
    neonIntensity = 0.6,
    glowIntensity = 1.0,
    highlightStart,
    highlightEnd,
    highlightColor = "rgba(249, 115, 22, 0.5)", // приятный полупрозрачный оранжевый
}: WaveformPlayerProps) {
    if (!src || src === '') {
        return (
            <div className="text-orange-500 text-sm text-center py-4">
                Аудио недоступно
            </div>
        );
    }
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<RegionsPlugin | null>(null);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [progressPercent, setProgressPercent] = useState(0);
    const [isVolumeHovered, setIsVolumeHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Инициализация WaveSurfer с плагином Regions
    useEffect(() => {
        if (!containerRef.current || wavesurferRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            height: waveHeight,
            waveColor,
            progressColor,
            normalize: true,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            url: src,
        });

        // Регистрируем плагин Regions
        const regionsPlugin = RegionsPlugin.create();
        ws.registerPlugin(regionsPlugin);
        regionsPluginRef.current = regionsPlugin;

        ws.on("ready", () => {
            setIsReady(true);
            const dur = ws.getDuration();
            setDuration(dur);
            setVolume(ws.getVolume());
            setCurrentTime(0);
            setProgressPercent(0);
            setIsPlaying(false);
        });

        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("finish", () => setIsPlaying(false));

        ws.on("volume", (newVolume: number) => {
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        });

        ws.on("timeupdate", (current: number) => {
            setCurrentTime(current);
            if (duration > 0) {
                setProgressPercent((current / duration) * 100);
            }
        });

        wavesurferRef.current = ws;

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
        };
    }, [src, waveHeight, waveColor, progressColor]);

    // Добавление региона после загрузки аудио
    useEffect(() => {
        if (!isReady || !regionsPluginRef.current || highlightStart === undefined || highlightEnd === undefined) return;

        // Удаляем старые регионы, если они есть
        regionsPluginRef.current.clearRegions();

        // Добавляем новый регион
        regionsPluginRef.current.addRegion({
            start: highlightStart,
            end: highlightEnd,
            color: highlightColor,
            drag: false,
            resize: false,
        });
    }, [isReady, highlightStart, highlightEnd, highlightColor]);

    // Неон-эффект (применяется к canvas после готовности)
    useEffect(() => {
        if (!isReady || !wavesurferRef.current) return;
        const canvas = containerRef.current?.querySelector("canvas");
        if (!canvas) return;
        if (neon) {
            const blur = Math.floor(8 * neonIntensity);
            const glowColor = neonColor || progressColor;
            canvas.style.filter = `drop-shadow(0 0 ${blur}px ${glowColor})`;
        } else {
            canvas.style.filter = "";
        }
    }, [neon, neonColor, progressColor, neonIntensity, isReady]);

    const handlePlayPause = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        wavesurferRef.current?.setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (!wavesurferRef.current) return;
        if (isMuted) {
            const newVol = volume === 0 ? 0.7 : volume;
            wavesurferRef.current.setVolume(newVol);
            setVolume(newVol);
            setIsMuted(false);
        } else {
            wavesurferRef.current.setVolume(0);
            setIsMuted(true);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const containerStyle = {
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
    };

    const neonGlow = neon
        ? `0 0 ${Math.floor(8 * neonIntensity)}px ${neonColor || buttonColor}`
        : "none";

    const VolumeIcon = () => {
        const vol = isMuted ? 0 : volume;
        if (vol === 0) return <VolumeX size={18} />;
        if (vol < 0.34) return <Volume1 size={18} />;
        return <Volume2 size={18} />;
    };

    const glowColor = neonColor || progressColor;
    const currentVolume = isMuted ? 0 : volume;
    const volumePercent = currentVolume * 100;

    return (
        <div className={`relative p-4 rounded-lg ${backgroundColor}`} style={containerStyle}>
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
                <div
                    className="absolute h-full"
                    style={{
                        width: `${progressPercent}%`,
                        background: `radial-gradient(ellipse at right, ${glowColor}, transparent 70%)`,
                        filter: `blur(${Math.floor(20 * glowIntensity)}px)`,
                        opacity: 0.3,
                        left: 0,
                        top: 0,
                    }}
                />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-4">
                    <motion.button
                        onClick={handlePlayPause}
                        className="flex-shrink-0 p-2 rounded-full text-white transition cursor-pointer"
                        style={{ backgroundColor: buttonColor, boxShadow: neonGlow }}
                        whileTap={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.2 }}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </motion.button>

                    <div className="flex-grow min-w-0">
                        <div ref={containerRef} />
                    </div>

                    <div
                        className="flex-shrink-0 relative"
                        onMouseEnter={() => setIsVolumeHovered(true)}
                        onMouseLeave={() => setIsVolumeHovered(false)}
                    >
                        <button
                            onClick={toggleMute}
                            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                        >
                            <VolumeIcon />
                        </button>

                        <div
                            className="absolute bottom-full left-1/2 mb-8 pointer-events-auto"
                            style={{
                                opacity: isVolumeHovered ? 1 : 0,
                                visibility: isVolumeHovered ? "visible" : "hidden",
                                transform: `translateX(-50%)`,
                                transition: "opacity 0.2s ease-out, visibility 0.2s ease-out",
                            }}
                        >
                            <div
                                style={{
                                    transform: "rotate(-90deg)",
                                    width: "80px",
                                    height: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={currentVolume}
                                    onChange={handleVolumeChange}
                                    className="cursor-pointer appearance-none rounded-lg"
                                    style={{
                                        width: "80px",
                                        height: "4px",
                                        background: `linear-gradient(to right, ${volumeSliderFillColor} ${volumePercent}%, ${volumeSliderTrackColor} ${volumePercent}%)`,
                                        boxShadow: neon
                                            ? `0 0 ${Math.floor(4 * neonIntensity)}px ${neonColor || volumeSliderFillColor}`
                                            : "none",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {showTime && (
                    <div
                        className="mt-2 text-xs font-mono text-center transition"
                        style={{
                            color: neon ? neonColor || progressColor : "inherit",
                            textShadow: neon
                                ? `0 0 ${Math.floor(4 * neonIntensity)}px ${neonColor || progressColor}`
                                : "none",
                        }}
                    >
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                )}
            </div>
        </div>
    );
}