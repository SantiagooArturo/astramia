import { notFound } from "next/navigation";
import { DashboardView } from "@/core/analytics/client/panel/dashboard-view";
import { PanelGate } from "@/core/analytics/client/panel/panel-gate";
import { PanelShell } from "@/core/analytics/client/panel/panel-shell";
import {
    dashboardService,
    rangeOf,
} from "@/core/analytics/server/services/dashboard-service";
import { panelAccess } from "@/core/analytics/server/services/panel-access";

export const dynamic = "force-dynamic";

export default async function PanelPage({
    searchParams,
}: {
    searchParams: Promise<{ dias?: string }>;
}) {
    const access = await panelAccess();
    if (!access) notFound();
    if (access.kind !== "open") return <PanelGate access={access} />;

    const range = rangeOf((await searchParams).dias);
    const data = await dashboardService(range).catch((error: unknown) => {
        // Deployed before its migration: say so instead of a blank 500.
        if (String(error).includes('relation "events" does not exist'))
            return null;
        throw error;
    });
    return (
        <PanelShell section="/panel" range={range} email={access.email}>
            {data ? (
                <DashboardView data={data} />
            ) : (
                <p className="rounded-xl border border-dashed p-4 text-sm">
                    Falta crear la tabla de eventos en la base de datos: hay que
                    correr <code>pnpm db:migrate</code> una vez.
                </p>
            )}
        </PanelShell>
    );
}
