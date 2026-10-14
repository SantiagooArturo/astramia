"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ShimmerText } from "@/core/landing/client/effects";
import { ZODIAC_SIGNS } from "@/core/landing/domain/zodiac";
import { longDate } from "@/core/reading/domain/chart";
import type { AspectName, NatalChart } from "@/core/reading/domain/types";

const C = 200;
/** The hook arrives in ~3 s, so its wheel completes faster. */
const STEP_MS = { teaser: 750, reading: 1700 } as const;

/** U+FE0E keeps ♀/♂ as text glyphs instead of emoji. */
const GLYPHS: Record<string, string> = {
    Sol: "☉︎",
    Luna: "☾︎",
    Venus: "♀︎",
    Marte: "♂︎",
};

const ASPECT_COLOR: Record<AspectName, string> = {
    conjunción: "var(--astral-violet)",
    sextil: "var(--astral-cyan)",
    trígono: "var(--astral-gold)",
    cuadratura: "var(--astral-rose)",
    oposición: "var(--astral-rose)",
};

const ASPECT_ARTICLE: Record<AspectName, string> = {
    conjunción: "La conjunción",
    sextil: "El sextil",
    trígono: "El trígono",
    cuadratura: "La cuadratura",
    oposición: "La oposición",
};

/**
 * 0° Aries on the left and the zodiac running counter-clockwise, as natal
 * charts are drawn. Rounded so server and client markup match (hydration).
 */
function point(longitude: number, radius: number) {
    const angle = ((180 + longitude) * Math.PI) / 180;
    return {
        x: Math.round((C + radius * Math.cos(angle)) * 100) / 100,
        y: Math.round((C - radius * Math.sin(angle)) * 100) / 100,
    };
}

function captions(
    chart: NatalChart,
    birthDate: string,
    mode: "teaser" | "reading",
): string[] {
    const [sun, moon, venus, mars] = chart.placements;
    const lines = [
        `Trazando el cielo del ${longDate(birthDate)}`,
        `Tu Sol en ${sun.sign}`,
        chart.moonRange
            ? `Tu Luna, entre ${chart.moonRange.early} y ${chart.moonRange.late}`
            : `Tu Luna en ${moon.sign}`,
        `Venus en ${venus.sign}: cómo amas`,
        `Marte en ${mars.sign}: cómo deseas`,
    ];
    const aspect = chart.aspects[0];
    lines.push(
        aspect
            ? `${ASPECT_ARTICLE[aspect.name]} entre tu ${aspect.a} y tu ${aspect.b}`
            : "Uniendo los hilos de tu carta",
    );
    lines.push(
        mode === "reading"
            ? "Siguiendo a Venus en los próximos meses"
            : "Buscando lo que tu carta repite",
    );
    lines.push(
        mode === "reading" ? "Escribiendo tu lectura" : "Leyendo tu carta",
    );
    return lines;
}

/**
 * The wait, made part of the reading: the person's own chart is drawn on a
 * zodiac wheel (their real placements and aspects) while the model writes,
 * with captions naming what is being "read". Loops on the last caption.
 */
