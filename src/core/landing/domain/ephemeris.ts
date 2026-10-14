/**
 * Low-precision ephemeris for the landing's "cielo de hoy" strip.
 *
 * Sun and Moon follow the truncated series in Meeus, *Astronomical
 * Algorithms* (ch. 25 and 47); Venus and Mars use JPL's approximate
 * Keplerian elements (valid 1800–2050). Accuracy is well under 1°, which is
 * all a sign/degree readout needs. Pure and side-effect free.
 */

import { longitudeToSign, type SignPosition } from "./zodiac";

const DEG = Math.PI / 180;
const J2000 = 2451545;

const norm360 = (deg: number) => ((deg % 360) + 360) % 360;
const sin = (deg: number) => Math.sin(deg * DEG);
const cos = (deg: number) => Math.cos(deg * DEG);

/** Julian Day for a JS Date (UTC). */
export function julianDay(date: Date): number {
    return date.getTime() / 86_400_000 + 2_440_587.5;
}

/** Julian centuries since J2000.0 */
const centuries = (jd: number) => (jd - J2000) / 36525;

/** Apparent geocentric ecliptic longitude of the Sun, degrees. */
export function sunLongitude(jd: number): number {
    const T = centuries(jd);
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const C =
        (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) +
        (0.019993 - 0.000101 * T) * sin(2 * M) +
        0.000289 * sin(3 * M);
    const omega = 125.04 - 1934.136 * T;
    return norm360(L0 + C - 0.00569 - 0.00478 * sin(omega));
}

/** Geocentric ecliptic longitude of the Moon, degrees (±0.3°). */
export function moonLongitude(jd: number): number {
    const T = centuries(jd);
    const Lp = 218.3164477 + 481267.88123421 * T;
    const D = 297.8501921 + 445267.1114034 * T;
    const M = 357.5291092 + 35999.0502909 * T;
    const Mp = 134.9633964 + 477198.8675055 * T;
    const F = 93.272095 + 483202.0175233 * T;
    const correction =
        6.288774 * sin(Mp) +
        1.274027 * sin(2 * D - Mp) +
        0.658314 * sin(2 * D) +
        0.213618 * sin(2 * Mp) -
        0.185116 * sin(M) -
        0.114332 * sin(2 * F) +
        0.058793 * sin(2 * D - 2 * Mp) +
        0.057066 * sin(2 * D - M - Mp) +
        0.053322 * sin(2 * D + Mp) +
        0.045758 * sin(2 * D - M) -
        0.040923 * sin(M - Mp) -
        0.03472 * sin(D) -
        0.030383 * sin(M + Mp);
    return norm360(Lp + correction);
}

interface KeplerElements {
    a: [number, number];
    e: [number, number];
    i: [number, number];
    L: [number, number];
    peri: [number, number];
    node: [number, number];
}

// JPL approximate elements, Table 1 (1800 AD – 2050 AD): value, rate per century.
const EARTH: KeplerElements = {
    a: [1.00000261, 0.00000562],
    e: [0.01671123, -0.00004392],
    i: [-0.00001531, -0.01294668],
    L: [100.46457166, 35999.37244981],
    peri: [102.93768193, 0.32327364],
    node: [0, 0],
};

const VENUS: KeplerElements = {
    a: [0.72333566, 0.0000039],
    e: [0.00677672, -0.00004107],
    i: [3.39467605, -0.0007889],
    L: [181.9790995, 58517.81538729],
    peri: [131.60246718, 0.00268329],
    node: [76.67984255, -0.27769418],
};

const MARS: KeplerElements = {
    a: [1.52371034, 0.00001847],
    e: [0.0933941, 0.00007882],
    i: [1.84969142, -0.00813131],
    L: [-4.55343205, 19140.30268499],
    peri: [-23.94362959, 0.44441088],
    node: [49.55953891, -0.29257343],
};

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

