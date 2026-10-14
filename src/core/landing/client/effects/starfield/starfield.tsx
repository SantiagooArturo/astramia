"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/frontend/lib/utils";
import styles from "./starfield.module.css";

interface Star {
    x: number;
    y: number;
    radius: number;
    depth: number;
    phase: number;
    speed: number;
}

interface ShootingStar {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
}

const STAR_DENSITY = 1 / 5200;
const SHOOTING_STAR_CHANCE = 0.004;
const PARALLAX_STRENGTH = 18;
/** Stars inside this radius of the pointer join a temporary constellation. */
const LINK_RADIUS = 150;
const MAX_LINKS_PER_STAR = 3;
const STAR_COLOR = "233, 228, 255";
const GOLD_COLOR = "246, 231, 193";

function createStars(width: number, height: number): Star[] {
    const count = Math.round(width * height * STAR_DENSITY);
    return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.2 + 0.2,
        depth: Math.random(),
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.002 + 0.0005,
    }));
}

/**
 * Twinkling, parallax canvas starfield with occasional shooting stars.
 * Stars near the pointer link up into a faint, hand-drawn constellation.
 */
export function Starfield({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        let stars: Star[] = [];
        let shooting: ShootingStar[] = [];
        let width = 0;
        let height = 0;
        let frame = 0;
        const pointer = { x: 0, y: 0, tx: 0, ty: 0, px: -1e4, py: -1e4 };
        const positions: { x: number; y: number }[] = [];

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio, 2);
            width = canvas.clientWidth;
            height = canvas.clientHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            stars = createStars(width, height);
            positions.length = 0;
        };

        const drawConstellation = () => {
            const near: number[] = [];
            for (let i = 0; i < positions.length; i++) {
                const p = positions[i];
                const dx = p.x - pointer.px;
                const dy = p.y - pointer.py;
                if (dx * dx + dy * dy < LINK_RADIUS * LINK_RADIUS) {
                    near.push(i);
                }
            }
            if (near.length < 2) return;

            ctx.lineWidth = 0.6;
            ctx.lineCap = "round";
            for (let a = 0; a < near.length; a++) {
                const pa = positions[near[a]];
                const toPointer = Math.hypot(
                    pa.x - pointer.px,
                    pa.y - pointer.py,
                );
                let links = 0;
                for (let b = a + 1; b < near.length; b++) {
                    if (links >= MAX_LINKS_PER_STAR) break;
                    const pb = positions[near[b]];
                    const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
                    if (dist > LINK_RADIUS * 0.7) continue;
                    const alpha =
                        (1 - toPointer / LINK_RADIUS) *
                        (1 - dist / (LINK_RADIUS * 0.7)) *
                        0.55;
                    ctx.strokeStyle = `rgba(${GOLD_COLOR}, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(pa.x, pa.y);
                    ctx.lineTo(pb.x, pb.y);
                    ctx.stroke();
                    links++;
                }
                // Brighten the linked stars a touch.
                const glow = 1 - toPointer / LINK_RADIUS;
                ctx.fillStyle = `rgba(${GOLD_COLOR}, ${glow * 0.9})`;
                ctx.beginPath();
                ctx.arc(pa.x, pa.y, 1.4, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const draw = (time: number) => {
            ctx.clearRect(0, 0, width, height);
            pointer.x += (pointer.tx - pointer.x) * 0.05;
            pointer.y += (pointer.ty - pointer.y) * 0.05;

            for (let i = 0; i < stars.length; i++) {
                const star = stars[i];
                const twinkle = reducedMotion
                    ? 0.8
                    : 0.55 + Math.sin(time * star.speed + star.phase) * 0.45;
                const offset = star.depth * PARALLAX_STRENGTH;
                const x = star.x + pointer.x * offset;
                const y = star.y + pointer.y * offset;
                positions[i] = { x, y };
                ctx.globalAlpha = twinkle * (0.4 + star.depth * 0.6);
                ctx.fillStyle =
                    star.depth > 0.85
                        ? `rgb(${GOLD_COLOR})`
                        : `rgb(${STAR_COLOR})`;
                ctx.beginPath();
                ctx.arc(x, y, star.radius * (0.6 + star.depth), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
            if (!reducedMotion) drawConstellation();

            if (!reducedMotion && Math.random() < SHOOTING_STAR_CHANCE) {
                shooting.push({
                    x: Math.random() * width,
                    y: Math.random() * height * 0.4,
                    vx: -(4 + Math.random() * 4),
                    vy: 2 + Math.random() * 2,
                    life: 1,
                });
            }

            for (const s of shooting) {
                const gradient = ctx.createLinearGradient(
                    s.x,
                    s.y,
                    s.x - s.vx * 14,
                    s.y - s.vy * 14,
                );
                gradient.addColorStop(0, `rgba(255,240,210,${s.life})`);
                gradient.addColorStop(1, "rgba(255,240,210,0)");
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(s.x - s.vx * 14, s.y - s.vy * 14);
                ctx.stroke();
                s.x += s.vx;
                s.y += s.vy;
                s.life -= 0.012;
            }
            shooting = shooting.filter((s) => s.life > 0);

            if (!reducedMotion) frame = requestAnimationFrame(draw);
        };

        const onPointerMove = (event: PointerEvent) => {
            pointer.tx = event.clientX / window.innerWidth - 0.5;
            pointer.ty = event.clientY / window.innerHeight - 0.5;
            pointer.px = event.clientX;
            pointer.py = event.clientY;
        };
        const onPointerLeave = () => {
            pointer.px = -1e4;
            pointer.py = -1e4;
        };

        resize();
        frame = requestAnimationFrame(draw);
        window.addEventListener("resize", resize);
        window.addEventListener("pointermove", onPointerMove, {
            passive: true,
        });
        document.addEventListener("pointerleave", onPointerLeave);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", resize);
            window.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerleave", onPointerLeave);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            className={cn(styles.canvas, className)}
        />
    );
}
