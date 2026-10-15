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
    type Point,
    type SystemBody,
    solarSystemView,
} from "@/core/reading/domain/solar-system";
import type { StoryBody } from "@/core/reading/domain/story";
import type { NatalChart } from "@/core/reading/domain/types";
import { sphereShare } from "../globe";
import { MoonPhaseScene } from "./moon-phase-scene";
import { PlanetScene } from "./planet-scene";
import {
    Band,
    cameraAt,
    FRAME,
    FRONT,
    facingTheSun,
    HALF,
    Label,
    LOOK,
    NightShade,
    type Side,
    Sprite,
    SunGlow,
} from "./system-parts";

/**
 * The body the camera flies to and what it shows there: the sign it was in
 * (with the line of sight that puts it there), or the Moon's phase.
 */
export type SystemFocus =
    | { body: StoryBody; sign: string; signs?: readonly [string, string] }
    | { body: "Luna"; phase: MoonPhaseName };

/** Where the Sun is, for the globe's shader (x right, y up, z toward us). */
function sunLight(p: Point): readonly [number, number, number] {
    const length = Math.hypot(p.x, p.y) || 1;
    return [-p.x / length, p.y / length, FRONT];
}

/** Bodies with a night side drawn over them (the Sun has none). */
const NIGHT_BODIES = ["Venus", "Tierra", "Marte", "Luna"] as const;

/**
 * How close the camera gets: the dot grows to the globe that replaces it,
 * this many times the dot's size on the full stage.
 */
const ZOOM: Record<StoryBody, number> = {
    Sol: 7,
    Venus: 17,
    Marte: 20,
    Luna: 34,
};

/** The camera's zoom: a framed system needs a little more to fill it. */
function zoomOf(body: StoryBody): number {
    return ZOOM[body] / FRAME;
}

/**
 * The globe's canvas, sized in the scene's own units so its sphere is
 * exactly its dot at the end of the zoom, on any screen.
 */
function globeSize(body: StoryBody): string {
    const sphere = (2 * LOOK[body].r * ZOOM[body] * 50) / HALF;
    return `${sphere / sphereShare(body)}cqmin`;
}

