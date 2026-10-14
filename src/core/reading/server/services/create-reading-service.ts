import "server-only";
import { ServerConfig } from "@/config/server-config";
import { generate } from "@/core/ai/server/repository/llm";
import { sunSignOf } from "@/core/reading/domain/chart";
import { TEASER_PROMPT } from "@/core/reading/domain/prompts";
import { DAILY_READING_LIMIT } from "@/core/reading/domain/schemas";
import type { CreateReading } from "@/core/reading/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { countReadingsSince, createReading } from "../repository/readings";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Saves the questionnaire and writes the free teaser paragraph. */
export async function createReadingService(
    userId: string,
    input: CreateReading,
): AsyncAppResult<{ id: string }> {
    try {
        const recent = await countReadingsSince(
            userId,
            new Date(Date.now() - DAY_MS),
        );
        if (recent >= DAILY_READING_LIMIT)
            return err(AppErrors.tooManyRequests());

        const profile = {
            birthDate: input.birthDate,
            birthTime: input.birthTime ?? null,
            birthPlace: input.birthPlace ?? null,
            answers: input.answers,
        };
        const id = crypto.randomUUID();
        const teaser = await generate({
            model: ServerConfig.ai.models.teaser,
            system: TEASER_PROMPT.system,
            prompt: TEASER_PROMPT.prompt(profile),
            maxOutputTokens: 300,
            usage: { purpose: "teaser", userId, referenceId: id },
        });

        const row = await createReading({
            id,
            userId,
            topic: input.topic,
            ...profile,
            sunSign: sunSignOf(input.birthDate),
            teaser: teaser.trim(),
        });
        return ok({ id: row.id });
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
