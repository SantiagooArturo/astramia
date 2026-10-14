import {
    index,
    integer,
    numeric,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/**
 * One row per model call, so cost per reading / per customer is a GROUP BY.
 * `cost_usd` comes from the AI Gateway when it reports it.
 */
export const aiUsage = pgTable(
    "ai_usage",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text("user_id").references(() => user.id, {
            onDelete: "set null",
        }),
        /** What the call was for: teaser, reading, chat. */
        purpose: text("purpose").notNull(),
        /** e.g. the reading id the call belongs to. */
        referenceId: text("reference_id"),
        model: text("model").notNull(),
        inputTokens: integer("input_tokens"),
        outputTokens: integer("output_tokens"),
        costUsd: numeric("cost_usd", { precision: 12, scale: 8 }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("ai_usage_reference_id_idx").on(table.referenceId),
        index("ai_usage_user_id_idx").on(table.userId),
    ],
);

export type NewAiUsageRow = typeof aiUsage.$inferInsert;
