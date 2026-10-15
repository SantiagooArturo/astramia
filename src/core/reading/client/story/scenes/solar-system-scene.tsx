"use client";

import {
    AnimatePresence,
    animate,
    motion,
    useMotionValue,
    useReducedMotion,
    useTransform,
} from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { MoonPhaseName } from "@/core/landing/domain/ephemeris";
import {
    BAND,
    type Point,
    type SystemBody,
    solarSystemView,
} from "@/core/reading/domain/solar-system";
import type { StoryBody } from "@/core/reading/domain/story";
import type { NatalChart } from "@/core/reading/domain/types";
import { MoonPhaseScene } from "./moon-phase-scene";
import { PlanetScene } from "./planet-scene";

/**
 * The body the camera flies to and what it shows there: the sign it was in
 * (with the line of sight that puts it there), or the Moon's phase.
 */
export type SystemFocus =
    | { body: StoryBody; sign: string; signs?: readonly [string, string] }
    | { body: "Luna"; phase: MoonPhaseName };

/** Half the view: the band's outer edge plus a little air. */
const HALF = 1.04;

/**
 * Each body from afar: its radius, and a small rendered sphere of it
 * (scripts/planet-sprites.py), lit from its right.
 */
const LOOK: Record<SystemBody, { r: number; sprite: string }> = {
    Sol: { r: 0.055, sprite: "sol" },
    Venus: { r: 0.02, sprite: "venus" },
    Tierra: { r: 0.022, sprite: "tierra" },
    Marte: { r: 0.017, sprite: "marte" },
    Luna: { r: 0.009, sprite: "luna" },
};
/** The sphere's share of its sprite: the rest is atmosphere or flames. */
const SPRITE_SPHERE = 0.86;

/** Turns a sprite (lit from its right) so its day side faces the Sun. */
function towardTheSun(p: Point): number {
    return (Math.atan2(-p.y, -p.x) * 180) / Math.PI;
}

/** How close the camera gets: the dot grows to about the globe that replaces it. */
const ZOOM: Record<StoryBody, number> = {
    Sol: 7,
    Venus: 17,
    Marte: 20,
    Luna: 34,
};

const IN = { duration: 1.5, ease: [0.45, 0, 0.15, 1] } as const;
const OUT = { duration: 1, ease: [0.4, 0, 0.2, 1] } as const;

/**
 * The camera between the whole system (t = 0) and one body (t = 1). The
 * scale grows geometrically, which reads as an even zoom, and the body
 * slides steadily to the middle instead of swinging out first.
 */
function cameraAt(t: number, to: Point, zoom: number) {
    const scale = zoom ** t;
    const half = HALF / scale;
    const x = to.x - ((1 - t) * to.x) / scale;
    const y = to.y - ((1 - t) * to.y) / scale;
    return `${x - half} ${y - half} ${2 * half} ${2 * half}`;
}

/** The ring between two signs' starts, on the band. */
function sectorPath(
    from: { inner: Point; outer: Point },
    to: { inner: Point; outer: Point },
) {
    const p = (q: Point) => `${q.x} ${q.y}`;
    // Signs run counterclockwise: sweep 0 forward on the inside, 1 back.
    return `M ${p(from.inner)} A ${BAND.inner} ${BAND.inner} 0 0 0 ${p(to.inner)} L ${p(to.outer)} A ${BAND.outer} ${BAND.outer} 0 0 1 ${p(from.outer)} Z`;
}

/** Which way a label runs from its point. */
type Side = "center" | "left" | "right";

const SIDE: Record<Side, string> = {
    center: "-translate-x-1/2",
    // Ends at the point: the text sits to its left.
    left: "-translate-x-full",
    right: "",
};

/** A label over the drawing, in page type (it doesn't grow with the zoom). */
function Label({
    at,
    side = "center",
    children,
    className,
}: {
    at: Point;
    side?: Side;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={`absolute -translate-y-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] lg:text-[11px] ${SIDE[side]} ${className ?? ""}`}
            style={{
                left: `${((at.x + HALF) / (2 * HALF)) * 100}%`,
                top: `${((at.y + HALF) / (2 * HALF)) * 100}%`,
            }}
        >
            {children}
        </span>
    );
}

/**
 * Where a body's name goes: beside its dot, never over it. Venus's and the
 * Moon's toward the Sun, the others' away from it, so neighbors never
 * write over each other.
 */
function nameAt(body: SystemBody, p: Point): { at: Point; side: Side } {
    if (body === "Sol")
        return { at: { x: 0, y: LOOK.Sol.r + 0.06 }, side: "center" };
    const right = p.x >= 0 ? 1 : -1;
    // The Moon's name goes on the Sun's side too, away from the Earth's.
    const outward = body === "Venus" || body === "Luna" ? -right : right;
    const gap = LOOK[body].r + 0.025;
    return {
        at: { x: p.x + outward * gap, y: p.y },
        side: outward < 0 ? "left" : "right",
    };
}

