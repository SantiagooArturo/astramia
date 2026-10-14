import type { LanguageModelUsage } from "ai";
import {
    gatewayCostMetadataSchema,
    gatewayRoutingMetadataSchema,
} from "./schemas";
import type { AiUsage } from "./types";

/**
 * Tokens and USD cost of one call, as the AI Gateway reports them, billed to
 * the model that actually answered (a fallback, if the requested one failed).
 */
export function toAiUsage(
    requestedModel: string,
    outcome: {
        usage: Pick<LanguageModelUsage, "inputTokens" | "outputTokens">;
        providerMetadata: unknown;
    },
): AiUsage {
    const cost = gatewayCostMetadataSchema.safeParse(outcome.providerMetadata);
    const routing = gatewayRoutingMetadataSchema.safeParse(
        outcome.providerMetadata,
    );
    const served = routing.success
        ? routing.data.gateway.routing.modelAttempts
              .filter((attempt) => attempt.success)
              .at(-1)?.canonicalSlug
        : undefined;
    return {
        model: served ?? requestedModel,
        inputTokens: outcome.usage.inputTokens ?? null,
        outputTokens: outcome.usage.outputTokens ?? null,
        costUsd: cost.success ? cost.data.gateway.cost : null,
    };
}
