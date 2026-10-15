"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { NatalChart } from "@/core/reading/domain/types";
import { NatalWheel, WHEEL_DRAW_STEPS } from "../../components/natal-wheel";

const WHEEL_SIZE = "w-[min(84vw,400px)] lg:w-[520px]";

/** Their chart drawing itself, body by body, then turning very slowly. */
export function SkyScene({
    chart,
    litAspects = false,
}: {
    chart: NatalChart;
    litAspects?: boolean;
}) {
    const reducedMotion = useReducedMotion();
    const [drawn, setDrawn] = useState(reducedMotion ? WHEEL_DRAW_STEPS : 0);

    useEffect(() => {
        if (reducedMotion) {
            setDrawn(WHEEL_DRAW_STEPS);
            return;
        }
        const timer = window.setInterval(
            () =>
                setDrawn((d) => {
                    if (d >= WHEEL_DRAW_STEPS) window.clearInterval(timer);
                    return Math.min(d + 1, WHEEL_DRAW_STEPS);
                }),
            550,
        );
        return () => window.clearInterval(timer);
    }, [reducedMotion]);

    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className={`relative aspect-square ${WHEEL_SIZE}`}>
                <motion.div
                    aria-hidden
                    className="absolute inset-[14%] rounded-full bg-astral-violet/25 blur-3xl"
                    animate={
                        reducedMotion
                            ? undefined
                            : {
                                  opacity: [0.4, 0.85, 0.4],
                                  scale: [0.95, 1.05, 0.95],
                              }
                    }
                    transition={{
                        duration: 7,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                />
                <NatalWheel
                    chart={chart}
                    drawn={drawn}
                    spin
                    litAspects={litAspects}
                    className="relative"
                />
            </div>
        </div>
    );
}

const STAR =
    "M12 1.5 14.2 9.8 22.5 12 14.2 14.2 12 22.5 9.8 14.2 1.5 12 9.8 9.8Z";

/** One small light: something to do this week. */
export function StarScene() {
    const reducedMotion = useReducedMotion();
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="relative size-[min(46vw,220px)] lg:size-[260px]">
                <motion.div
                    aria-hidden
                    className="absolute inset-[-40%] rounded-full bg-astral-gold/20 blur-3xl"
                    animate={
                        reducedMotion ? undefined : { opacity: [0.5, 1, 0.5] }
                    }
                    transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                />
                {!reducedMotion && (
                    <motion.div
                        aria-hidden
                        className="absolute inset-0 rounded-full border border-astral-gold/60"
                        initial={{ scale: 0.2, opacity: 1 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{
                            duration: 2.2,
                            delay: 0.4,
                            ease: "easeOut",
                        }}
                    />
                )}
                <motion.svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="relative h-full w-full drop-shadow-[0_0_24px_var(--astral-gold)]"
                    initial={{ scale: reducedMotion ? 1 : 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        duration: reducedMotion ? 0 : 1.4,
                        ease: [0.2, 0.8, 0.2, 1],
                    }}
                >
                    <path d={STAR} fill="var(--astral-gold)" />
                </motion.svg>
            </div>
        </div>
    );
}

/**
 * The night ends: a sun rises from the bottom edge. It's the same sun that
 * answers in the chat right after.
 */
export function DawnScene() {
    const reducedMotion = useReducedMotion();
    return (
        <div className="relative h-full w-full overflow-hidden">
            <motion.div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-full"
                style={{
                    background:
                        "radial-gradient(ellipse 100% 85% at 50% 100%, oklch(0.78 0.14 60 / 40%), oklch(0.7 0.15 40 / 24%) 30%, oklch(0.6 0.15 20 / 11%) 55%, oklch(0.5 0.1 300 / 4%) 75%, transparent 95%)",
                }}
                initial={{ opacity: reducedMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reducedMotion ? 0 : 2.4 }}
            />
            <motion.div
                aria-hidden
                className="absolute left-1/2 size-[min(70vw,420px)] -translate-x-1/2"
                initial={{ bottom: reducedMotion ? "-14%" : "-45%" }}
                animate={{ bottom: "-14%" }}
                transition={{
                    duration: reducedMotion ? 0 : 3.2,
                    ease: [0.2, 0.7, 0.2, 1],
                }}
            >
                {/* A gradient halo: a blurred shadow this big is slow on phones. */}
                <div
                    className="absolute inset-[-45%] rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle, oklch(0.8 0.15 70 / 50%) 30%, oklch(0.75 0.15 60 / 18%) 50%, transparent 70%)",
                    }}
                />
                <div
                    className="relative size-full rounded-full"
                    style={{
                        background:
                            "radial-gradient(circle at 50% 40%, #fffbe8 0%, #ffd66b 30%, #f2a531 62%, #c8641a 100%)",
                    }}
                />
            </motion.div>
        </div>
    );
}