/**
 * The solar system the day they were born: the Sun, Venus, the Earth and
 * Mars where they really were, the signs around them as seen from here.
 * When the story turns to a body, the camera pulls back, draws the line
 * from the Earth through that body to its sign (that's what "Venus en
 * Aries" means), and flies in until the body is the globe on screen.
 */
export function SolarSystemScene({
    chart,
    born,
    focus,
}: {
    chart: NatalChart;
    born: string;
    focus: SystemFocus | null;
}) {
    const reducedMotion = useReducedMotion();
    const view = useMemo(() => solarSystemView(chart), [chart]);
    const glowId = `${useId().replace(/:/g, "")}-glow`;

    // Where the camera flies to; it only changes while the camera is out.
    const target = useRef<StoryBody>(focus?.body ?? "Sol");
    const progress = useMotionValue(0);
    const viewBox = useTransform(progress, (t) =>
        cameraAt(t, view.bodies[target.current], ZOOM[target.current]),
    );
    // The drawing gives way to the globe at the end of the flight.
    const mapOpacity = useTransform(progress, [0, 0.7, 1], [1, 1, 0]);
    const labelsOpacity = useTransform(progress, [0, 0.12], [1, 0]);

    /** The body the camera is going to (its name lights up). */
    const [aim, setAim] = useState<StoryBody | null>(null);
    /** The line of sight on screen, from the Earth through this body. */
    const [sight, setSight] = useState<StoryBody | null>(null);
    const [arrived, setArrived] = useState<SystemFocus | null>(null);
    const mounted = useRef(false);

    // The flight restarts only when where it goes changes, not when an
    // equal `focus` arrives with the next step.
    const sign = focus && "sign" in focus ? focus.sign : null;
    const phase = focus && "phase" in focus ? focus.phase : null;
    // biome-ignore lint/correctness/useExhaustiveDependencies: `focus` is read through these keys.
    useEffect(() => {
        let live = true;
        const timers: number[] = [];
        const wait = (ms: number) =>
            new Promise<void>((done) => {
                timers.push(window.setTimeout(done, ms));
            });
        const first = !mounted.current;
        mounted.current = true;

        async function fly() {
            setArrived(null);
            // A phase is not a sign: no line of sight, just the flight.
            const line = focus && !phase ? focus.body : null;
            if (reducedMotion) {
                if (focus) target.current = focus.body;
                progress.set(focus ? 1 : 0);
                setAim(focus?.body ?? null);
                setSight(line);
                setArrived(focus);
                return;
            }
            if (progress.get() > 0) {
                setSight(null);
                setAim(null);
                await animate(progress, 0, OUT);
            }
            if (!live || !focus) return;
            target.current = focus.body;
            // Coming from another scene, let the whole system be seen first.
            await wait(first ? 700 : 150);
            if (!live) return;
            setAim(focus.body);
            setSight(line);
            await wait(line ? 1100 : 700);
            if (!live) return;
            const flight = animate(progress, 1, IN);
            // The globe takes over while the camera is still arriving.
            await wait(IN.duration * 620);
            if (!live) return;
            setArrived(focus);
            await flight;
        }
        fly();
        return () => {
            live = false;
            for (const timer of timers) window.clearTimeout(timer);
            progress.stop();
        };
    }, [focus?.body, sign, phase, reducedMotion, progress]);

    const line = sight ? view.sight(sight) : null;
    const lit = new Set(
        sight
            ? focus && "signs" in focus && focus.signs && focus.body === sight
                ? focus.signs
                : [chart.placements.find((p) => p.body === sight)?.sign]
            : [],
    );

    return (
        <div className="relative h-full w-full [container-type:size]">
            <motion.div
                className="absolute top-1/2 left-1/2 size-[min(100cqw,100cqh)] -translate-x-1/2 -translate-y-1/2"
                style={{ opacity: mapOpacity }}
            >
                <motion.svg
                    viewBox={viewBox}
                    aria-hidden="true"
                    className="absolute inset-0 size-full overflow-visible"
                >
                    <defs>
                        <radialGradient id={glowId}>
                            <stop
                                offset="0%"
                                stopColor="oklch(0.85 0.15 75 / 55%)"
                            />
                            <stop
                                offset="100%"
                                stopColor="oklch(0.85 0.15 75 / 0%)"
                            />
                        </radialGradient>
                    </defs>

                    {/* The zodiac band, cut where the Earth sees each sign begin. */}
                    <motion.g
                        initial={{ opacity: reducedMotion ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2 }}
                    >
                        {view.signs.map((sign, i) =>
                            lit.has(sign.name) ? (
                                <path
                                    key={`lit-${sign.name}`}
                                    d={sectorPath(
                                        sign,
                                        view.signs[(i + 1) % 12],
                                    )}
                                    fill="oklch(0.84 0.12 85 / 22%)"
                                    stroke="var(--astral-gold)"
                                    strokeWidth={1}
                                    vectorEffect="non-scaling-stroke"
                                />
                            ) : null,
                        )}
                        {[BAND.inner, BAND.outer].map((r) => (
                            <circle
                                key={r}
                                r={r}
                                fill="none"
                                stroke="var(--astral-ink)"
                                strokeWidth={1}
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}
                        {view.signs.map((sign) => (
                            <line
                                key={sign.name}
                                x1={sign.inner.x}
                                y1={sign.inner.y}
                                x2={sign.outer.x}
                                y2={sign.outer.y}
                                stroke="var(--astral-ink)"
                                strokeWidth={1}
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}
                        {view.signs.map((sign) => (
                            <text
                                key={sign.name}
                                x={sign.middle.x}
                                y={sign.middle.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize={0.06}
                                fill={
                                    lit.has(sign.name)
                                        ? "var(--astral-gold)"
                                        : "var(--muted-foreground)"
                                }
                            >
                                {sign.glyph}
                            </text>
                        ))}
                    </motion.g>

                    {/* Orbits through where each planet was. */}
                    {(["Venus", "Tierra", "Marte"] as const).map((body, i) => (
                        <motion.circle
                            key={body}
                            r={view.orbits[body]}
                            fill="none"
                            stroke="oklch(0.9 0.03 290 / 16%)"
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                            initial={{ opacity: reducedMotion ? 1 : 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.15 }}
                        />
                    ))}

                    {/* The line of sight: from the Earth, through the body, to its sign. */}
                    {line && (
                        <motion.line
                            key={sight}
                            x1={line.from.x}
                            y1={line.from.y}
                            stroke="var(--astral-gold)"
                            strokeWidth={1.25}
                            strokeOpacity={0.85}
                            vectorEffect="non-scaling-stroke"
                            initial={{ x2: line.from.x, y2: line.from.y }}
                            animate={{ x2: line.to.x, y2: line.to.y }}
                            transition={{ duration: 0.9, ease: "easeInOut" }}
                        />
                    )}

                    <circle r={LOOK.Sol.r * 3.2} fill={`url(#${glowId})`} />
                    {(Object.keys(LOOK) as SystemBody[]).map((body) => {
                        const at = view.bodies[body];
                        const half = LOOK[body].r / SPRITE_SPHERE;
                        return (
                            <image
                                key={`sprite-${body}`}
                                href={`/planets/sprites/${LOOK[body].sprite}.webp`}
                                x={at.x - half}
                                y={at.y - half}
                                width={half * 2}
                                height={half * 2}
                                transform={
                                    body === "Sol"
                                        ? undefined
                                        : `rotate(${towardTheSun(at)} ${at.x} ${at.y})`
                                }
                            />
                        );
                    })}
                </motion.svg>

                <motion.div
                    aria-hidden
                    className="absolute inset-0"
                    style={{ opacity: labelsOpacity }}
                >
                    {/* The Moon hugs the Earth: named only when it's the destination. */}
                    {(
                        [
                            "Sol",
                            "Venus",
                            "Tierra",
                            "Marte",
                            ...(aim === "Luna" ? (["Luna"] as const) : []),
                        ] as const
                    ).map((body) => (
                        <Label
                            key={body}
                            {...nameAt(body, view.bodies[body])}
                            className={
                                body === aim || (body === "Tierra" && sight)
                                    ? "text-astral-gold"
                                    : "text-muted-foreground"
                            }
                        >
                            {body}
                        </Label>
                    ))}
                    <AnimatePresence>
                        {line && sight && (
                            <motion.span
                                key={sight}
                                className="absolute inset-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.7, duration: 0.5 }}
                            >
                                <Label
                                    at={line.label}
                                    className="text-astral-gold"
                                >
                                    {[...lit].join(" o ")}
                                </Label>
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {arrived && (
                    <motion.div
                        key={arrived.body}
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {"phase" in arrived ? (
                            <MoonPhaseScene phase={arrived.phase} born={born} />
                        ) : (
                            <PlanetScene
                                body={arrived.body}
                                sign={arrived.sign}
                                signs={arrived.signs}
                                moonPhase={chart.moonPhase}
                                born={born}
                                fromZoom
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.p
                aria-hidden
                className="absolute inset-x-0 bottom-6 text-center font-mono text-[11px] text-muted-foreground uppercase tracking-[0.22em] max-lg:hidden"
                style={{ opacity: labelsOpacity }}
            >
                {sight
                    ? `Desde la Tierra · ${sight} en ${[...lit].join(" o ")}`
                    : `${born} · alrededor del Sol`}
            </motion.p>
        </div>
    );
}
