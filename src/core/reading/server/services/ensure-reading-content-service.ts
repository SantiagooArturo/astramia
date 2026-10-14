import "server-only";
import { getLogger } from "@logtape/logtape";
import { ServerConfig } from "@/config/server-config";
import { generate } from "@/core/ai/server/repository/llm";
import { AI_TASKS, READING_PROMPT } from "@/core/reading/domain/prompts";
import type { Reading } from "@/core/reading/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import {
    claimReadingGeneration,
    findReading,
    saveReadingContent,
} from "../repository/readings";
import { toProfile, toReading } from "../repository/utils";

const logger = getLogger(["server", "reading"]);

/** A claim older than this is considered abandoned (crashed request). */
const CLAIM_TTL_MS = 2 * 60 * 1000;

/**
 * Returns the unlocked reading, writing the full text the first time it is
 * opened. Concurrent opens don't double-bill: only the claimant generates,
 * the others get `content: null` and the page polls.
 */
export async function ensureReadingContentService(
    userId: string,
    id: string,
): AsyncAppResult<Reading> {
    try {
        const row = await findReading(userId, id);
        if (!row) return err(AppErrors.notFound({ targets: ["reading"] }));
        const reading = toReading(row);
        if (reading.locked) return err(AppErrors.forbidden());
        if (reading.content) return ok(reading);

        const claimed = await claimReadingGeneration(
            id,
            new Date(Date.now() - CLAIM_TTL_MS),
        );
        if (!claimed) return ok(reading);

        try {
            const content = await generate({
                model: ServerConfig.ai.models.reading,
                system: READING_PROMPT.system,
                prompt: READING_PROMPT.prompt(
                    toProfile(row),
                    row.teaser,
                    new Date(),
                ),
                ...AI_TASKS.reading,
                usage: { purpose: "reading", userId, referenceId: id },
            });
            await saveReadingContent(id, content.trim());
            return ok({ ...reading, content: content.trim() });
        } catch (cause) {
            // Release the claim so the next open retries right away.
            await saveReadingContent(id, null);
            logger.error("Reading {id} generation failed: {cause}", {
                id,
                cause,
            });
            return err(AppErrors.unexpected(cause));
        }
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
