import {
    formatCount,
    formatMoney,
    formatMs,
    formatSeconds,
    formatShare,
    formatUsd,
    formatWhen,
} from "@/core/analytics/domain/format";
import type { Dashboard } from "@/core/analytics/server/services/dashboard-service";
import { BarList, Card, Columns, StatTile, Table } from "./charts";

const PURPOSES: Record<string, string> = {
    teaser: "Lectura gratis",
    reading: "Lectura completa",
    review: "Revisión (editora)",
    chat: "Chat con el Sol",
};

/** Funnel bars: each step's count, its share of the first, what it lost. */
function funnel(steps: { label: string; value: number }[]) {
    const first = steps[0]?.value ?? 0;
    return steps.map((step, i) => {
        const before = i > 0 ? steps[i - 1].value : null;
        return {
            label: step.label,
            value: step.value,
            display: `${formatCount(step.value)} · ${formatShare(step.value, first)}`,
            note:
                before !== null && before > 0 && step.value < before
                    ? `Se pierde el ${formatShare(before - step.value, before)} del paso anterior`
                    : undefined,
        };
    });
}

export function DashboardView({ data }: { data: Dashboard }) {
    const { overview: o, funnel: f, chat, time, returning: back } = data;
    const tooLittle = o.visitors === 0 && o.readings === 0;
    return (
        <div className="flex flex-col gap-6">
            {tooLittle && (
                <p className="rounded-xl border border-dashed p-4 text-muted-foreground text-sm">
                    Todavía no hay visitas registradas en este rango. Los datos
                    aparecen a medida que la gente usa la página.
                </p>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                <StatTile
                    label="Visitantes"
                    value={formatCount(o.visitors)}
                    detail={`${formatShare(o.quizStarters, o.visitors)} empieza el cuestionario`}
                />
                <StatTile
                    label="Lecturas creadas"
                    value={formatCount(o.readings)}
                    detail={`${formatShare(o.readings, o.visitors)} de los visitantes`}
                />
                <StatTile
                    label="Lecturas pagadas"
                    value={formatCount(o.paidReadings)}
                    detail={`${formatShare(o.paidReadings, o.readings)} de las lecturas · ${formatShare(o.paidReadings, o.visitors)} de los visitantes`}
                />
                <StatTile
                    label="Ingresos"
                    value={formatMoney(o.revenueCents, o.currency)}
                    detail={`${formatCount(o.payments)} pagos`}
                />
                <StatTile
                    label="Costo de la IA"
                    value={formatUsd(o.aiCostUsd)}
                    detail={`${formatUsd(data.costs.perPaidReadingUsd, 3)} por lectura pagada`}
                />
                <StatTile
                    label="Terminan la lectura pagada"
                    value={formatShare(f.finished, f.paid)}
                    detail={`${formatCount(f.finished)} de ${formatCount(f.paid)} llegan al final`}
                />
                <StatTile
                    label="Tiempo leyendo"
                    value={formatSeconds(time.paid.medianSeconds)}
                    detail={`mediana con la lectura pagada · gratis: ${formatSeconds(time.free.medianSeconds)}`}
                />
                <StatTile
                    label="Usan el chat"
                    value={formatShare(chat.chatted, chat.paidReadings)}
                    detail={`${chat.averageQuestions?.toFixed(1) ?? "—"} preguntas en promedio`}
                />
                <StatTile
                    label="Generar la lectura"
                    value={formatMs(data.latencies[0].p50)}
                    detail={`gratis (mediana) · completa: ${formatMs(data.latencies[1].p50)}`}
                />
                <StatTile
                    label="Vuelven otro día"
                    value={formatShare(back.returningVisitors, back.visitors)}
                    detail={`${formatShare(back.repeatBuyers, back.buyers)} de los que pagan compra otra vez`}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card
                    title="Del sitio al cuestionario"
                    note="Personas distintas (por navegador) en cada paso."
                >
                    <BarList
                        bars={funnel([
                            { label: "Visitaron la página", value: o.visitors },
                            {
                                label: "Empezaron el cuestionario",
                                value: o.quizStarters,
                            },
                            {
                                label: "Lo terminaron (dieron su fecha)",
                                value: o.quizFinishers,
                            },
                        ])}
                    />
                </Card>
                <Card
                    title="De la lectura al pago"
                    note="Lo que pasó con las lecturas creadas en este rango."
                >
                    <BarList
                        bars={funnel([
                            { label: "Lecturas creadas", value: f.created },
                            { label: "La abrieron", value: f.viewed },
                            {
                                label: "Llegaron al corte",
                                value: f.reachedDoor,
                            },
                            { label: "Tocaron «pagar»", value: f.clickedPay },
                            { label: "Pagaron", value: f.paid },
                            {
                                label: "Leyeron hasta el final",
                                value: f.finished,
                            },
                            {
                                label: "Le escribieron al Sol",
                                value: f.chatted,
                            },
                        ])}
                    />
                </Card>
            </div>

            <Card
                title="Día a día"
                note="Hora de Lima. Pasa el cursor sobre una barra para ver el número."
            >
                <div className="grid gap-6 md:grid-cols-3">
                    {(
                        [
                            ["visitors", "Visitantes", "visitantes"],
                            ["readings", "Lecturas creadas", "lecturas"],
                            ["payments", "Pagos", "pagos"],
                        ] as const
                    ).map(([key, title, unit]) => (
                        <div key={key} className="flex flex-col gap-2">
                            <h3 className="text-sm">{title}</h3>
                            <Columns
                                columns={data.daily.map((d) => ({
                                    key: d.day,
                                    value: d[key],
                                    title: `${formatWhen(`${d.day}T12:00:00-05:00`, false)}: ${formatCount(d[key])} ${unit}`,
                                }))}
                                first={formatWhen(
                                    `${data.daily[0]?.day}T12:00:00-05:00`,
                                    false,
                                )}
                                last="hoy"
                                label={(max) => `${formatCount(max)} ${unit}`}
                            />
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card
                    title="Hasta dónde leen"
                    note="Parte de la historia a la que llegó cada lectura. La gratis termina en el corte."
                >
                    {(
                        [
                            ["free", "Parte gratis"],
                            ["paid", "Lectura pagada"],
                        ] as const
                    ).map(([key, title]) => (
                        <div key={key} className="flex flex-col gap-2">
                            <h3 className="text-sm">
                                {title}{" "}
                                <span className="text-muted-foreground">
                                    ({formatCount(data.reach[key].total)}{" "}
                                    lecturas)
                                </span>
                            </h3>
                            <Columns
                                columns={data.reach[key].tenths.map((t) => ({
                                    key: t.label,
                                    value: t.readings,
                                    title: `Pasaron el ${t.label}: ${formatCount(t.readings)} (${formatShare(t.readings, data.reach[key].total)})`,
                                }))}
                                first="inicio"
                                last="final"
                                label={(max) => `${formatCount(max)} lecturas`}
                            />
                        </div>
                    ))}
                </Card>
                <Card
                    title="Dónde abandonan el cuestionario"
                    note="Personas que respondieron cada pregunta, desde las que empezaron."
                >
                    <BarList
                        bars={data.quizSteps.map((s) => ({
                            label: s.label,
                            value: s.visitors,
                            display: `${formatCount(s.visitors)} · ${formatShare(s.visitors, data.quizSteps[0].visitors)}`,
                        }))}
                    />
                </Card>
            </div>

            <h2 className="mt-2 font-semibold text-lg">Lo que responden</h2>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {data.rankings.map((r) => (
                    <Card
                        key={r.id}
                        title={r.question}
                        note={`Lo que ponen primero, de ${formatCount(r.total)} que ordenaron. Debajo, su puesto promedio (1 es lo más importante).`}
                    >
                        <BarList
                            bars={r.options.map((o) => ({
                                label: o.label,
                                value: o.first,
                                display: `${formatShare(o.first, r.total)} en 1.º`,
                                note:
                                    o.averagePlace === null
                                        ? undefined
                                        : `Puesto promedio: ${o.averagePlace.toFixed(1)}`,
                            }))}
                        />
                    </Card>
                ))}
                {data.questions.map((q) => (
                    <Card
                        key={q.id}
                        title={q.question}
                        note={`${formatCount(q.total)} respuestas`}
                    >
                        <BarList
                            bars={q.options.map((o) => ({
                                label: o.label,
                                value: o.count,
                                display: `${formatCount(o.count)} · ${formatShare(o.count, q.total)}`,
                            }))}
                        />
                    </Card>
                ))}
            </div>

            <h2 className="mt-2 font-semibold text-lg">El chat y la máquina</h2>
            <div className="grid gap-6 lg:grid-cols-3">
                <Card
                    title="Preguntas al Sol por lectura pagada"
                    note={`Mediana entre quienes escriben: ${chat.medianQuestions ?? "—"}.`}
                >
                    <BarList
                        bars={chat.buckets.map((b) => ({
                            label:
                                b.label === "Ninguna"
                                    ? "Ninguna"
                                    : `${b.label} ${b.label === "1" ? "pregunta" : "preguntas"}`,
                            value: b.readings,
                            display: `${formatCount(b.readings)} · ${formatShare(b.readings, chat.paidReadings)}`,
                        }))}
                    />
                </Card>
                <Card
                    title="Cuánto tarda en escribirse"
                    note="La mediana es lo normal; el p90, los casos lentos (1 de cada 10 tarda más)."
                >
                    <Table
                        head={["", "Mediana", "p90", "Veces"]}
                        rows={data.latencies.map((l) => [
                            l.label,
                            formatMs(l.p50),
                            formatMs(l.p90),
                            formatCount(l.count),
                        ])}
                    />
                </Card>
                <Card title="Costo de la IA por tarea">
                    <Table
                        head={["", "Costo", "Llamadas"]}
                        rows={data.costs.byPurpose.map((p) => [
                            PURPOSES[p.purpose] ?? p.purpose,
                            formatUsd(p.usd),
                            formatCount(p.calls),
                        ])}
                    />
                    <p className="text-muted-foreground text-xs">
                        Por lectura: {formatUsd(data.costs.perReadingUsd, 3)} ·
                        por lectura pagada:{" "}
                        {formatUsd(data.costs.perPaidReadingUsd, 3)}
                    </p>
                </Card>
            </div>

            <h2 className="mt-2 font-semibold text-lg">
                De dónde vienen y qué tocan
            </h2>
            <div className="grid gap-6 lg:grid-cols-3">
                <Card
                    title="Origen de las visitas"
                    note={`En celular o tablet: ${formatShare(data.devices.touch, data.devices.touch + data.devices.other)}.`}
                >
                    <BarList
                        bars={data.sources.map((s) => ({
                            label: s.source,
                            value: s.visitors,
                            display: `${formatCount(s.visitors)} · ${formatShare(s.visitors, o.visitors)}`,
                        }))}
                    />
                </Card>
                <Card title="Botones más tocados">
                    <Table
                        head={["Botón o enlace", "Toques", "Personas"]}
                        rows={data.clicks.map((c) => [
                            c.value,
                            formatCount(c.count),
                            formatCount(c.visitors),
                        ])}
                    />
                </Card>
                <Card
                    title="Errores en la página"
                    note="Lo que falló en el navegador de los visitantes."
                >
                    <Table
                        head={["Mensaje", "Veces"]}
                        rows={data.errors.map((e) => [
                            <span key={e.value} className="break-all">
                                {e.value}
                            </span>,
                            formatCount(e.count),
                        ])}
                        empty="Ningún error registrado"
                    />
                </Card>
            </div>
        </div>
    );
}
