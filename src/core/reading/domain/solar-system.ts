import {
    julianDay,
    orbitPositions,
    venusLongitude,
} from "@/core/landing/domain/ephemeris";
import { longitudeToSign, ZODIAC_SIGNS } from "@/core/landing/domain/zodiac";
import type { StoryBody } from "./story";
import type { NatalChart, SkyEvent } from "./types";

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

const MIDDLE = (BAND.inner + BAND.outer) / 2;

/** The twelve signs on the band, as seen from the Earth at `earth`. */
function bandSigns(earth: Point): BandSign[] {
    return ZODIAC_SIGNS.map((sign, i) => ({
        name: sign.name,
        glyph: sign.glyph,
        inner: fixed(sightOn(earth, i * 30, BAND.inner)),
        outer: fixed(sightOn(earth, i * 30, BAND.outer)),
        middle: fixed(sightOn(earth, i * 30 + 15, MIDDLE)),
    }));
}

const radius = (p: Point) => fixed({ x: Math.hypot(p.x, p.y), y: 0 }).x;

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
    return {
        bodies,
        orbits: {
            Venus: radius(bodies.Venus),
            Tierra: radius(earth),
            Marte: radius(bodies.Marte),
        },
        signs: bandSigns(earth),
        sight: (body) => ({
            from: earth,
            to: fixed(sightOn(earth, longitude(body), BAND.inner)),
            label: fixed(sightOn(earth, longitude(body), BAND.inner - 0.09)),
        }),
    };
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Days drawn past the last moment: Venus doesn't stop at the edge. */
const ROUTE_TAIL = 12;

/**
 * Venus over the months after the reading, one day at a time from the
 * reading's day: where it and the Earth are on their orbits, and the sign
 * Venus is seen in from here (the same sky <cielo> told the model).
 */
export interface VenusRoute {
    venus: Point[];
    earth: Point[];
    sign: string[];
    /** The reading's day, whole: the first look before the camera closes in. */
    today: {
        mars: Point;
        orbits: SolarSystemView["orbits"];
        signs: BandSign[];
    };
    /** Each event's day: where Venus stops for it. */
    stops: number[];
}

export function venusRoute(events: readonly SkyEvent[]): VenusRoute | null {
    if (!events.length) return null;
    const start =
        Date.parse(`${events[0].date}T12:00:00Z`) - events[0].day * DAY_MS;
    const days = Math.max(...events.map((e) => e.day)) + ROUTE_TAIL;
    const venus: Point[] = [];
    const earth: Point[] = [];
    const sign: string[] = [];
    let mars: Point = { x: 0, y: 0 };
    for (let day = 0; day <= days; day++) {
        const jd = julianDay(new Date(start + day * DAY_MS));
        const at = orbitPositions(jd);
        venus.push(inView(at.venus));
        earth.push(inView(at.earth));
        sign.push(longitudeToSign(venusLongitude(jd)).sign.name);
        if (day === 0) mars = inView(at.mars);
    }
    return {
        venus,
        earth,
        sign,
        today: {
            mars,
            orbits: {
                Venus: radius(venus[0]),
                Tierra: radius(earth[0]),
                Marte: radius(mars),
            },
            signs: bandSigns(earth[0]),
        },
        stops: events.map((e) => e.day),
    };
}
