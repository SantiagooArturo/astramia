import { notFound } from "next/navigation";
import {
    conversationsPage,
    eventsPage,
} from "@/core/analytics/server/repository/dashboard";
import {
    RANGES,
    rangeOf,
} from "@/core/analytics/server/services/dashboard-service";
import { panelAccess } from "@/core/analytics/server/services/panel-access";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PAGE = 2000;

/**
 * The raw data as JSON Lines (one object per line): every conversation
 * with its reading's answers, or every event. Streamed a page at a time,
 * so a big range never sits whole in memory. Opens in any editor, loads in
 * a spreadsheet or a notebook, and Claude can read it as is.
 */
export async function GET(request: Request) {
    const access = await panelAccess();
    if (access?.kind !== "open") notFound();

    const url = new URL(request.url);
    const what =
        url.searchParams.get("que") === "eventos"
            ? "eventos"
            : "conversaciones";
    const range = rangeOf(url.searchParams.get("dias") ?? undefined);
    const days = RANGES[range];
    const since =
        days === null ? new Date(0) : new Date(Date.now() - days * 86_400_000);
    const encoder = new TextEncoder();

    const body = new ReadableStream<Uint8Array>({
        async start(controller) {
            const write = (row: unknown) =>
                controller.enqueue(encoder.encode(`${JSON.stringify(row)}\n`));
            try {
                if (what === "eventos") {
                    let after = 0;
                    for (;;) {
                        const page = await eventsPage(since, after, PAGE);
                        for (const row of page) write(row);
                        if (page.length < PAGE) break;
                        after = Number(page[page.length - 1].id);
                    }
                } else {
                    let after: string | null = null;
                    for (;;) {
                        const page = await conversationsPage(
                            since,
                            after,
                            PAGE,
                        );
                        for (const row of page) write(row);
                        if (page.length < PAGE) break;
                        after = String(page[page.length - 1].reading_id);
                    }
                }
                controller.close();
            } catch (error) {
                controller.error(error);
            }
        },
    });
    const day = new Date().toISOString().slice(0, 10);
    return new Response(body, {
        headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Content-Disposition": `attachment; filename="astramia-${what}-${range}-${day}.jsonl"`,
            "Cache-Control": "no-store",
        },
    });
}
