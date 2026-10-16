import {
    CUT_MARK,
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

/** Among a reading's texts: how many characters of the hook are free. */
const CUT = "cut";

/** Words a cut leaves on each side, at least: something said, something kept. */
const CUT_WORDS = 6;

/** Without a cut from the model: whole sentences shown, at most. */
const HOOK_SENTENCES = 2;

/** …and the first words of the next one, so it stops mid-thought. */
const LEAD_WORDS = 3;

const SENTENCE_END = /[.!?…]["»”]?$/;

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * The hook's free part when cut at character `at`: only mid-sentence (a
 * finished sentence leaves nothing to wonder about) and with enough on
 * each side. Anything else → null.
 */
function freeUpTo(text: string, at: unknown): string | null {
    if (typeof at !== "number" || !Number.isInteger(at)) return null;
    const shown = text.slice(0, at).trimEnd();
    const rest = text.slice(at).trim();
    return wordCount(shown) >= CUT_WORDS &&
        wordCount(rest) >= CUT_WORDS &&
        !SENTENCE_END.test(shown)
        ? shown
        : null;
}

/**
 * A text as the model wrote it, its cut mark taken out, and where the
 * mark was when it makes a good cut. Extra marks are dropped.
 */
export function takeCut(written: string): { text: string; cut?: number } {
    const [before, ...after] = written.split(CUT_MARK);
    const head = before.trim();
    const tail = after
        .join("")
        .replace(/\s{2,}/g, " ")
        .trim();
    if (!tail) return { text: head };
    const text = /^[,.;:!?…»”)]/.test(tail) ? head + tail : `${head} ${tail}`;
    return freeUpTo(text, head.length) === null
        ? { text }
        : { text, cut: head.length };
}

/**
 * The free scenes as they're kept: trimmed, without cut marks, and `cut`
 * saying how much of the hook is free, when the model marked it well.
 */
export function keptFree(
    written: SceneTexts,
    plan: ReadingPlan,
): Record<string, unknown> {
    const kept: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(written)) {
        if (typeof value !== "string") {
            kept[key] = value;
            continue;
        }
        const { text, cut } = takeCut(value);
        kept[key] = text;
        if (key === plan.hook.key && cut !== undefined) kept[CUT] = cut;
    }
    return kept;
}

/**
 * Without a good cut from the model: the first sentences, never all, and
 * the opening words of the next, so it still stops mid-thought.
 */
export function hookOf(text: string): string {
    const sentences = sentencesOf(text);
    const whole =
        sentences.length > HOOK_SENTENCES
            ? HOOK_SENTENCES
            : Math.max(1, sentences.length - 1);
    const next = sentences[whole]?.split(/\s+/) ?? [];
    // A short sentence stays hidden whole: its first words would be most of it.
    const lead =
        next.length >= CUT_WORDS
            ? next
                  .slice(0, LEAD_WORDS)
                  .join(" ")
                  .replace(/[,;:]$/, "")
            : "";
    return [...sentences.slice(0, whole), lead].filter(Boolean).join(" ");
}

/** What's shown of the hook before paying: up to its cut. */
export function hookShown(texts: SceneTexts, plan: ReadingPlan): string | null {
    const hook = sceneText(texts, plan.hook.key);
    return hook ? (freeUpTo(hook, texts[CUT]) ?? hookOf(hook)) : null;
}

/**
 * The teaser a locked reading's page gets: the hook cut to what's free.
 * The rest stays on the server until it's paid for.
 */
export function lockTeaser(teaser: string, plan: ReadingPlan): string {
    const texts = parseTexts(teaser);
    const shown = texts && hookShown(texts, plan);
    if (!texts || !shown) return teaser;
    const { [CUT]: _, ...rest } = texts;
    return JSON.stringify({ ...rest, [plan.hook.key]: shown });
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

/**
 * The editor's version of the free scenes, unless it lost the hook's cut
 * mark: then that scene as first written (a good cut is worth more than
 * the edit).
 */
export function keepCutMark(
    written: SceneTexts,
    reviewed: SceneTexts,
    plan: ReadingPlan,
): SceneTexts {
    const before = sceneText(written, plan.hook.key);
    const after = sceneText(reviewed, plan.hook.key);
    return before?.includes(CUT_MARK) && !after?.includes(CUT_MARK)
        ? { ...reviewed, [plan.hook.key]: before }
        : reviewed;
}