const IN = { duration: 1.5, ease: [0.45, 0, 0.15, 1] } as const;
/** While the camera's last stretch shows it, the globe covers its dot. */
const HANDOFF = [0.72, 0.9];
const OUT = { duration: 1, ease: [0.4, 0, 0.2, 1] } as const;

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
        cameraAt(t, view.bodies[target.current], zoomOf(target.current)),
    );
    // The drawing gives way to the globe once the globe covers its dot.
    const mapOpacity = useTransform(progress, [0, HANDOFF[1], 1], [1, 1, 0]);
    const labelsOpacity = useTransform(progress, [0, 0.12], [1, 0]);
    // The globe rides the camera: where its dot is on screen, as big as it.
    const ride = {
        x: useTransform(
            progress,
            (t) =>
                `${((1 - t) * view.bodies[target.current].x * 50 * FRAME) / HALF}cqmin`,
        ),
        y: useTransform(
            progress,
            (t) =>
                `${((1 - t) * view.bodies[target.current].y * 50 * FRAME) / HALF}cqmin`,
        ),
        scale: useTransform(progress, (t) => zoomOf(target.current) ** (t - 1)),
        opacity: useTransform(progress, HANDOFF, [0, 1]),
        // Not painted at all until its turn: cheap while it waits.
        visibility: useTransform(progress, (t) =>
            t < HANDOFF[0] ? "hidden" : "visible",
        ),
    };

    /** The body the camera is going to (its name lights up). */
    const [aim, setAim] = useState<StoryBody | null>(null);
    /** The line of sight on screen, from the Earth through this body. */
    const [sight, setSight] = useState<StoryBody | null>(null);
    /** What's waiting at the destination, mounted ahead (see `fly`). */
    const [arrived, setArrived] = useState<{
        focus: SystemFocus;
        /** Came without a flight: the camera was already there. */
        inPlace?: boolean;
    } | null>(null);
    /** The camera is there: the constellation may draw itself. */
    const [landed, setLanded] = useState(false);
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
            // A phase is not a sign: no line of sight, just the flight.
            const line = focus && !phase ? focus.body : null;
            if (reducedMotion) {
                if (focus) target.current = focus.body;
                progress.set(focus ? 1 : 0);
                setAim(focus?.body ?? null);
                setSight(line);
                setArrived(focus && { focus });
                setLanded(Boolean(focus));
                return;
            }
            // Already there, or on the way: the camera stays and only what
            // it shows there changes (the Moon's phase, then its sign).
            if (focus && progress.get() > 0 && target.current === focus.body) {
                setSight(null);
                setAim(null);
                const left = 1 - progress.get();
                if (left > 0)
                    await animate(progress, 1, {
                        duration: IN.duration * left,
                        ease: "easeOut",
                    });
                if (!live) return;
                setArrived({ focus, inPlace: true });
                setLanded(true);
                return;
            }
            setLanded(false);
            // Whatever it pointed at goes, even if the camera never left:
            // scrolling on before it flies must not leave that line behind.
            setSight(null);
            setAim(null);
            if (progress.get() > 0) {
                // The globe shrinks back into its dot as the camera pulls out.
                await animate(progress, 0, OUT);
            }
            if (!live) return;
            setArrived(null);
            if (!focus) return;
            target.current = focus.body;
            // Coming from another scene, let the whole system be seen first.
            const pause = first ? 700 : 150;
            const look = line ? 1100 : 700;
            // The globe mounts now, unseen and still: loaded by the time the
            // camera gets there. A phase is another picture: it just fades
            // in at the end.
            if (!phase) setArrived({ focus });
            await wait(pause);
            if (!live) return;
            setAim(focus.body);
            setSight(line);
            await wait(look);
            if (!live) return;
            const flight = animate(progress, 1, IN);
            if (phase) {
                await wait(IN.duration * 620);
                if (!live) return;
                setArrived({ focus });
            }
            await flight;
            if (live) setLanded(true);
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
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                    width: `${FRAME * 100}cqmin`,
                    height: `${FRAME * 100}cqmin`,
                    opacity: mapOpacity,
                }}
            >
                <motion.svg
                    viewBox={viewBox}
                    aria-hidden="true"
                    className="absolute inset-0 size-full overflow-visible"
                >
                    <defs>
                        {NIGHT_BODIES.map((body) => (
                            <NightShade
                                key={body}
                                id={`${glowId}-${body}`}
                                turn={facingTheSun(view.bodies[body])}
                            />
                        ))}
                    </defs>

                    {/* The zodiac band, cut where the Earth sees each sign begin. */}
                    <motion.g
                        initial={{ opacity: reducedMotion ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2 }}
                    >
                        <Band signs={view.signs} lit={lit} />
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

                    <SunGlow id={glowId} />
                    {(Object.keys(LOOK) as SystemBody[]).map((body) => (
                        <Sprite
                            key={`sprite-${body}`}
                            body={body}
                            at={view.bodies[body]}
                            // Its night side, away from the Sun.
                            shade={
                                body === "Sol" ? undefined : `${glowId}-${body}`
                            }
                        />
                    ))}
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
                                animate={{
                                    opacity: 1,
                                    // Once the line has reached the sign.
                                    transition: { delay: 0.7, duration: 0.5 },
                                }}
                                // Gone at once: it must not outlive its line.
                                exit={{
                                    opacity: 0,
                                    transition: { duration: 0.2 },
                                }}
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
                {arrived && "phase" in arrived.focus && (
                    <motion.div
                        key="phase"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <MoonPhaseScene
                            phase={arrived.focus.phase}
                            born={born}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {arrived && "sign" in arrived.focus && (
                    <motion.div
                        key={arrived.focus.body}
                        className="absolute inset-0"
                        // Without a flight it fades in where the last picture
                        // was, and out the same way.
                        initial={arrived.inPlace ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.div className="absolute inset-0" style={ride}>
                            <PlanetScene
                                body={arrived.focus.body}
                                sign={arrived.focus.sign}
                                signs={arrived.focus.signs}
                                moonPhase={chart.moonPhase}
                                born={born}
                                ride={{
                                    size: globeSize(arrived.focus.body),
                                    light:
                                        arrived.focus.body === "Sol"
                                            ? undefined
                                            : sunLight(
                                                  view.bodies[
                                                      arrived.focus.body
                                                  ],
                                              ),
                                    // Still until the camera lands: it would barely turn
                                    // meanwhile, and the flight stays light.
                                    paused: !landed,
                                }}
                                landed={landed}
                            />
                        </motion.div>
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
