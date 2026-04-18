"use client";

import { useRef, useState, useEffect } from "react";
import { useWavesurfer } from "@wavesurfer/react";
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
    }: WaveformPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [progressPercent, setProgressPercent] = useState(0);
    const [isVolumeHovered, setIsVolumeHovered] = useState(false);

    const { wavesurfer, isPlaying } = useWavesurfer({
        container: containerRef,
        url: src,
        height: waveHeight,
        waveColor,
        progressColor,
        normalize: true,
        barWidth: 1,
        barGap: 2,
        barRadius: 360,
    });

    useEffect(() => {
        if (!neon || !wavesurfer) return;
        const canvas = containerRef.current?.querySelector("canvas");
        if (canvas) {
        const blur = Math.floor(8 * neonIntensity);
        const glowColor = neonColor || progressColor;
        canvas.style.filter = `drop-shadow(0 0 ${blur}px ${glowColor})`;
        }
    }, [wavesurfer, neon, neonColor, progressColor, neonIntensity]);

    useEffect(() => {
        if (!neon) {
        const canvas = containerRef.current?.querySelector("canvas");
        if (canvas) canvas.style.filter = "";
        }
    }, [neon]);

    useEffect(() => {
        if (!wavesurfer) return;

        const handleReady = () => {
        const dur = wavesurfer.getDuration();
        setDuration(dur);
        setVolume(wavesurfer.getVolume());
        setCurrentTime(0);
        setProgressPercent(0);
        };
        const handleVolume = (newVolume: number) => {
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        };
        const handleTimeUpdate = () => {
        const current = wavesurfer.getCurrentTime();
        const dur = wavesurfer.getDuration();
        setCurrentTime(current);
        if (dur > 0) {
            setProgressPercent((current / dur) * 100);
        }
        };
        wavesurfer.on("ready", handleReady);
        wavesurfer.on("volume", handleVolume);
        wavesurfer.on("timeupdate", handleTimeUpdate);

        return () => {
        wavesurfer.un("ready", handleReady);
        wavesurfer.un("volume", handleVolume);
        wavesurfer.un("timeupdate", handleTimeUpdate);
        };
    }, [wavesurfer]);

    const handlePlayPause = () => wavesurfer?.playPause();
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        wavesurfer?.setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };
    const toggleMute = () => {
        if (!wavesurfer) return;
        if (isMuted) {
        const newVol = volume === 0 ? 0.7 : volume;
        wavesurfer.setVolume(newVol);
        setVolume(newVol);
        setIsMuted(false);
        } else {
        wavesurfer.setVolume(0);
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

    return (
        <div
        className={`relative p-4 rounded-lg shadow-md ${backgroundColor}`}
        style={containerStyle}
        >
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
                style={{
                backgroundColor: buttonColor,
                boxShadow: neonGlow,
                }}
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
                className="absolute top-1/2 -translate-y-1/2 left-full ml-2 overflow-hidden pointer-events-auto"
                style={{
                    width: isVolumeHovered ? 96 : 0,
                    opacity: isVolumeHovered ? 1 : 0,
                    transition: "width 0.2s ease-out, opacity 0.2s ease-out",
                }}
                >
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 rounded-lg appearance-none cursor-pointer"
                    style={{
                    background: `linear-gradient(to right, ${volumeSliderFillColor} ${(isMuted ? 0 : volume) * 100}%, ${volumeSliderTrackColor} ${(isMuted ? 0 : volume) * 100}%)`,
                    boxShadow: neon ? `0 0 ${Math.floor(4 * neonIntensity)}px ${neonColor || volumeSliderFillColor}` : "none",
                    }}
                />
                </div>
            </div>
            </div>

            {showTime && (
            <div
                className="mt-2 text-xs font-mono text-center transition"
                style={{
                color: neon ? neonColor || progressColor : "inherit",
                textShadow: neon ? `0 0 ${Math.floor(4 * neonIntensity)}px ${neonColor || progressColor}` : "none",
                }}
            >
                {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            )}
        </div>
        </div>
    );
}