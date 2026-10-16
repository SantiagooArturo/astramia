import "server-only";
import { getLogger } from "@logtape/logtape";
import type { z } from "zod";
import { ServerConfig } from "@/config/server-config";
import type { AiUsageContext } from "@/core/ai/domain/types";
import { generateObject } from "@/core/ai/server/repository/llm";
import { AI_TASKS, reviewPrompt } from "@/core/reading/domain/prompts";
import type { ReadingProfile } from "@/core/reading/domain/types";

const logger = getLogger(["server", "reading"]);

/**
 * The editor's pass over what was just written (`reviewPrompt`): what it
 * claims about their life that their answers don't say. Never in the way:
 * if it fails, the text goes out as written.
 */
export async function reviewTexts<T>(params: {
    schema: z.ZodType<T>;
    profile: ReadingProfile;
    texts: T;
    usage: AiUsageContext;
}): Promise<T> {
    try {
        const review = reviewPrompt(params.schema);
        const { cambios, texto } = await generateObject({
            model: ServerConfig.ai.models.review,
            system: review.system,
            prompt: review.prompt(params.profile, params.texts),
            schema: review.schema,
            ...AI_TASKS.review,
            usage: params.usage,
        });
        if (cambios.length)
            logger.info("Review changed {count} lines of {id}", {
                count: cambios.length,
                id: params.usage.referenceId,
            });
        return texto;
    } catch (cause) {
        logger.warn("Review of {id} failed; kept as written: {cause}", {
            id: params.usage.referenceId,
            cause,
        });
        return params.texts;
    }
}
