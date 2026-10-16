import type { AiPurpose } from "./types";

/**
 * Production models (AI Gateway ids), picked with `pnpm eval:prompts`.
 * The free part is written for everyone who finishes the quiz, most of
 * whom never pay: it runs on Gemini 3.8 Flash, reasoning little, at about
 * a third of Argon's price per hook ($0.004 against $0.011) and faster. Gemini 4 Argon writes only the
 * paid reading, once per buyer. The chat and the review of what they
 * wrote run on 3.8 Flash too. `fallback` answers any call whose model
 * fails. Each one can be overridden with its AI_MODEL_* env var.
 */
export const DEFAULT_AI_MODELS = {
    teaser: "google/gemini-3.8-flash",
    reading: "google/gemini-4-argon",
    chat: "google/gemini-3.8-flash",
    review: "google/gemini-3.8-flash",
    fallback: "google/gemini-3.8-flash",
} as const satisfies Record<AiPurpose | "fallback", string>;
