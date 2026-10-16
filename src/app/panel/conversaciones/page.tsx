import Link from "next/link";
import { notFound } from "next/navigation";
import { Table } from "@/core/analytics/client/panel/charts";
import { PanelGate } from "@/core/analytics/client/panel/panel-gate";
import { PanelShell } from "@/core/analytics/client/panel/panel-shell";
import { formatCount, formatWhen } from "@/core/analytics/domain/format";
import { conversations } from "@/core/analytics/server/repository/dashboard";
import {
    RANGES,
    rangeOf,
} from "@/core/analytics/server/services/dashboard-service";
import { panelAccess } from "@/core/analytics/server/services/panel-access";

export const dynamic = "force-dynamic";

const PAGE = 50;

/** Every chat, the latest first, each one a link to the whole conversation. */
export default async function ConversationsPage({
    searchParams,
}: {
    searchParams: Promise<{ dias?: string; pagina?: string }>;
}) {
    const access = await panelAccess();
    if (!access) notFound();
    if (access.kind !== "open") return <PanelGate access={access} />;

    const query = await searchParams;
    const range = rangeOf(query.dias);
    const days = RANGES[range];
    const page = Math.max(1, Number(query.pagina) || 1);
    const since =
        days === null ? new Date(0) : new Date(Date.now() - days * 86_400_000);
    const { total, items } = await conversations(
        since,
        PAGE,
        (page - 1) * PAGE,
    );
    const pages = Math.max(1, Math.ceil(total / PAGE));
    const at = (n: number) => `/panel/conversaciones?dias=${range}&pagina=${n}`;

    return (
        <PanelShell
            section="/panel/conversaciones"
            range={range}
            email={access.email}
        >
            <p className="text-muted-foreground text-sm">
                {formatCount(total)} conversaciones con actividad en este rango.
                Toca una para leerla entera, con las respuestas del cuestionario
                y todo lo que hizo esa persona en la página.
            </p>
            <div className="rounded-xl border bg-card p-4">
                <Table
                    head={[
                        "Primera pregunta",
                        "Signo",
                        "Preguntas",
                        "Última vez",
                    ]}
                    rows={items.map((c) => [
                        <Link
                            key={c.readingId}
                            href={`/panel/conversaciones/${c.readingId}`}
                            className="line-clamp-2 underline-offset-4 hover:underline"
                        >
                            {c.firstQuestion || "(sin texto)"}
                        </Link>,
                        c.sunSign,
                        formatCount(c.questions),
                        formatWhen(c.lastAt),
                    ])}
                    empty="Nadie le ha escrito al Sol en este rango."
                />
            </div>
            {pages > 1 && (
                <nav className="flex items-center justify-between text-sm">
                    {page > 1 ? (
                        <Link href={at(page - 1)}>← Más recientes</Link>
                    ) : (
                        <span />
                    )}
                    <span className="text-muted-foreground">
                        Página {page} de {pages}
                    </span>
                    {page < pages ? (
                        <Link href={at(page + 1)}>Más antiguas →</Link>
                    ) : (
                        <span />
                    )}
                </nav>
            )}
        </PanelShell>
    );
}