/** Heliocentric ecliptic (J2000) position in AU. */
function heliocentric(el: KeplerElements, T: number): Vec3 {
    const at = (p: [number, number]) => p[0] + p[1] * T;
    const a = at(el.a);
    const e = at(el.e);
    const i = at(el.i);
    const L = at(el.L);
    const peri = at(el.peri);
    const node = at(el.node);

    const omega = peri - node;
    const M = norm360(L - peri);

    // Kepler's equation, Newton iterations in degrees.
    const eStar = e / DEG;
    let E = M + eStar * sin(M);
    for (let k = 0; k < 8; k++) {
        const dM = M - (E - eStar * sin(E));
        const dE = dM / (1 - e * cos(E));
        E += dE;
        if (Math.abs(dE) < 1e-7) break;
    }

    const xp = a * (cos(E) - e);
    const yp = a * Math.sqrt(1 - e * e) * sin(E);

    const cw = cos(omega);
    const sw = sin(omega);
    const cn = cos(node);
    const sn = sin(node);
    const ci = cos(i);
    const si = sin(i);

    return {
        x: (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
        y: (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
        z: sw * si * xp + cw * si * yp,
    };
}

function geocentricLongitude(el: KeplerElements, jd: number): number {
    const T = centuries(jd);
    const planet = heliocentric(el, T);
    const earth = heliocentric(EARTH, T);
    const lon = Math.atan2(planet.y - earth.y, planet.x - earth.x) / DEG;
    return norm360(lon);
}

export const venusLongitude = (jd: number) => geocentricLongitude(VENUS, jd);
export const marsLongitude = (jd: number) => geocentricLongitude(MARS, jd);

export type MoonPhaseName =
    | "Luna nueva"
    | "Luna creciente"
    | "Cuarto creciente"
    | "Gibosa creciente"
    | "Luna llena"
    | "Gibosa menguante"
    | "Cuarto menguante"
    | "Luna menguante";

export interface MoonPhase {
    /** 0 = new, 0.5 = full, 1 = new again */
    fraction: number;
    /** Illuminated portion of the disc, 0–1 */
    illumination: number;
    name: MoonPhaseName;
    waxing: boolean;
}

const PHASE_NAMES: MoonPhaseName[] = [
    "Luna nueva",
    "Luna creciente",
    "Cuarto creciente",
    "Gibosa creciente",
    "Luna llena",
    "Gibosa menguante",
    "Cuarto menguante",
    "Luna menguante",
];

/** Phase from Sun–Moon elongation. */
export function moonPhase(jd: number): MoonPhase {
    const elongation = norm360(moonLongitude(jd) - sunLongitude(jd));
    const fraction = elongation / 360;
    const illumination = (1 - cos(elongation)) / 2;
    const index = Math.round(fraction * 8) % 8;
    return {
        fraction,
        illumination,
        name: PHASE_NAMES[index],
        waxing: fraction < 0.5,
    };
}

export interface BodyReading {
    name: string;
    glyph: string;
    longitude: number;
    position: SignPosition;
}

export interface SkySnapshot {
    date: Date;
    sun: BodyReading;
    moon: BodyReading & { phase: MoonPhase };
    venus: BodyReading;
    mars: BodyReading;
}

/** Everything the "cielo de hoy" strip shows, computed for one instant. */
export function getSkySnapshot(date: Date): SkySnapshot {
    const jd = julianDay(date);
    const reading = (name: string, glyph: string, longitude: number) => ({
        name,
        glyph,
        longitude,
        position: longitudeToSign(longitude),
    });
    return {
        date,
        sun: reading("Sol", "☉", sunLongitude(jd)),
        moon: {
            ...reading("Luna", "☾", moonLongitude(jd)),
            phase: moonPhase(jd),
        },
        venus: reading("Venus", "♀", venusLongitude(jd)),
        mars: reading("Marte", "♂", marsLongitude(jd)),
    };
}
