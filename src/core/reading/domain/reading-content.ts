import {
    HOOK_SENTENCES,
    type ReadingPlan,
    type SceneTexts,
    sceneMoments,
    scenesOf,
    sceneText,
} from "./plan";

/**
 * `readings.teaser` and `readings.content` hold scene texts as JSON (see
 * `plan.ts`). Older readings hold a paragraph (teaser) or Markdown
 * (content): those parse to `null`.
 */
export function parseTexts(text: string): SceneTexts | null {
    if (!text.trimStart().startsWith("{")) return null;
    try {
        const value: unknown = JSON.parse(text);
        return value && typeof value === "object" && !Array.isArray(value)
            ? (value as SceneTexts)
            : null;
    } catch {
        return null;
    }
}

/** A text's sentences, as written (the last may lack its full stop). */
export function sentencesOf(text: string): string[] {
    return (
        text
            .match(/[^.!?…]+(?:[.!?…]+["»”]?|$)/g)
            ?.map((s) => s.trim())
            .filter(Boolean) ?? [text]
    );
}

/** What's shown of the hook before paying: its first sentences, never all. */
export function hookOf(text: string): string {
    const sentences = sentencesOf(text);
    const shown =
        sentences.length > HOOK_SENTENCES
            ? HOOK_SENTENCES
            : Math.max(1, sentences.length - 1);
    return sentences.slice(0, shown).join(" ");
}

/**
 * The teaser a locked reading's page gets: the hook cut to what's free.
 * The rest stays on the server until it's paid for.
 */
export function lockTeaser(teaser: string, plan: ReadingPlan): string {
    const texts = parseTexts(teaser);
    const hook = texts && sceneText(texts, plan.hook.key);
    return hook
        ? JSON.stringify({ ...texts, [plan.hook.key]: hookOf(hook) })
        : teaser;
}

/** The free part as plain text: the paid prompt's <inicio>, the judge. */
export function freeAsText(teaser: string, plan: ReadingPlan): string {
    const texts = parseTexts(teaser);
    if (!texts) return teaser;
    return [...plan.free, plan.hook]
        .map((scene) => {
            const text = sceneText(texts, scene.key);
            return text && `## ${scene.label}\n${text}`;
        })
        .filter(Boolean)
        .join("\n\n");
}

/**
 * Everything they read, free scenes first, as plain text with a heading
 * per scene: the chat's <lectura> and the eval's judge read it like this.
 * Markdown passes through.
 */
export function readingAsText(
    content: string,
    teaser: string,
    plan: ReadingPlan,
): string {
    const paid = parseTexts(content);
    if (!paid) return content;
    // The free scenes live in the teaser; older readings carry them here.
    const texts = { ...paid, ...parseTexts(teaser) };
    const sections = scenesOf(plan).map((scene) => {
        if (scene.kind === "moments") {
            const moments = sceneMoments(texts);
            return moments.length
                ? `## ${scene.label}\n${moments.map((m) => m.text).join("\n\n")}`
                : null;
        }
        const text = sceneText(texts, scene.key);
        return text && `## ${scene.label}\n${text}`;
    });
    const closing = sceneText(texts, "closing");
    return [
        // Readings from before the free scenes opened with one.
        sceneText(paid, "opening"),
        ...sections,
        closing && `**${closing}**`,
    ]
        .filter(Boolean)
        .join("\n\n");
}
