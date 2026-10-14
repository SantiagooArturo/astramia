import { describe, expect, it } from "vitest";
import { toAiUsage } from "../usage";

describe("toAiUsage", () => {
    it("reads tokens and the gateway's cost (sent as a string)", () => {
        expect(
            toAiUsage("google/gemini-2.5-flash", {
                usage: { inputTokens: 812, outputTokens: 1450 },
                providerMetadata: {
                    gateway: { cost: "0.0038686", generationId: "gen_1" },
                },
            }),
        ).toEqual({
            model: "google/gemini-2.5-flash",
            inputTokens: 812,
            outputTokens: 1450,
            costUsd: 0.0038686,
        });
    });

    it("keeps the call with a null cost when the gateway reports none", () => {
        expect(
            toAiUsage("m", {
                usage: { inputTokens: undefined, outputTokens: 3 },
                providerMetadata: undefined,
            }),
        ).toEqual({
            model: "m",
            inputTokens: null,
            outputTokens: 3,
            costUsd: null,
        });
    });

    it("bills the fallback when the requested model failed", () => {
        const usage = toAiUsage("google/gemini-4-argon", {
            usage: { inputTokens: 10, outputTokens: 5 },
            providerMetadata: {
                gateway: {
                    cost: "0.0001",
                    routing: {
                        modelAttempts: [
                            {
                                canonicalSlug: "google/gemini-4-argon",
                                success: false,
                            },
                            {
                                canonicalSlug: "google/gemini-3.8-flash",
                                success: true,
                            },
                        ],
                    },
                },
            },
        });
        expect(usage.model).toBe("google/gemini-3.8-flash");
    });
});
