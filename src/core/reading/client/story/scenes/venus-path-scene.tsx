"use client";

import {
    animate,
    type MotionValue,
    motion,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useTransform,
} from "motion/react";
import { useEffect, useId, useMemo, useState } from "react";
import { ZODIAC_SIGNS } from "@/core/landing/domain/zodiac";
import {
    type Point,
    type VenusRoute,
    venusRoute,
} from "@/core/reading/domain/solar-system";
import type { SkyEvent } from "@/core/reading/domain/types";
import { cn } from "@/frontend/lib/utils";
import {
    Band,
    cameraAt,
    FRAME,
    facingTheSun,
    HALF,
    NightShade,
    Sprite,
    SunGlow,
} from "./system-parts";

/** What happens, in words anyone gets (the paragraph tells the rest). */
const VERB: Record<SkyEvent["kind"], string> = {
    entra: "entra en",
    retrograda: "parece retroceder en",
    directa: "vuelve a avanzar en",
};

const MINE: Record<SkyEvent["mine"][number], string> = {
    Sol: "tu Sol",
    Venus: "tu Venus",
    Luna: "tu Luna",
};

/** Once in, the camera holds the Earth's orbit and this much air around it. */
const ROOM = 1.3;
/** Seconds Venus takes per day of its route; a leg takes at least `LEG`. */
const PER_DAY = 0.045;
const LEG = 0.9;
const CLOSE_IN = { duration: 1.6, ease: [0.45, 0, 0.15, 1] } as const;
/** How far past Venus its line of sight runs, to the sign it's seen in. */
const SIGHT = 0.12;

const glyphOf = (sign: string) =>
    ZODIAC_SIGNS.find((s) => s.name === sign)?.glyph ?? "";

