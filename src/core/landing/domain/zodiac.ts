/**
 * Tropical zodiac: sign table, sun-sign lookup from a birth day/month and
 * helpers to express an ecliptic longitude as "14°32′ ♏".
 * Pure and side-effect free.
 */

export type ZodiacSignId =
    | "aries"
    | "tauro"
    | "geminis"
    | "cancer"
    | "leo"
    | "virgo"
    | "libra"
    | "escorpio"
    | "sagitario"
    | "capricornio"
    | "acuario"
    | "piscis";

export type Element = "fuego" | "tierra" | "aire" | "agua";

export interface MonthDay {
    /** 1–12 */
    month: number;
    /** 1–31 */
    day: number;
}

export interface ZodiacSign {
    id: ZodiacSignId;
    name: string;
    /** Sign glyph with U+FE0E appended so platforms never swap in an emoji. */
    glyph: string;
    element: Element;
    /** Planet that rules the sign, used as marginalia. */
    ruler: { name: string; glyph: string };
    start: MonthDay;
    end: MonthDay;
    /** One honest line about love for this sign, used as a teaser. */
    loveTeaser: string;
}

/** Ordered from Aries; index === position on the wheel (0–11). */
export const ZODIAC_SIGNS: readonly ZodiacSign[] = [
    {
        id: "aries",
        name: "Aries",
        glyph: "♈\uFE0E",
        element: "fuego",
        ruler: { name: "Marte", glyph: "♂" },
        start: { month: 3, day: 21 },
        end: { month: 4, day: 19 },
        loveTeaser:
            "Te enamoras rápido y de frente. Lo difícil no es empezar: es quedarte cuando baja la chispa.",
    },
    {
        id: "tauro",
        name: "Tauro",
        glyph: "♉\uFE0E",
        element: "tierra",
        ruler: { name: "Venus", glyph: "♀" },
        start: { month: 4, day: 20 },
        end: { month: 5, day: 20 },
        loveTeaser:
            "Venus te rige: amas con el cuerpo, con la rutina y con el tiempo. Soltar es lo que más te cuesta.",
    },
    {
        id: "geminis",
        name: "Géminis",
        glyph: "♊\uFE0E",
        element: "aire",
        ruler: { name: "Mercurio", glyph: "☿" },
        start: { month: 5, day: 21 },
        end: { month: 6, day: 20 },
        loveTeaser:
            "Te enamora una buena conversación antes que una cara bonita. Y te aburre el silencio incómodo.",
    },
    {
        id: "cancer",
        name: "Cáncer",
        glyph: "♋\uFE0E",
        element: "agua",
        ruler: { name: "Luna", glyph: "☾" },
        start: { month: 6, day: 21 },
        end: { month: 7, day: 22 },
        loveTeaser:
            "La Luna te rige: cuidas, recuerdas y guardas. A veces guardas también lo que ya deberías soltar.",
    },
    {
        id: "leo",
        name: "Leo",
        glyph: "♌\uFE0E",
        element: "fuego",
        ruler: { name: "Sol", glyph: "☉" },
        start: { month: 7, day: 23 },
        end: { month: 8, day: 22 },
        loveTeaser:
            "Amas en grande y necesitas que se note. El reto es dejar que te vean también cuando no brillas.",
    },
    {
        id: "virgo",
        name: "Virgo",
        glyph: "♍\uFE0E",
        element: "tierra",
        ruler: { name: "Mercurio", glyph: "☿" },
        start: { month: 8, day: 23 },
        end: { month: 9, day: 22 },
        loveTeaser:
            "Demuestras amor arreglando cosas. Tu lectura habla de aprender a recibirlo sin corregirlo.",
    },
    {
        id: "libra",
        name: "Libra",
        glyph: "♎\uFE0E",
        element: "aire",
        ruler: { name: "Venus", glyph: "♀" },
        start: { month: 9, day: 23 },
        end: { month: 10, day: 22 },
        loveTeaser:
            "Venus te rige: buscas la pareja como quien busca equilibrio. Decidir sin el otro es tu tarea pendiente.",
    },
    {
        id: "escorpio",
        name: "Escorpio",
        glyph: "♏\uFE0E",
        element: "agua",
        ruler: { name: "Plutón", glyph: "♇" },
        start: { month: 10, day: 23 },
        end: { month: 11, day: 21 },
        loveTeaser:
            "O todo o nada. Tu lectura entra en lo que haces con la confianza cuando alguien te la rompe.",
    },
    {
        id: "sagitario",
        name: "Sagitario",
        glyph: "♐\uFE0E",
        element: "fuego",
        ruler: { name: "Júpiter", glyph: "♃" },
        start: { month: 11, day: 22 },
        end: { month: 12, day: 21 },
        loveTeaser:
            "Necesitas horizonte, incluso en pareja. La pregunta es cuánto espacio pides y cuánto das.",
    },
    {
        id: "capricornio",
        name: "Capricornio",
        glyph: "♑\uFE0E",
        element: "tierra",
        ruler: { name: "Saturno", glyph: "♄" },
        start: { month: 12, day: 22 },
        end: { month: 1, day: 19 },
        loveTeaser:
            "Te tomas el amor en serio, quizá demasiado pronto. Saturno pregunta qué pasa si te permites jugar.",
    },
    {
        id: "acuario",
        name: "Acuario",
        glyph: "♒\uFE0E",
        element: "aire",
        ruler: { name: "Urano", glyph: "♅" },
        start: { month: 1, day: 20 },
        end: { month: 2, day: 18 },
        loveTeaser:
            "Quieres a alguien que te deje ser raro. Lo que te cuesta es la cercanía cuando se vuelve diaria.",
    },
    {
        id: "piscis",
        name: "Piscis",
        glyph: "♓\uFE0E",
        element: "agua",
        ruler: { name: "Neptuno", glyph: "♆" },
        start: { month: 2, day: 19 },
        end: { month: 3, day: 20 },
        loveTeaser:
            "Te enamoras de lo que podría ser. Tu lectura te ayuda a mirar lo que es, sin perder la ternura.",
    },
];

