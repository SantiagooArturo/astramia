import { getLogger } from "@logtape/logtape";
import { Elysia } from "elysia";
import { BOT_AGENT, trackBatchSchema } from "@/core/analytics/domain/events";
import { auth } from "@/server/auth/auth";
import { insertEvents } from "../../repository/events";

const logger = getLogger(["server", "analytics"]);

/** Nothing to say back: a 204 can't carry a body, not even an empty one. */
const noContent = () => new Response(null, { status: 204 });

/**
 * The browser's events, a batch at a time (sent with `sendBeacon`, so
 * nobody waits on it). Whoever is signed in is looked up here, once a
 * batch, so a visitor's clicks join their readings and payments.
 */
export const trackEventsRoute = new Elysia().post(
    "/events",
    async ({ body, request }) => {
        if (BOT_AGENT.test(request.headers.get("user-agent") ?? ""))
            return noContent();
        try {
            const session = await auth.api
                .getSession({ headers: request.headers })
                .catch(() => null);
            const now = Date.now();
            await insertEvents(
                body.events.map((event) => ({
                    at: new Date(now - event.ago),
                    name: event.name,
                    visitorId: body.visitorId,
                    sessionId: body.sessionId,
                    userId: session?.user.id ?? null,
                    readingId: event.readingId ?? null,
                    path: event.path ?? null,
                    props: event.props ?? null,
                })),
            );
        } catch (error) {
            // Analytics never fails a page: drop the batch, keep a trace.
            logger.warn("Events dropped: {error}", { error });
        }
        return noContent();
    },
    {
        body: trackBatchSchema,
        detail: { tags: ["Analytics"], summary: "Record browser events" },
    },
);
