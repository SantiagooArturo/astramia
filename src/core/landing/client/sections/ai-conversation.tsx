import { DEMO_CONTEXT, OFFER } from "../../domain/content";
import { Reveal } from "../effects";
import { ChatDemo } from "./chat-demo";
import { SectionIntro } from "./section-intro";

const MEMORY = [
    { label: "Sol", value: DEMO_CONTEXT.sun },
    { label: "Venus", value: DEMO_CONTEXT.venus },
    { label: "Respuesta 2", value: DEMO_CONTEXT.answer },
] as const;

export function AiConversation() {
    return (
        <section
            id="conversacion"
            className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 md:py-28"
        >
            <Reveal>
                <SectionIntro
                    index="03"
                    label="El chat"
                    title={
                        <>
                            No es un informe.{" "}
                            <em className="text-astral-gold">
                                Es alguien que ya lo leyó.
                            </em>
                        </>
                    }
                    description={`Una carta astral en PDF se lee una vez. A esta se le pregunta durante ${OFFER.chatHours} horas, y responde con tu carta y tus palabras delante.`}
                />
            </Reveal>

            <div className="mt-12 grid items-start gap-10 lg:grid-cols-12">
                <Reveal className="lg:col-span-7">
                    <ChatDemo />
                </Reveal>

                <Reveal
                    delay={0.12}
                    className="flex flex-col gap-8 lg:col-span-5 lg:pt-6"
                >
                    <div>
                        <p className="font-mono text-[11px] text-astral-gold/80 uppercase tracking-[0.24em]">
                            Lo que el asistente tiene delante
                        </p>
                        <dl className="mt-4 divide-y divide-astral-ink border-astral-ink border-y font-mono text-sm">
                            {MEMORY.map(({ label, value }) => (
                                <div
                                    key={label}
                                    className="flex items-baseline gap-3 py-3"
                                >
                                    <dt className="shrink-0 text-muted-foreground">
                                        {label}
                                    </dt>
                                    <span
                                        aria-hidden
                                        className="mb-1 flex-1 border-astral-ink border-b border-dotted"
                                    />
                                    <dd className="text-right text-foreground">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <p className="text-pretty text-muted-foreground leading-relaxed">
                        Por eso no responde con el horóscopo de tu signo.
                        Responde con tu Venus, con lo que escribiste en el
                        cuestionario y con lo que ya te dijo en la lectura. Si
                        te quedó una duda a las once de la noche, la preguntas a
                        las once de la noche.
                    </p>

                    <p className="font-mono text-muted-foreground/70 text-xs leading-relaxed">
                        Las {OFFER.chatHours} horas empiezan con tu primera
                        pregunta. La lectura no se cierra nunca.
                    </p>
                </Reveal>
            </div>
        </section>
    );
}