export const MONTHS_ES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
] as const;

/** Year-agnostic month length (February allows the 29th). */
export function daysInMonth(month: number): number {
    if (month === 2) return 29;
    if ([4, 6, 9, 11].includes(month)) return 30;
    return 31;
}

export function isValidMonthDay(month: number, day: number): boolean {
    return (
        Number.isInteger(month) &&
        Number.isInteger(day) &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= daysInMonth(month)
    );
}

/** Sun sign for a birth date. `undefined` when the day/month is not valid. */
export function getSunSign(month: number, day: number): ZodiacSign | undefined {
    if (!isValidMonthDay(month, day)) return undefined;
    const key = month * 100 + day;
    return ZODIAC_SIGNS.find(({ start, end }) => {
        const s = start.month * 100 + start.day;
        const e = end.month * 100 + end.day;
        // Capricorn wraps the year boundary.
        return s <= e ? key >= s && key <= e : key >= s || key <= e;
    });
}

export function getSignById(id: string): ZodiacSign | undefined {
    return ZODIAC_SIGNS.find((sign) => sign.id === id);
}

export interface SignPosition {
    sign: ZodiacSign;
    /** Whole degrees inside the sign, 0–29 */
    degree: number;
    /** Arc minutes, 0–59 */
    minute: number;
}

/** Maps an ecliptic longitude (0–360°) to sign + degree + minute. */
export function longitudeToSign(longitude: number): SignPosition {
    const normalized = ((longitude % 360) + 360) % 360;
    const index = Math.floor(normalized / 30);
    const inside = normalized - index * 30;
    const degree = Math.floor(inside);
    const minute = Math.floor((inside - degree) * 60);
    return { sign: ZODIAC_SIGNS[index], degree, minute };
}

/** "14°32′" */
export function formatDegree({ degree, minute }: SignPosition): string {
    return `${degree}°${String(minute).padStart(2, "0")}′`;
}
