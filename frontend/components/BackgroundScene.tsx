"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface ShieldProps {
    initialPosition: [number, number, number];
    rotSpeedX?: number;
    rotSpeedY?: number;
    rotSpeedZ?: number;
    moveAmplitude?: [number, number, number];
    moveSpeed?: [number, number, number];
    scale?: [number, number, number];
    repulsionRadius?: number;    // радиус, на котором начинает действовать отталкивание
    repulsionStrength?: number;  // сила отталкивания
}

function Shield({
    initialPosition,
    rotSpeedX = 0.2,
    rotSpeedY = 0.15,
    rotSpeedZ = 0.1,
    moveAmplitude = [1.2, 0.8, 0.5],
    moveSpeed = [0.3, 0.4, 0.2],
    scale = [0.8, 0.8, 0.8],
    repulsionRadius = 1.5,
    repulsionStrength = 0.8,
    }: ShieldProps) {
    const groupRef = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const timeRef = useRef(0);
    
    // Смещение отталкивания (накапливается и затухает)
    const repulsionOffset = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
    
    // Позиция мыши в 3D (приближённая)
    const mouse3D = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
    
    const { scene } = useGLTF("/models/shield.glb");
    const clonedScene = scene.clone();

    // Преобразуем движение мыши в 3D-координаты на плоскости щитов
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
        const nx = (event.clientX / window.innerWidth) * 2 - 1;
        const ny = (event.clientY / window.innerHeight) * 2 - 1;
        // Диапазон: X от -4 до 4, Y от -2.5 до 2.5
        const rangeX = 5.0;
        const rangeY = 3.5;
        mouse3D.current.set(nx * rangeX, -ny * rangeY, -1.2);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current || !meshRef.current) return;

        timeRef.current += delta;
        const t = timeRef.current;

        // Базовая позиция (синусоидальное движение)
        let baseX = initialPosition[0] + Math.sin(t * moveSpeed[0]) * moveAmplitude[0];
        let baseY = initialPosition[1] + Math.cos(t * moveSpeed[1]) * moveAmplitude[1];
        let baseZ = initialPosition[2] + Math.sin(t * moveSpeed[2]) * moveAmplitude[2];

        // Текущая позиция щита с учётом уже накопленного отталкивания
        const currentPos = new THREE.Vector3(
        baseX + repulsionOffset.current.x,
        baseY + repulsionOffset.current.y,
        baseZ + repulsionOffset.current.z
        );

        // Вектор от мыши к щиту
        const toShield = new THREE.Vector3().subVectors(currentPos, mouse3D.current);
        const distance = toShield.length();

        // Если мышь близко, добавляем силу отталкивания (чем ближе, тем сильнее)
        if (distance < repulsionRadius && distance > 0.01) {
        // Сила пропорциональна близости и усилению
        const force = repulsionStrength * (1 - distance / repulsionRadius) * delta * 5;
        const direction = toShield.clone().normalize();
        repulsionOffset.current.x += direction.x * force;
        repulsionOffset.current.y += direction.y * force;
        repulsionOffset.current.z += direction.z * force;
        }

        // Затухание: смещение постепенно возвращается к нулю (возврат на траекторию)
        const damping = 0.999;
        repulsionOffset.current.x *= damping;
        repulsionOffset.current.y *= damping;
        repulsionOffset.current.z *= damping;

        // Финальная позиция
        groupRef.current.position.x = baseX + repulsionOffset.current.x;
        groupRef.current.position.y = baseY + repulsionOffset.current.y;
        groupRef.current.position.z = baseZ + repulsionOffset.current.z;

        // Вращение щита
        meshRef.current.rotation.x += rotSpeedX * delta;
        meshRef.current.rotation.y += rotSpeedY * delta;
        meshRef.current.rotation.z += rotSpeedZ * delta;
    });

    return (
        <group ref={groupRef} position={initialPosition}>
        <Float speed={1.5} rotationIntensity={0} floatIntensity={0.8}>
            <mesh ref={meshRef} scale={scale}>
            <primitive object={clonedScene} />
            </mesh>
        </Float>
        </group>
    );
}

export default function BackgroundScene() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <Canvas
        style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9,
            pointerEvents: "none",
        }}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 6], fov: 45 }}
        >
            <ambientLight intensity={0.8} />
            <pointLight position={[3, 3, 2]} intensity={2.0} color="#ffffff" />
            <pointLight position={[-2, 1, 3]} intensity={4} color="#ffffff" />
            <pointLight position={[0, 4, 1]} intensity={1.2} color="#ffffff" />
            <pointLight position={[0, -2, 0]} intensity={5} color="#ffffff" />


        <Shield
            initialPosition={[-2.5, 0.2, -1]}
            rotSpeedX={0.18}
            rotSpeedY={0.22}
            rotSpeedZ={0.1}
            moveAmplitude={[1.0, 0.7, 0.4]}
            moveSpeed={[0.25, 0.35, 0.18]}
            scale={[0.7, 0.7, 0.7]}
            repulsionRadius={1.5}
            repulsionStrength={0.5}
        />
        <Shield
            initialPosition={[0, -0.3, -0.5]}
            rotSpeedX={0.25}
            rotSpeedY={0.15}
            rotSpeedZ={0.2}
            moveAmplitude={[0.9, 0.6, 0.6]}
            moveSpeed={[0.3, 0.4, 0.22]}
            scale={[0.8, 0.8, 0.8]}
            repulsionRadius={1.5}
            repulsionStrength={0.5}
        />
        <Shield
            initialPosition={[2.2, 0.5, -1.2]}
            rotSpeedX={0.12}
            rotSpeedY={0.28}
            rotSpeedZ={0.15}
            moveAmplitude={[1.1, 0.9, 0.5]}
            moveSpeed={[0.2, 0.3, 0.25]}
            scale={[0.75, 0.75, 0.75]}
            repulsionRadius={1.5}
            repulsionStrength={0.5}
        />
        </Canvas>
    );
}

useGLTF.preload("/models/shield.glb");