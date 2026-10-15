import { ZODIAC_SIGNS } from "@/core/landing/domain/zodiac";
import type { StoryBody } from "./story";
import type { NatalChart } from "./types";

/**
 * The solar system on the day they were born, laid out to be drawn. Nothing
 * is placed by hand: the orbits come from the ephemeris, and each sign sits
 * on the band where it is *seen from the Earth*, so a line of sight from the
 * Earth through a planet lands on that planet's sign.
 *
 * View units: the Sun at 0,0, y growing downward (SVG), the band at ~0.9.
 */

export interface Point {
    x: number;
    y: number;
}

export type SystemBody = StoryBody | "Tierra";

/** The Earth's orbit in view units: Mars (~1.5 AU) stays inside the band. */
const AU = 0.34;
/** The zodiac band around everything. */
export const BAND = { inner: 0.82, outer: 0.98 } as const;
/** The Moon beside the Earth, apart enough to be seen (not to scale). */
const MOON_GAP = 0.065;

const DEG = Math.PI / 180;

/** The direction of an ecliptic longitude on screen, counterclockwise. */
export function towards(longitude: number): Point {
    return { x: Math.cos(longitude * DEG), y: -Math.sin(longitude * DEG) };
}

/** Where a line from `from` (inside the circle) toward `longitude` meets it. */
export function sightOn(from: Point, longitude: number, radius: number): Point {
    const u = towards(longitude);
    const b = from.x * u.x + from.y * u.y;
    const c = from.x ** 2 + from.y ** 2 - radius ** 2;
    const t = -b + Math.sqrt(b * b - c);
    return { x: from.x + t * u.x, y: from.y + t * u.y };
}

/**
 * Server and browser round sin/cos differently in the last digits; drawn
 * coordinates are cut well before that, so the page hydrates identically.
 */
function fixed(p: Point): Point {
    return { x: Math.round(p.x * 1e5) / 1e5, y: Math.round(p.y * 1e5) / 1e5 };
}

/** An ecliptic position (AU, y north) in view units. */
function inView(p: Point): Point {
    return fixed({ x: p.x * AU, y: -p.y * AU });
}

export interface BandSign {
    name: string;
    glyph: string;
    /** Where the sign starts on the band's two edges. */
    inner: Point;
    outer: Point;
    /** The middle of the sign, halfway across the band. */
    middle: Point;
}

export interface SolarSystemView {
    bodies: Record<SystemBody, Point>;
    /** Each orbit as a circle through its planet (radius). */
    orbits: Record<"Venus" | "Tierra" | "Marte", number>;
    /** The twelve signs, from Aries, as seen from the Earth. */
    signs: BandSign[];
    /** From the Earth through a body to the band, and where its sign's name goes. */
    sight(body: StoryBody): { from: Point; to: Point; label: Point };
}

export function solarSystemView(chart: NatalChart): SolarSystemView {
    const longitude = (body: StoryBody) =>
        chart.placements.find((p) => p.body === body)?.longitude ?? 0;
    const earth = inView(chart.orbits.Tierra);
    const moonAt = towards(longitude("Luna"));
    const bodies: Record<SystemBody, Point> = {
        Sol: { x: 0, y: 0 },
        Venus: inView(chart.orbits.Venus),
        Tierra: earth,
        Marte: inView(chart.orbits.Marte),
        Luna: fixed({
            x: earth.x + MOON_GAP * moonAt.x,
            y: earth.y + MOON_GAP * moonAt.y,
        }),
    };
    const radius = (p: Point) => Math.hypot(p.x, p.y);
    const middle = (BAND.inner + BAND.outer) / 2;

    return {
        bodies,
        orbits: {
            Venus: fixed({ x: radius(bodies.Venus), y: 0 }).x,
            Tierra: fixed({ x: radius(earth), y: 0 }).x,
            Marte: fixed({ x: radius(bodies.Marte), y: 0 }).x,
        },
        signs: ZODIAC_SIGNS.map((sign, i) => ({
            name: sign.name,
            glyph: sign.glyph,
            inner: fixed(sightOn(earth, i * 30, BAND.inner)),
            outer: fixed(sightOn(earth, i * 30, BAND.outer)),
            middle: fixed(sightOn(earth, i * 30 + 15, middle)),
        })),
        sight: (body) => ({
            from: earth,
            to: fixed(sightOn(earth, longitude(body), BAND.inner)),
            label: fixed(sightOn(earth, longitude(body), BAND.inner - 0.09)),
        }),
    };
}
