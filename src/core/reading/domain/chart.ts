import {
    julianDay,
    marsLongitude,
    moonLongitude,
    moonPhase,
    sunLongitude,
    venusLongitude,
} from "@/core/landing/domain/ephemeris";
import {
    type Element,
    formatDegree,
    getSunSign,
    longitudeToSign,
    MONTHS_ES,
} from "@/core/landing/domain/zodiac";
import type {
    Aspect,
    AspectName,
    NatalChart,
    NatalPlacement,
    SkyEvent,
    VenusOutlook,
} from "./types";

/**
 * Everything the model may say about the sky is computed here, so a reading
 * interprets facts instead of inventing them. Pure; `now` is always passed in.
 */

/** Lima is UTC−5 all year; the launch market. Unknown birth time → noon. */
const DEFAULT_UTC_OFFSET_HOURS = -5;
const DAY_MS = 24 * 60 * 60 * 1000;

function localInstant(birthDate: string, time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const [y, m, d] = birthDate.split("-").map(Number);
    return new Date(
        Date.UTC(y, m - 1, d, hours - DEFAULT_UTC_OFFSET_HOURS, minutes),
    );
}

function placement(body: string, longitude: number): NatalPlacement {
    const position = longitudeToSign(longitude);
    return {
        body,
        sign: position.sign.name,
        degree: formatDegree(position),
        element: position.sign.element,
        longitude,
    };
}

/** Sun, Moon, Venus and Mars at birth, low precision but enough for signs. */
export function natalPlacements(
    birthDate: string,
    birthTime?: string | null,
): NatalPlacement[] {
    const jd = julianDay(localInstant(birthDate, birthTime ?? "12:00"));
    return [
        placement("Sol", sunLongitude(jd)),
        placement("Luna", moonLongitude(jd)),
        placement("Venus", venusLongitude(jd)),
        placement("Marte", marsLongitude(jd)),
    ];
}

export function sunSignOf(birthDate: string): string {
    const [, m, d] = birthDate.split("-").map(Number);
    return getSunSign(m, d)?.name ?? "desconocido";
}

/** Major aspects with the usual orbs for a love reading. */
const ASPECTS: { name: AspectName; angle: number; orb: number }[] = [
    { name: "conjunción", angle: 0, orb: 8 },
    { name: "sextil", angle: 60, orb: 4 },
    { name: "cuadratura", angle: 90, orb: 6 },
    { name: "trígono", angle: 120, orb: 6 },
    { name: "oposición", angle: 180, orb: 8 },
];

/** Aspects between every pair of placements, tightest first. */
export function aspectsBetween(placements: NatalPlacement[]): Aspect[] {
    const found: Aspect[] = [];
    placements.forEach((p, i) => {
        for (const q of placements.slice(i + 1)) {
            const diff = Math.abs(p.longitude - q.longitude) % 360;
            const separation = diff > 180 ? 360 - diff : diff;
            const match = ASPECTS.find(
                (aspect) => Math.abs(separation - aspect.angle) <= aspect.orb,
            );
            if (match)
                found.push({
                    a: p.body,
                    b: q.body,
                    name: match.name,
                    orb:
                        Math.round(Math.abs(separation - match.angle) * 10) /
                        10,
                });
        }
    });
    return found.sort((x, y) => x.orb - y.orb);
}

/** The element most placements share, or `null` when it's a tie. */
export function dominantElement(placements: NatalPlacement[]): Element | null {
    const counts = new Map<Element, number>();
    for (const p of placements)
        counts.set(p.element, (counts.get(p.element) ?? 0) + 1);
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return ranked.length === 1 || ranked[0][1] > ranked[1][1]
        ? ranked[0][0]
        : null;
}

export function natalChart(
    birthDate: string,
    birthTime: string | null,
): NatalChart {
    const placements = natalPlacements(birthDate, birthTime);
    let moonRange: NatalChart["moonRange"] = null;
    if (!birthTime) {
        const early = longitudeToSign(
            moonLongitude(julianDay(localInstant(birthDate, "00:00"))),
        ).sign.name;
        const late = longitudeToSign(
            moonLongitude(julianDay(localInstant(birthDate, "23:59"))),
        ).sign.name;
        if (early !== late) moonRange = { early, late };
    }
    return {
        placements,
        // An unknown birth time moves the Moon up to ~6.5°: its aspects aren't reliable.
        aspects: aspectsBetween(
            birthTime
                ? placements
                : placements.filter((p) => p.body !== "Luna"),
        ),
        dominantElement: dominantElement(placements),
        moonPhase: moonPhase(
            julianDay(localInstant(birthDate, birthTime ?? "12:00")),
        ).name,
        moonRange,
    };
}

/** "21 de marzo de 1994" from an ISO date. */
export function longDate(isoDate: string): string {
    const [y, m, d] = isoDate.split("-").map(Number);
    return `${d} de ${MONTHS_ES[m - 1]} de ${y}`;
}

/** "principios de noviembre": dates are ±1 day, so no false precision. */
export function approximateDate(date: Date): string {
    const day = date.getUTCDate();
    const part = day <= 10 ? "principios" : day <= 20 ? "mediados" : "finales";
    return `${part} de ${MONTHS_ES[date.getUTCMonth()]}`;
}

/** Signed daily motion in degrees, wrapping through 0° Aries. */
function motion(from: number, to: number): number {
    return ((to - from + 540) % 360) - 180;
}

/**
 * Venus over the next `days`: sign ingresses (flagging the person's own
 * signs) and retrograde stations, sampled daily at noon UTC.
 */
export function venusOutlook(
    now: Date,
    natal: { sun: string; moon: string; venus: string },
    days = 120,
): VenusOutlook {
    const noon = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        12,
    );
    const at = (i: number) =>
        venusLongitude(julianDay(new Date(noon + i * DAY_MS)));
    const mine = (sign: string) => {
        const tags = [
            sign === natal.sun && "tu signo solar",
            sign === natal.venus && "el signo de tu Venus",
            sign === natal.moon && "el signo de tu Luna",
        ].filter(Boolean);
        return tags.length ? ` (${tags.join(" y ")})` : "";
    };

    const events: SkyEvent[] = [];
    let previous = at(0);
    let retrograde = motion(at(-1), previous) < 0;
    const startRetrograde = retrograde;
    for (let i = 1; i <= days; i++) {
        const current = at(i);
        const date = new Date(noon + i * DAY_MS);
        const backwards = motion(previous, current) < 0;
        const sign = longitudeToSign(current).sign.name;
        if (backwards !== retrograde)
            events.push({
                when: approximateDate(date),
                text: backwards
                    ? `Venus empieza a retrogradar en ${sign}${mine(sign)}`
                    : `Venus retoma su marcha directa en ${sign}${mine(sign)}`,
            });
        if (longitudeToSign(previous).sign.name !== sign)
            events.push({
                when: approximateDate(date),
                text: `Venus entra en ${sign}${mine(sign)}`,
            });
        retrograde = backwards;
        previous = current;
    }
    return {
        sign: longitudeToSign(at(0)).sign.name,
        retrograde: startRetrograde,
        events,
    };
}
