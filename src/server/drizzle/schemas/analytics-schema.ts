import {
    bigserial,
    index,
    jsonb,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

/** An event's details: a few short values, never a document. */
export type EventProps = Record<string, string | number | boolean | null>;

/**
 * What people do on the site, one row per event: pages seen, quiz answers,
 * how far a reading was read and for how long, payments, the chat. Written
 * in batches and never updated; rows stay small (a short name, a few props)
 * so the panel can GROUP BY over months of them. The BRIN index on `at`
 * costs almost nothing on an append-only table and keeps time ranges cheap.
 */
export const events = pgTable(
    "events",
    {
        id: bigserial("id", { mode: "number" }).primaryKey(),
        at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
        name: text("name").notNull(),
        /** The browser (a random id it keeps); "server" for the server's own. */
        visitorId: text("visitor_id").notNull(),
        /** One visit: a tab, from open to close. */
        sessionId: text("session_id"),
        /** Who was signed in (anonymous accounts included), when known. */
        userId: text("user_id"),
        readingId: text("reading_id"),
        path: text("path"),
        props: jsonb("props").$type<EventProps>(),
    },
    (table) => [
        index("events_at_idx").using("brin", table.at),
        index("events_name_at_idx").on(table.name, table.at),
        index("events_reading_id_idx").on(table.readingId),
        index("events_visitor_id_idx").on(table.visitorId),
    ],
);

export type NewEventRow = typeof events.$inferInsert;
