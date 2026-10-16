/**
 * Dumps the analytics to `.analytics/` as JSON Lines, to read them outside
 * the panel (a notebook, a spreadsheet, or a Claude session):
 *
 *   pnpm analytics:export                     # last 30 days, both files
 *   pnpm analytics:export --dias=7 --que=conversaciones
 *   pnpm analytics:export --dias=todo --que=eventos
 *
 * conversaciones: one line per reading with a chat (answers, messages).
 * eventos: one line per event (pages, quiz, reading progress, payments).
 * Reads DATABASE_URL; streams by pages, so months of data stay light.
 */
import { createWriteStream, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

const args = Object.fromEntries(
    process.argv
        .slice(2)
        .map((arg) => arg.replace(/^--/, "").split("="))
        .map(([key, value]) => [key, value ?? "true"]),
);
const days = args.dias === "todo" ? null : Number(args.dias ?? 30);
const since =
    days === null ? new Date(0) : new Date(Date.now() - days * 86_400_000);
const what: string[] =
    args.que === "eventos" || args.que === "conversaciones"
        ? [args.que]
        : ["conversaciones", "eventos"];

const PAGE = 2000;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
const dir = resolve(".analytics");
mkdirSync(dir, { recursive: true });
const day = new Date().toISOString().slice(0, 10);

async function dump(
    name: string,
    page: (after: string | number | null) => Promise<Record<string, unknown>[]>,
    key: string,
): Promise<void> {
    const path = resolve(dir, `${name}-${args.dias ?? 30}-${day}.jsonl`);
    const out = createWriteStream(path);
    let after: string | number | null = null;
    let total = 0;
    for (;;) {
        const rows = await page(after);
        for (const row of rows) out.write(`${JSON.stringify(row)}\n`);
        total += rows.length;
        if (rows.length < PAGE) break;
        after = rows[rows.length - 1][key] as string | number;
    }
    await new Promise((done) => out.end(done));
    console.log(`${name}: ${total} → ${path}`);
}

if (what.includes("conversaciones"))
    await dump(
        "conversaciones",
        async (after) =>
            (
                await pool.query(
                    `select r.id as reading_id, r.created_at, r.unlocked_at, r.topic,
                        r.sun_sign, r.birth_date, r.birth_time, r.birth_place, r.answers,
                        r.teaser, r.content,
                        json_agg(json_build_object('role', m.role, 'content', m.content,
                            'at', m.created_at) order by m.created_at) as messages
                    from readings r join chat_messages m on m.reading_id = r.id
                    where ($2::text is null or r.id > $2)
                    group by r.id
                    having max(m.created_at) >= $1
                    order by r.id limit ${PAGE}`,
                    [since, after],
                )
            ).rows,
        "reading_id",
    );

if (what.includes("eventos"))
    await dump(
        "eventos",
        async (after) =>
            (
                await pool.query(
                    `select id, at, name, visitor_id, session_id, user_id, reading_id,
                        path, props
                    from events where at >= $1 and id > $2
                    order by id limit ${PAGE}`,
                    [since, after ?? 0],
                )
            ).rows,
        "id",
    );

await pool.end();
