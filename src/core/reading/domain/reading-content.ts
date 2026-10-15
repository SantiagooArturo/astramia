import { freeScenesSchema, readingScenesSchema } from "./schemas";
import type { FreeScenes, ReadingScenes } from "./types";

function parseJson<T>(
    text: string,
    schema: { safeParse(value: unknown): { success: boolean; data?: T } },
): T | null {
    if (!text.trimStart().startsWith("{")) return null;
    try {
        const parsed = schema.safeParse(JSON.parse(text));
        return parsed.success ? (parsed.data ?? null) : null;
    } catch {
        return null;
    }
}

/**
 * `readings.content` holds the scenes as JSON since the reading is written
 * per scene; older readings hold Markdown. `null` means Markdown.
 */
export function parseScenes(content: string): ReadingScenes | null {
    return parseJson(content, readingScenesSchema);
}

/**
 * `readings.teaser` holds the free scenes (Venus, Mars) as JSON; older
 * readings, a paragraph. `null` means a paragraph.
 */
export function parseFreeScenes(teaser: string): FreeScenes | null {
    return parseJson(teaser, freeScenesSchema);
}

/** The free part as plain text: the paid reading's <inicio>, the judge. */
export function freeAsText(teaser: string): string {
    const free = parseFreeScenes(teaser);
    return free ? `## Venus\n${free.venus}\n\n## Marte\n${free.mars}` : teaser;
}

/** What's shown next to each scene, for anyone reading the text alone. */
const SCENE_LABELS = {
    venusMars: "Venus y Marte, juntos",
    moonPhase: "La Luna con que naciste",
    moon: "La Luna",
    sun: "El Sol",
    moonSun: "La Luna y el Sol, juntos",
    question: "Tu pregunta",
    gesture: "Un gesto para esta semana",
} as const satisfies Partial<Record<keyof ReadingScenes, string>>;

/**
 * The whole reading as plain text with a heading per scene, the free
 * scenes first: the chat's <lectura> and the eval's judge read it like
 * this. Markdown passes through.
 */
export function readingAsText(content: string, teaser = ""): string {
    const scenes = parseScenes(content);
    if (!scenes) return content;
    const free = parseFreeScenes(teaser);
    const venus = free?.venus ?? scenes.venus;
    const mars = free?.mars ?? scenes.mars;
    const section = (key: keyof typeof SCENE_LABELS) =>
        `## ${SCENE_LABELS[key]}\n${scenes[key]}`;
    return [
        scenes.opening,
        venus && `## Venus\n${venus}`,
        mars && `## Marte\n${mars}`,
        section("venusMars"),
        section("moonPhase"),
        section("moon"),
        section("sun"),
        section("moonSun"),
        section("question"),
        `## Lo que viene\n${scenes.moments.map((m) => m.text).join("\n\n")}`,
        section("gesture"),
        `**${scenes.closing}**`,
    ]
        .filter(Boolean)
        .join("\n\n");
}
