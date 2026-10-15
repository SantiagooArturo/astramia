"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ZODIAC_SIGNS } from "@/core/landing/domain/zodiac";
import type { SkyEvent } from "@/core/reading/domain/types";
import { cn } from "@/frontend/lib/utils";

const MONTHS = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
];

/** What happens, in words anyone gets (the paragraph tells the rest). */
const VERB: Record<SkyEvent["kind"], string> = {
    entra: "entra en",
    retrograda: "parece retroceder",
    directa: "vuelve a avanzar",
};

const MINE: Record<SkyEvent["mine"][number], string> = {
    Sol: "tu Sol",
    Venus: "tu Venus",
    Luna: "tu Luna",
};

/** The arc Venus travels: from today (left) to the last moment (right). */
const P0 = { x: 30, y: 250 };
const P1 = { x: 200, y: 10 };
const P2 = { x: 370, y: 250 };
const PATH = `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`;

function along(t: number) {
    const u = 1 - t;
    return {
        x: u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x,
        y: u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y,
    };
}

/** Seconds Venus takes between two moments. */
const LEG_SECONDS = 1.3;

/**
 * The months after the reading as a path across the sky: Venus travels it
 * and stops at each moment the text talks about, lit in gold when it
 * touches their chart.
 */
export function VenusPathScene({
    events,
    focus,
}: {
    events: readonly SkyEvent[];
    /** The moment being read: Venus travels there. None: the whole path. */
    focus?: number;
}) {
    const reducedMotion = useReducedMotion();
    const stops = events.map((_, i) => (i + 1) / (events.length + 0.5));
    const target = focus === undefined ? 1 : (stops[focus] ?? 1);
    const [t, setT] = useState(reducedMotion ? target : 0);
    const tRef = useRef(t);
    tRef.current = t;

    // From wherever Venus is to the moment now being read.
    useEffect(() => {
        if (reducedMotion) {
            setT(target);
            return;
        }
        const from = tRef.current;
        const controls = animate(from, target, {
            duration: Math.max(0.8, Math.abs(target - from) * LEG_SECONDS * 3),
            ease: "easeInOut",
            delay: from === 0 ? 0.6 : 0,
            onUpdate: setT,
        });
        return () => controls.stop();
    }, [target, reducedMotion]);

    const venus = along(focus === undefined ? t * 0.98 : t);

    return (
        <div className="flex h-full w-full items-center justify-center">
            <svg
                viewBox="0 0 400 330"
                aria-hidden="true"
                className="w-[min(94vw,460px)] overflow-visible lg:w-[600px]"
            >
                <path
                    d={PATH}
                    fill="none"
                    stroke="var(--astral-ink)"
                    strokeWidth={1}
                    strokeDasharray="2 5"
                />
                <motion.path
                    d={PATH}
                    fill="none"
                    stroke="var(--astral-gold)"
                    strokeOpacity={0.7}
                    strokeWidth={1.4}
                    style={{ pathLength: t }}
                />
                <text
                    x={P0.x}
                    y={P0.y + 26}
                    textAnchor="middle"
                    className="fill-muted-foreground font-mono text-[11px] uppercase tracking-[0.18em]"
                >
                    Hoy
                </text>

                {events.map((event, i) => {
                    const at = along(stops[i]);
                    const reached = t >= stops[i] - 0.001;
                    const current = focus === i;
                    const own = event.mine.length > 0;
                    const glyph = ZODIAC_SIGNS.find(
                        (s) => s.name === event.sign,
                    )?.glyph;
                    // Labels alternate below/above so neighbours never collide.
                    const below = i % 2 === 0;
                    const dy = below ? 30 : -46;
                    return (
                        <g key={`${event.when}-${event.text}`}>
                            <circle
                                cx={at.x}
                                cy={at.y}
                                r={current ? 7 : own ? 6 : 4.5}
                                className={cn(
                                    "transition-[fill] duration-500",
                                    reached
                                        ? own
                                            ? "fill-astral-gold"
                                            : "fill-astral-gold-soft"
                                        : "fill-astral-ink",
                                )}
                            />
                            {(own || current) && reached && (
                                <motion.circle
                                    cx={at.x}
                                    cy={at.y}
                                    fill="none"
                                    stroke="var(--astral-gold)"
                                    initial={{ r: 6, opacity: 0.9 }}
                                    animate={{ r: 22, opacity: 0 }}
                                    transition={{
                                        duration: 1.6,
                                        repeat: reducedMotion ? 0 : 2,
                                    }}
                                />
                            )}
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: reached ? 1 : 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <text
                                    x={at.x}
                                    y={at.y + dy}
                                    textAnchor="middle"
                                    className="fill-muted-foreground font-mono text-[11px] uppercase tracking-[0.16em]"
                                >
                                    {MONTHS[event.month]}
                                </text>
                                <text
                                    x={at.x}
                                    y={at.y + dy + 17}
                                    textAnchor="middle"
                                    className={cn(
                                        "font-display text-[17px]",
                                        own
                                            ? "fill-astral-gold"
                                            : "fill-foreground",
                                    )}
                                >
                                    {event.kind === "entra"
                                        ? `${glyph ?? ""} ${event.sign}`
                                        : VERB[event.kind]}
                                </text>
                                {own && (
                                    <text
                                        x={at.x}
                                        y={at.y + dy + 31}
                                        textAnchor="middle"
                                        className="fill-astral-gold font-mono text-[9px] uppercase tracking-[0.14em]"
                                    >
                                        {event.mine
                                            .map((b) => MINE[b])
                                            .join(" · ")}
                                    </text>
                                )}
                            </motion.g>
                        </g>
                    );
                })}

                <g transform={`translate(${venus.x} ${venus.y})`}>
                    <circle
                        r={16}
                        fill="oklch(0.9 0.07 75 / 25%)"
                        style={{ filter: "blur(6px)" }}
                    />
                    <circle r={8} fill="url(#venus-path-orb)" />
                </g>
                <defs>
                    <radialGradient id="venus-path-orb" cx="38%" cy="34%">
                        <stop offset="0%" stopColor="#fffdf6" />
                        <stop offset="45%" stopColor="#f3dfbd" />
                        <stop offset="100%" stopColor="#a8825a" />
                    </radialGradient>
                </defs>
            </svg>
        </div>
    );
}
