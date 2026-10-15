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

/**
 * The launch market, for readings saved without a zone. Its IANA rules know
 * Peru's summer times (1986–87, 1990, 1994), which a fixed UTC−5 got wrong.
 * Unknown birth time → noon.
 */
export const DEFAULT_TIME_ZONE = "America/Lima";
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export function isTimeZone(value: string): boolean {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: value });
        return true;
    } catch {
        return false;
    }
}

/** Minutes `timeZone` was ahead of UTC at `instant` (historical rules). */
function utcOffsetMinutes(timeZone: string, instant: number): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    }).formatToParts(new Date(instant));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((p) => p.type === type)?.value);
    const wall = Date.UTC(
        get("year"),
        get("month") - 1,
        get("day"),
        get("hour"),
        get("minute"),
        get("second"),
    );
    return (wall - instant) / MINUTE_MS;
}

/** When a wall-clock date and time in `timeZone` happened. */
function localInstant(birthDate: string, time: string, timeZone: string): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const [y, m, d] = birthDate.split("-").map(Number);
    const zone = isTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE;
    const wall = Date.UTC(y, m - 1, d, hours, minutes);
    // The second pass settles a time near a summer-time change.
    const guess = wall - utcOffsetMinutes(zone, wall) * MINUTE_MS;
    return new Date(wall - utcOffsetMinutes(zone, guess) * MINUTE_MS);
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
    timeZone: string = DEFAULT_TIME_ZONE,
): NatalPlacement[] {
    const jd = julianDay(
        localInstant(birthDate, birthTime ?? "12:00", timeZone),
    );
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
    /** IANA zone the birth time is read in; `null` → `DEFAULT_TIME_ZONE`. */
    timeZone?: string | null,
): NatalChart {
    const zone = timeZone ?? DEFAULT_TIME_ZONE;
    const placements = natalPlacements(birthDate, birthTime, zone);
    let moonRange: NatalChart["moonRange"] = null;
    if (!birthTime) {
        const early = longitudeToSign(
            moonLongitude(julianDay(localInstant(birthDate, "00:00", zone))),
        ).sign.name;
        const late = longitudeToSign(
            moonLongitude(julianDay(localInstant(birthDate, "23:59", zone))),
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
            julianDay(localInstant(birthDate, birthTime ?? "12:00", zone)),
        ).name,
        moonRange,
    };
}

/** "21 de marzo de 1994" from an ISO date. */
export function longDate(isoDate: string): string {
    const [y, m, d] = isoDate.split("-").map(Number);
    return `${d} de ${MONTHS_ES[m - 1]} de ${y}`;
}

/** "19 feb 2001", for small labels. */
export function shortDate(isoDate: string): string {
    const [y, m, d] = isoDate.split("-").map(Number);
    return `${d} ${MONTHS_ES[m - 1].slice(0, 3)} ${y}`;
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
 * Venus after a reading written on `today`: what <cielo> tells the model and
 * the story draws, so both name the same moments. Without a birth time the
 * Moon's sign isn't flagged.
 */
export function readingOutlook(
    birth: {
        birthDate: string;
        birthTime: string | null;
        birthTimeZone: string | null;
    },
    today: Date,
): VenusOutlook {
    const [sun, moon, venus] = natalChart(
        birth.birthDate,
        birth.birthTime,
        birth.birthTimeZone,
    ).placements;
    const outlook = venusOutlook(today, {
        sun: sun.sign,
        moon: birth.birthTime ? moon.sign : "",
        venus: venus.sign,
    });
    // Four moments are enough to pick from; more and the model lists them all.
    return { ...outlook, events: outlook.events.slice(0, 4) };
}

/** How <cielo> says an event touches the person's chart. */
const MINE_TEXT = {
    Sol: "tu signo solar",
    Venus: "el signo de tu Venus",
    Luna: "el signo de tu Luna",
} as const;

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
    /** Which of the person's placements share `sign`. */
    const mine = (sign: string): SkyEvent["mine"] =>
        (
            [
                ["Sol", natal.sun],
                ["Venus", natal.venus],
                ["Luna", natal.moon],
            ] as const
        )
            .filter(([, natalSign]) => natalSign === sign)
            .map(([body]) => body);
    const event = (
        date: Date,
        kind: SkyEvent["kind"],
        sign: string,
    ): SkyEvent => {
        const tags = mine(sign);
        const verb = {
            entra: "entra en",
            retrograda: "empieza a retrogradar en",
            directa: "retoma su marcha directa en",
        }[kind];
        const owned = tags.length
            ? ` (${tags.map((body) => MINE_TEXT[body]).join(" y ")})`
            : "";
        return {
            when: approximateDate(date),
            text: `Venus ${verb} ${sign}${owned}`,
            kind,
            sign,
            month: date.getUTCMonth(),
            mine: tags,
        };
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
            events.push(
                event(date, backwards ? "retrograda" : "directa", sign),
            );
        if (longitudeToSign(previous).sign.name !== sign)
            events.push(event(date, "entra", sign));
        retrograde = backwards;
        previous = current;
    }
    return {
        sign: longitudeToSign(at(0)).sign.name,
        retrograde: startRetrograde,
        events,
    };
}
