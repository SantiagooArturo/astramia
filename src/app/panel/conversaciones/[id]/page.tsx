import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/core/analytics/client/panel/charts";
import { PanelGate } from "@/core/analytics/client/panel/panel-gate";
import { PanelShell } from "@/core/analytics/client/panel/panel-shell";
import { formatWhen } from "@/core/analytics/domain/format";
import { readingDetail } from "@/core/analytics/server/repository/dashboard";
import { panelAccess } from "@/core/analytics/server/services/panel-access";
import { describeAnswer } from "@/core/reading/domain/quiz";
import { parseTexts } from "@/core/reading/domain/reading-content";
import { quizAnswerSchema } from "@/core/reading/domain/schemas";

export const dynamic = "force-dynamic";

/** A stored part of the reading as its scenes, or the old single text. */
function scenesOf(text: string | null): [string, string][] {
    if (!text) return [];
    const scenes = parseTexts(text);
    return scenes
        ? Object.entries(scenes).map(([id, t]) => [id, String(t)])
        : [["texto", text]];
}

/** One reading, whole: what they answered, the chat, and their path. */
export default async function ConversationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const access = await panelAccess();
    if (!access) notFound();
    if (access.kind !== "open") return <PanelGate access={access} />;

    const reading = await readingDetail((await params).id);
    if (!reading) notFound();
    const answers = quizAnswerSchema.array().catch([]).parse(reading.answers);

    return (
        <PanelShell section="/panel/conversaciones" email={access.email}>
            <Link
                href="/panel/conversaciones"
                className="text-muted-foreground text-sm hover:text-foreground"
            >
                ← Todas las conversaciones
            </Link>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <Card
                    title={`Chat · ${reading.messages.filter((m) => m.role === "user").length} preguntas`}
                >
                    {reading.messages.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No le escribió al Sol.
                        </p>
                    ) : (
                        <ol className="flex flex-col gap-3">
                            {reading.messages.map((m) => (
                                <li
                                    key={`${m.at}-${m.role}`}
                                    className={
                                        m.role === "user"
                                            ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-muted px-4 py-2"
                                            : "max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-2"
                                    }
                                >
                                    <p className="whitespace-pre-wrap text-sm">
                                        {m.content}
                                    </p>
                                    <p className="mt-1 text-muted-foreground text-xs">
                                        {m.role === "user" ? "Persona" : "Sol"}{" "}
                                        · {formatWhen(m.at)}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    )}
                </Card>
                <div className="flex flex-col gap-6">
                    <Card title="La lectura">
                        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                            <dt className="text-muted-foreground">Creada</dt>
                            <dd>{formatWhen(reading.createdAt)}</dd>
                            <dt className="text-muted-foreground">Pagada</dt>
                            <dd>
                                {reading.unlockedAt
                                    ? formatWhen(reading.unlockedAt)
                                    : "No"}
                            </dd>
                            <dt className="text-muted-foreground">Signo</dt>
                            <dd>{reading.sunSign}</dd>
                            <dt className="text-muted-foreground">Nació</dt>
                            <dd>
                                {reading.birthDate}
                                {reading.birthTime
                                    ? ` · ${reading.birthTime}`
                                    : ""}
                                {reading.birthPlace
                                    ? ` · ${reading.birthPlace}`
                                    : ""}
                            </dd>
                            <dt className="text-muted-foreground">Cuenta</dt>
                            <dd>
                                {reading.anonymous ? "Anónima" : "Con correo"}
                            </dd>
                        </dl>
                    </Card>
                    <Card
                        title="Lo que le dijo la lectura"
                        note="Para comparar con lo que preguntó después."
                    >
                        {(
                            [
                                ["Parte gratis", reading.teaser],
                                ["Parte pagada", reading.content],
                            ] as const
                        ).map(([title, text]) => (
                            <details key={title} className="text-sm">
                                <summary className="cursor-pointer">
                                    {title}
                                    {text ? "" : " (no escrita)"}
                                </summary>
                                <div className="mt-2 flex flex-col gap-3">
                                    {scenesOf(text).map(([scene, body]) => (
                                        <div key={scene}>
                                            <p className="text-muted-foreground text-xs">
                                                {scene}
                                            </p>
                                            <p className="whitespace-pre-wrap">
                                                {body}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        ))}
                    </Card>
                    <Card title="Sus respuestas">
                        <ol className="flex flex-col gap-2 text-sm">
                            {answers.map((a) => {
                                const said = describeAnswer(a, answers);
                                return (
                                    <li key={a.questionId}>
                                        <p className="text-muted-foreground">
                                            {said?.question ?? a.questionId}
                                        </p>
                                        <p>{said?.answer ?? "—"}</p>
                                    </li>
                                );
                            })}
                        </ol>
                    </Card>
                    <Card
                        title="Su recorrido"
                        note="Lo que hizo en la página con esta lectura, en orden."
                    >
                        <ol className="flex max-h-96 flex-col gap-1 overflow-y-auto text-xs">
                            {reading.timeline.map((e, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="shrink-0 text-muted-foreground tabular-nums">
                                        {formatWhen(e.at)}
                                    </span>
                                    <span className="font-medium">
                                        {e.name}
                                    </span>
                                    <span className="min-w-0 break-all text-muted-foreground">
                                        {e.props ? JSON.stringify(e.props) : ""}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </Card>
                </div>
            </div>
        </PanelShell>
    );
}
