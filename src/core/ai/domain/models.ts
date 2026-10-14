import type { AiPurpose } from "./types";

/**
 * Production models (AI Gateway ids), picked with `pnpm eval:prompts`.
 * Gemini 4 Argon writes the hook and the reading; the chat runs on Gemini
 * 3.8 Flash, which scored the same there at a third of the price per
 * question. `fallback` answers any call whose model fails. Each one can be
 * overridden with its AI_MODEL_* env var.
 */
export const DEFAULT_AI_MODELS = {
    teaser: "google/gemini-4-argon",
    reading: "google/gemini-4-argon",
    chat: "google/gemini-3.8-flash",
    fallback: "google/gemini-3.8-flash",
} as const satisfies Record<AiPurpose | "fallback", string>;