/** Where a route is on a (fractional) day. */
function along(points: readonly Point[], day: number): Point {
    const i = Math.min(Math.max(Math.floor(day), 0), points.length - 2);
    const f = Math.min(Math.max(day - i, 0), 1);
    const a = points[i];
    const b = points[i + 1];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

/** Which way Venus is seen from the Earth (a unit vector). */
function sightWay(route: VenusRoute, day: number): Point {
    const venus = along(route.venus, day);
    const earth = along(route.earth, day);
    const length = Math.hypot(venus.x - earth.x, venus.y - earth.y) || 1;
    return { x: (venus.x - earth.x) / length, y: (venus.y - earth.y) / length };
}

/** From the Earth through Venus, a little past it: toward its sign. */
function sightEnd(route: VenusRoute, day: number, past = SIGHT): Point {
    const venus = along(route.venus, day);
    const way = sightWay(route, day);
    return { x: venus.x + way.x * past, y: venus.y + way.y * past };
}

/** Away from the Sun: where the Earth's name goes, clear of its orbit. */
function outward(p: Point, by: number): Point {
    const length = Math.hypot(p.x, p.y) || 1;
    return { x: p.x + (p.x / length) * by, y: p.y + (p.y / length) * by };
}

/**
 * How a label hangs from its point so it runs on in direction `way`
 * (never back over what it names): to the side, or above or below.
 */
function hangToward(way: Point): string {
    if (way.x > 0.35) return "-translate-y-1/2";
    if (way.x < -0.35) return "-translate-x-full -translate-y-1/2";
    return way.y > 0
        ? "-translate-x-1/2"
        : "-translate-x-1/2 -translate-y-full";
}

/**
 * A moving point on screen, as a share of the drawing, once the camera is
 * in (`half` of the view around the Sun).
 */
function useOnScreen(
    p: { x: MotionValue<number>; y: MotionValue<number> },
    half: number,
) {
    return {
        left: useTransform(p.x, (x) => `${((x + half) / (2 * half)) * 100}%`),
        top: useTransform(p.y, (y) => `${((y + half) / (2 * half)) * 100}%`),
    };
}

/**
 * The months after the reading in the solar system itself: the camera
 * closes in on the Sun until the orbits of Venus and the Earth fill the
 * view, what doesn't matter here fades, and Venus travels its real route
 * to each moment the text talks about, with the Earth on its own. A line
 * from the Earth through Venus shows the sign it's seen in, which is what
 * "Venus enters Libra" means.
 */
export function VenusPathScene({
    events,
    focus,
}: {
    events: readonly SkyEvent[];
    /** The moment being read: Venus travels there. None: the whole route. */
    focus?: number;
}) {
    const route = useMemo(() => venusRoute(events), [events]);
    return route ? <Route route={route} events={events} focus={focus} /> : null;
}

function Route({
    route,
    events,
    focus,
}: {
    route: VenusRoute;
    events: readonly SkyEvent[];
    focus?: number;
}) {
    const reducedMotion = useReducedMotion();
    const id = useId().replace(/:/g, "");
    const half = route.today.orbits.Tierra * ROOM;
    const target =
        focus === undefined
            ? (route.stops.at(-1) ?? 0)
            : (route.stops[focus] ?? 0);

    // 0: the whole system that day; 1: close enough to follow Venus.
    const camera = useMotionValue(reducedMotion ? 1 : 0);
    // Days after the reading's: where Venus and the Earth are.
    const day = useMotionValue(reducedMotion ? target : 0);
    const viewBox = useTransform(camera, (t) =>
        cameraAt(t, { x: 0, y: 0 }, HALF / half),
    );
    // What doesn't matter here fades as the camera closes in; the route
    // and what's on it show once it's there.
    const away = useTransform(camera, [0, 0.6], [1, 0]);
    const near = useTransform(camera, [0.75, 1], [0, 1]);

    useEffect(() => {
        if (reducedMotion) {
            camera.set(1);
            day.set(target);
            return;
        }
        let live = true;
        (async () => {
            if (camera.get() < 1)
                await animate(camera, 1, {
                    ...CLOSE_IN,
                    // Coming in: the whole system first, for a moment.
                    delay: camera.get() === 0 ? 0.6 : 0,
                });
            if (!live) return;
            const from = day.get();
            await animate(day, target, {
                duration: Math.max(LEG, Math.abs(target - from) * PER_DAY),
                ease: "easeInOut",
            });
        })();
        return () => {
            live = false;
            camera.stop();
            day.stop();
        };
    }, [target, reducedMotion, camera, day]);

    const venus = {
        x: useTransform(day, (d) => along(route.venus, d).x),
        y: useTransform(day, (d) => along(route.venus, d).y),
    };
    const earth = {
        x: useTransform(day, (d) => along(route.earth, d).x),
        y: useTransform(day, (d) => along(route.earth, d).y),
    };
    const sightTo = {
        x: useTransform(day, (d) => sightEnd(route, d).x),
        y: useTransform(day, (d) => sightEnd(route, d).y),
    };
    // Their names just past those points, running on the same way.
    const signLabel = {
        x: useTransform(day, (d) => sightEnd(route, d, SIGHT + 0.015).x),
        y: useTransform(day, (d) => sightEnd(route, d, SIGHT + 0.015).y),
    };
    const earthLabel = {
        x: useTransform(day, (d) => outward(along(route.earth, d), 0.045).x),
        y: useTransform(day, (d) => outward(along(route.earth, d), 0.045).y),
    };
    const venusShade = useTransform(day, (d) =>
        facingTheSun(along(route.venus, d)),
    );
    const earthShade = useTransform(day, (d) =>
        facingTheSun(along(route.earth, d)),
    );
    // The route behind Venus, lit as it goes.
    const travelled = useTransform(day, (d) =>
        [...route.venus.slice(0, Math.floor(d) + 1), along(route.venus, d)]
            .map((p) => `${p.x},${p.y}`)
            .join(" "),
    );

    // The sign at the end of its line, the moments already reached, and
    // which way the labels hang.
    const [sign, setSign] = useState(route.sign[0]);
    const [reached, setReached] = useState(0);
    const [signHang, setSignHang] = useState(() =>
        hangToward(sightWay(route, 0)),
    );
    const [earthHang, setEarthHang] = useState(() =>
        hangToward(outward(route.earth[0], 0)),
    );
    useMotionValueEvent(day, "change", (d) => {
        setSign(route.sign[Math.round(d)] ?? route.sign[0]);
        setReached(route.stops.filter((stop) => stop <= d + 0.01).length);
        setSignHang(hangToward(sightWay(route, d)));
        setEarthHang(hangToward(outward(along(route.earth, d), 0)));
    });

    /** On screen, as a share of the drawing, once the camera is in. */
    const onScreen = (p: Point) => ({
        left: `${((p.x + half) / (2 * half)) * 100}%`,
        top: `${((p.y + half) / (2 * half)) * 100}%`,
    });
    const earthAt = useOnScreen(earthLabel, half);
    const signAt = useOnScreen(signLabel, half);
    const current = focus === undefined ? undefined : events[focus];

    return (
        <div className="relative h-full w-full [container-type:size]">
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                    width: `${FRAME * 100}cqmin`,
                    height: `${FRAME * 100}cqmin`,
                }}
            >
                <motion.svg
                    viewBox={viewBox}
                    aria-hidden="true"
                    className="absolute inset-0 size-full overflow-visible"
                >
                    <defs>
                        <NightShade id={`${id}-venus`} turn={venusShade} />
                        <NightShade id={`${id}-earth`} turn={earthShade} />
                        <NightShade
                            id={`${id}-mars`}
                            turn={facingTheSun(route.today.mars)}
                        />
                    </defs>

                    <motion.g style={{ opacity: away }}>
                        <Band signs={route.today.signs} lit={new Set()} />
                        <circle
                            r={route.today.orbits.Marte}
                            fill="none"
                            stroke="oklch(0.9 0.03 290 / 16%)"
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                        />
                        <Sprite
                            body="Marte"
                            at={route.today.mars}
                            shade={`${id}-mars`}
                        />
                    </motion.g>

                    {(["Venus", "Tierra"] as const).map((body) => (
                        <circle
                            key={body}
                            r={route.today.orbits[body]}
                            fill="none"
                            stroke="oklch(0.9 0.03 290 / 16%)"
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}

                    <motion.g style={{ opacity: near }}>
                        {/* Where Venus goes over these months, and how far it got. */}
                        <polyline
                            points={route.venus
                                .map((p) => `${p.x},${p.y}`)
                                .join(" ")}
                            fill="none"
                            stroke="oklch(0.84 0.12 85 / 35%)"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                        <motion.polyline
                            points={travelled}
                            fill="none"
                            stroke="var(--astral-gold)"
                            strokeOpacity={0.85}
                            strokeWidth={2}
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* From the Earth, through Venus, to its sign. */}
                        <motion.line
                            x1={earth.x}
                            y1={earth.y}
                            x2={sightTo.x}
                            y2={sightTo.y}
                            stroke="var(--astral-gold)"
                            strokeOpacity={0.55}
                            strokeWidth={1}
                            strokeDasharray="3 4"
                            vectorEffect="non-scaling-stroke"
                        />
                    </motion.g>

                    {/* A smaller halo: up close it would bury what's near it. */}
                    <SunGlow id={`${id}-glow`} reach={2.2} />
                    <Sprite body="Sol" at={{ x: 0, y: 0 }} />
                    <motion.g style={{ x: earth.x, y: earth.y }}>
                        <Sprite
                            body="Tierra"
                            at={{ x: 0, y: 0 }}
                            shade={`${id}-earth`}
                        />
                    </motion.g>
                    <motion.g style={{ x: venus.x, y: venus.y }}>
                        <Sprite
                            body="Venus"
                            at={{ x: 0, y: 0 }}
                            shade={`${id}-venus`}
                        />
                    </motion.g>
                </motion.svg>

                <motion.div
                    aria-hidden
                    className="absolute inset-0"
                    style={{ opacity: near }}
                >
                    {/* Today, and each moment on Venus's route. */}
                    <Dot at={onScreen(route.venus[0])} />
                    <span
                        className="absolute -translate-x-1/2 translate-y-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em]"
                        style={onScreen(route.venus[0])}
                    >
                        Hoy
                    </span>
                    {route.stops.map((stop, i) => (
                        <Dot
                            key={`${stop}-${events[i].kind}`}
                            at={onScreen(route.venus[stop])}
                            lit={i < reached}
                            own={events[i].mine.length > 0}
                            current={i === focus && i < reached}
                        />
                    ))}
                    {/* Venus needs no name: it's the one leaving the trail. */}
                    <motion.span
                        className={cn(
                            "absolute whitespace-nowrap font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em]",
                            earthHang,
                        )}
                        style={earthAt}
                    >
                        Tierra
                    </motion.span>
                    <motion.span
                        className={cn(
                            "absolute whitespace-nowrap font-mono text-[11px] text-astral-gold uppercase tracking-[0.16em]",
                            // Legible even over the Sun: Venus passing in
                            // front of it points its line right there.
                            "[text-shadow:0_0_6px_var(--background),0_0_12px_var(--background)]",
                            signHang,
                        )}
                        style={signAt}
                    >
                        {glyphOf(sign)} {sign}
                    </motion.span>
                </motion.div>
            </div>

            <p
                aria-hidden
                className="absolute inset-x-0 bottom-6 text-center font-mono text-[11px] text-muted-foreground uppercase tracking-[0.22em] max-lg:hidden"
            >
                {current ? (
                    <>
                        {current.when} · Venus {VERB[current.kind]}{" "}
                        <span
                            className={cn(
                                current.mine.length > 0 && "text-astral-gold",
                            )}
                        >
                            {glyphOf(current.sign)} {current.sign}
                            {current.mine.length > 0 &&
                                ` · ${current.mine.map((b) => MINE[b]).join(" y ")}`}
                        </span>
                    </>
                ) : (
                    "Venus · los próximos meses"
                )}
            </p>
        </div>
    );
}

/** A moment on the route: gold once Venus got there, pulsing while read. */
function Dot({
    at,
    lit = false,
    own = false,
    current = false,
}: {
    at: { left: string; top: string };
    lit?: boolean;
    own?: boolean;
    current?: boolean;
}) {
    return (
        <span className="absolute -translate-x-1/2 -translate-y-1/2" style={at}>
            <span
                className={cn(
                    "block rounded-full transition-colors duration-500",
                    current ? "size-2.5" : "size-2",
                    lit
                        ? own
                            ? "bg-astral-gold"
                            : "bg-astral-gold-soft"
                        : "bg-astral-ink",
                )}
            />
            {current && (
                <span className="absolute inset-0 animate-ping rounded-full bg-astral-gold/60" />
            )}
        </span>
    );
}
