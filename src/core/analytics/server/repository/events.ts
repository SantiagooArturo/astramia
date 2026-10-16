import "server-only";
import { getLogger } from "@logtape/logtape";
import { db } from "@/server/drizzle/db";
import {
    type EventProps,
    events,
    type NewEventRow,
} from "@/server/drizzle/schemas/analytics-schema";

const logger = getLogger(["server", "analytics"]);

/** One insert for the whole batch. */
export async function insertEvents(rows: NewEventRow[]): Promise<void> {
    if (rows.length) await db.insert(events).values(rows);
}

/**
 * An event the server sees for itself (a reading written, a payment). Never
 * in the way: a lost event is a gap in a chart, a thrown one a lost sale.
 */
export async function recordEvent(
    name: string,
    fields: {
        userId?: string | null;
        readingId?: string | null;
        props?: EventProps;
    } = {},
): Promise<void> {
    try {
        await insertEvents([
            {
                name,
                visitorId: "server",
                userId: fields.userId ?? null,
                readingId: fields.readingId ?? null,
                props: fields.props ?? null,
            },
        ]);
    } catch (error) {
        logger.warn("Event {name} not recorded: {error}", { name, error });
    }
}
