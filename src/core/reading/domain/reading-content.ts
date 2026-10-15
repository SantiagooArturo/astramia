import { readingScenesSchema } from "./schemas";
import type { ReadingScenes } from "./types";

/**
 * `readings.content` holds the scenes as JSON since the reading is written
 * per scene; older readings hold Markdown. `null` means Markdown.
 */
export function parseScenes(content: string): ReadingScenes | null {
    if (!content.trimStart().startsWith("{")) return null;
    try {
        const parsed = readingScenesSchema.safeParse(JSON.parse(content));
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}

/** What's shown next to each scene, for anyone reading the text alone. */
const SCENE_LABELS: Record<
    Exclude<keyof ReadingScenes, "opening" | "moments" | "closing">,
    string
> = {
    venus: "Venus",
    mars: "Marte",
    venusMars: "Venus y Marte, juntos",
    moonPhase: "La Luna con que naciste",
    moon: "La Luna",
    sun: "El Sol",
    moonSun: "La Luna y el Sol, juntos",
    question: "Tu pregunta",
    gesture: "Un gesto para esta semana",
};

/**
 * The reading as plain text with a heading per scene: the chat's <lectura>
 * and the eval's judge read it like this. Markdown passes through.
 */
export function readingAsText(content: string): string {
    const scenes = parseScenes(content);
    if (!scenes) return content;
    const section = (key: keyof typeof SCENE_LABELS) =>
        `## ${SCENE_LABELS[key]}\n${scenes[key]}`;
    return [
        scenes.opening,
        section("venus"),
        section("mars"),
        section("venusMars"),
        section("moonPhase"),
        section("moon"),
        section("sun"),
        section("moonSun"),
        section("question"),
        `## Lo que viene\n${scenes.moments.map((m) => m.text).join("\n\n")}`,
        section("gesture"),
        `**${scenes.closing}**`,
    ].join("\n\n");
}
