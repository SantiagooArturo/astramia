"use client";

import { type MotionValue, motion } from "motion/react";
import {
    BAND,
    type BandSign,
    type Point,
    type SystemBody,
} from "@/core/reading/domain/solar-system";

/**
 * What the solar system's scenes share: how a body looks from afar, its
 * night side, the zodiac band, the camera and the labels over it all.
 */

/** Half the view: the band's outer edge plus a little air. */
export const HALF = 1.04;

/**
 * The system's share of the stage's short side: air between the band and
 * the screen's edges (and, on a phone, the text under it).
 */
export const FRAME = 0.84;

/**
 * Each body from afar: its radius, and a small rendered sphere of it
 * (scripts/planet-sprites.py): unlit, north up, as the 3D globe starts.
 */
export const LOOK: Record<SystemBody, { r: number; sprite: string }> = {
    Sol: { r: 0.055, sprite: "sol" },
    Venus: { r: 0.02, sprite: "venus" },
    Tierra: { r: 0.022, sprite: "tierra" },
    Marte: { r: 0.017, sprite: "marte" },
    Luna: { r: 0.009, sprite: "luna" },
};
/** The sphere's share of its sprite: the rest is atmosphere or flames. */
export const SPRITE_SPHERE = 0.86;

/** The angle (SVG degrees, clockwise) from a body toward the Sun. */
export function towardTheSun(p: Point): number {
    return (Math.atan2(-p.y, -p.x) * 180) / Math.PI;
}

/** A night side's gradient turned so its lit edge faces the Sun. */
export function facingTheSun(p: Point): string {
    return `rotate(${towardTheSun(p)} 0.5 0.5)`;
}

/** The light comes from the Sun's side and a little toward us. */
export const FRONT = 0.42;

const smoothstep = (a: number, b: number, x: number) => {
    const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
    return t * t * (3 - 2 * t);
};

/**
 * The night side laid over a sprite, from its dark edge (0) to the edge
 * facing the Sun (1): the globe's own shading along that line, so the dot
 * and the globe that takes over are lit alike.
 */
const NIGHT = Array.from({ length: 25 }, (_, i) => {
    const offset = i / 24;
    const u = (offset - 0.5) / (SPRITE_SPHERE / 2);
    if (u <= -1) return { offset, opacity: 0.95 };
    if (u >= 1) return { offset, opacity: 0 };
    const z = Math.sqrt(1 - u * u);
    const d = (u + FRONT * z) / Math.hypot(1, FRONT);
    const lit = smoothstep(-0.06, 0.22, d) * (0.3 + 0.7 * Math.max(d, 0));
    const shade = 0.05 + 0.95 * lit;
    // The sprites' own limb darkening, already in the picture.
    const drawn = 0.75 + 0.25 * Math.sqrt(z);
    return { offset, opacity: Math.min(Math.max(1 - shade / drawn, 0), 0.95) };
});

/** A body's night side, for its sprite: `turn` faces it to the Sun. */
export function NightShade({
    id,
    turn,
}: {
    id: string;
    turn: string | MotionValue<string>;
}) {
    return (
        <motion.linearGradient id={id} gradientTransform={turn}>
            {NIGHT.map(({ offset, opacity }) => (
                <stop
                    key={offset}
                    offset={offset}
                    stopColor="#03030a"
                    stopOpacity={opacity}
                />
            ))}
        </motion.linearGradient>
    );
}

/** A body from afar at `at`: its sprite and, but for the Sun, its night side. */
export function Sprite({
    body,
    at,
    shade,
}: {
    body: SystemBody;
    at: Point;
    /** Its `NightShade`'s id. */
    shade?: string;
}) {
    const half = LOOK[body].r / SPRITE_SPHERE;
    return (
        <>
            <image
                href={`/planets/sprites/${LOOK[body].sprite}.webp`}
                x={at.x - half}
                y={at.y - half}
                width={half * 2}
                height={half * 2}
            />
            {shade && (
                <circle cx={at.x} cy={at.y} r={half} fill={`url(#${shade})`} />
            )}
        </>
    );
}

/** The Sun's warm halo, `reach` times its radius. */
export function SunGlow({ id, reach = 3.2 }: { id: string; reach?: number }) {
    return (
        <>
            <defs>
                <radialGradient id={id}>
                    <stop offset="0%" stopColor="oklch(0.85 0.15 75 / 55%)" />
                    <stop offset="100%" stopColor="oklch(0.85 0.15 75 / 0%)" />
                </radialGradient>
            </defs>
            <circle r={LOOK.Sol.r * reach} fill={`url(#${id})`} />
        </>
    );
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

/** The zodiac band, cut where the Earth sees each sign begin; `lit` glow. */
export function Band({
    signs,
    lit,
}: {
    signs: readonly BandSign[];
    lit: ReadonlySet<string | undefined>;
}) {
    return (
        <>
            {signs.map((sign, i) =>
                lit.has(sign.name) ? (
                    <path
                        key={`lit-${sign.name}`}
                        d={sectorPath(sign, signs[(i + 1) % 12])}
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
            {signs.map((sign) => (
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
            {signs.map((sign) => (
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
        </>
    );
}

/**
 * The camera between the whole system (t = 0) and `to` (t = 1), `zoom`
 * times closer. The scale grows geometrically, which reads as an even
 * zoom, and `to` slides steadily to the middle instead of swinging out.
 */
export function cameraAt(t: number, to: Point, zoom: number) {
    const scale = zoom ** t;
    const half = HALF / scale;
    const x = to.x - ((1 - t) * to.x) / scale;
    const y = to.y - ((1 - t) * to.y) / scale;
    return `${x - half} ${y - half} ${2 * half} ${2 * half}`;
}

/** Which way a label runs from its point. */
export type Side = "center" | "left" | "right";

const SIDE: Record<Side, string> = {
    center: "-translate-x-1/2",
    // Ends at the point: the text sits to its left.
    left: "-translate-x-full",
    right: "",
};

/**
 * A label over the drawing, in page type (it doesn't grow with the zoom),
 * at `at` in the whole system's view, or where the camera put it.
 */
export function Label({
    at,
    side = "center",
    children,
    className,
}: {
    at: Point | { left: string; top: string };
    side?: Side;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={`absolute -translate-y-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] lg:text-[11px] ${SIDE[side]} ${className ?? ""}`}
            style={
                "left" in at
                    ? at
                    : {
                          left: `${((at.x + HALF) / (2 * HALF)) * 100}%`,
                          top: `${((at.y + HALF) / (2 * HALF)) * 100}%`,
                      }
            }
        >
            {children}
        </span>
    );
}