export function ChartReveal({
    chart,
    birthDate,
    mode,
}: {
    chart: NatalChart;
    birthDate: string;
    mode: "teaser" | "reading";
}) {
    const reducedMotion = useReducedMotion();
    const lines = useMemo(
        () => captions(chart, birthDate, mode),
        [chart, birthDate, mode],
    );
    const last = lines.length - 1;
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (reducedMotion) {
            setStep(last);
            return;
        }
        const timer = window.setInterval(
            () => setStep((s) => Math.min(s + 1, last)),
            STEP_MS[mode],
        );
        return () => window.clearInterval(timer);
    }, [last, mode, reducedMotion]);

    // Conjunct planets would overlap: the later ones move inwards.
    const placed = chart.placements.map((p, i, all) => {
        const crowded = all
            .slice(0, i)
            .some(
                (q) =>
                    Math.abs(((p.longitude - q.longitude + 540) % 360) - 180) <
                    10,
            );
        return { ...p, ...point(p.longitude, crowded ? 92 : 118) };
    });
    const byBody = new Map(placed.map((p) => [p.body, p]));
    const duration = reducedMotion ? 0 : 0.9;

    return (
        <div className="flex flex-col items-center gap-8 py-6">
            <div className="relative aspect-square w-[min(80vw,320px)]">
                <motion.div
                    aria-hidden
                    className="absolute inset-[12%] rounded-full bg-astral-violet/20 blur-3xl"
                    animate={
                        reducedMotion
                            ? undefined
                            : {
                                  opacity: [0.4, 0.9, 0.4],
                                  scale: [0.95, 1.05, 0.95],
                              }
                    }
                    transition={{
                        duration: 6,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                />
                <motion.svg
                    viewBox="0 0 400 400"
                    aria-hidden="true"
                    className="relative h-full w-full overflow-visible"
                    animate={
                        reducedMotion || step < last
                            ? undefined
                            : { rotate: 360 }
                    }
                    transition={{
                        duration: 240,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                    }}
                >
                    <motion.circle
                        cx={C}
                        cy={C}
                        r={190}
                        fill="none"
                        stroke="var(--astral-gold)"
                        strokeOpacity={0.6}
                        strokeWidth={1.2}
                        initial={{ pathLength: reducedMotion ? 1 : 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                            duration: reducedMotion ? 0 : 1.4,
                            ease: "easeInOut",
                        }}
                    />
                    <circle
                        cx={C}
                        cy={C}
                        r={150}
                        fill="none"
                        stroke="var(--astral-ink)"
                        strokeWidth={1}
                    />
                    {ZODIAC_SIGNS.map((sign, i) => {
                        const from = point(i * 30, 150);
                        const to = point(i * 30, 190);
                        const label = point(i * 30 + 15, 170);
                        const own = placed.some((p) => p.sign === sign.name);
                        return (
                            <g key={sign.id}>
                                <line
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke="var(--astral-ink)"
                                    strokeWidth={1}
                                />
                                <motion.text
                                    x={label.x}
                                    y={label.y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={16}
                                    fill={
                                        own
                                            ? "var(--astral-gold)"
                                            : "currentColor"
                                    }
                                    className="text-muted-foreground"
                                    initial={{ opacity: reducedMotion ? 1 : 0 }}
                                    animate={{ opacity: own ? 1 : 0.55 }}
                                    transition={{
                                        duration,
                                        delay: reducedMotion
                                            ? 0
                                            : 0.4 + i * 0.05,
                                    }}
                                >
                                    {sign.glyph}
                                </motion.text>
                            </g>
                        );
                    })}

                    {chart.aspects.map((aspect) => {
                        const a = byBody.get(aspect.a);
                        const b = byBody.get(aspect.b);
                        if (!a || !b) return null;
                        return (
                            <motion.line
                                key={`${aspect.a}-${aspect.b}`}
                                x1={a.x}
                                y1={a.y}
                                x2={b.x}
                                y2={b.y}
                                stroke={ASPECT_COLOR[aspect.name]}
                                strokeWidth={1.5}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={
                                    step >= 5
                                        ? { pathLength: 1, opacity: 0.85 }
                                        : { pathLength: 0, opacity: 0 }
                                }
                                transition={{
                                    duration: reducedMotion ? 0 : 1.2,
                                    ease: "easeInOut",
                                }}
                            />
                        );
                    })}

                    {placed.map((p, i) => {
                        const shown = step >= i + 1;
                        return (
                            <motion.g
                                key={p.body}
                                initial={{ opacity: 0, scale: 0.3 }}
                                animate={
                                    shown
                                        ? { opacity: 1, scale: 1 }
                                        : { opacity: 0, scale: 0.3 }
                                }
                                transition={{
                                    duration,
                                    ease: [0.2, 0.8, 0.2, 1],
                                }}
                                style={{
                                    transformBox: "fill-box",
                                    transformOrigin: "center",
                                }}
                            >
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r={17}
                                    fill="var(--astral-void)"
                                    stroke="var(--astral-gold)"
                                    strokeOpacity={0.8}
                                    strokeDasharray={
                                        p.body === "Luna" && chart.moonRange
                                            ? "3 4"
                                            : undefined
                                    }
                                />
                                <text
                                    x={p.x}
                                    y={p.y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={18}
                                    fill="var(--astral-gold)"
                                >
                                    {GLYPHS[p.body] ?? p.body[0]}
                                </text>
                            </motion.g>
                        );
                    })}
                </motion.svg>
            </div>

            <div className="flex min-h-14 flex-col items-center gap-2 text-center">
                <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                    {mode === "reading"
                        ? "Tu lectura completa"
                        : "Tu carta natal"}
                </p>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={step}
                        role="status"
                        aria-live="polite"
                        className="text-pretty font-display text-2xl sm:text-3xl"
                        initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
                        transition={{ duration: reducedMotion ? 0 : 0.5 }}
                    >
                        {step === last ? (
                            <ShimmerText>{lines[step]}…</ShimmerText>
                        ) : (
                            `${lines[step]}…`
                        )}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
}
