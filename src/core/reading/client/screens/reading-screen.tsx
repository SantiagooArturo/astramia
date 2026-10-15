import { Suspense } from "react";
import { OFFER } from "@/core/landing/domain/content";
import { BUSINESS } from "@/core/legal/domain/business";
import { LEGAL_ROUTES } from "@/core/legal/domain/policies";
import { closingLine } from "@/core/reading/domain/story";
import type { ChatMessage, Reading } from "@/core/reading/domain/types";
import { ChartReveal } from "../components/chart-reveal";
import { ReadingChat } from "../components/reading-chat";
import { ReadingText } from "../components/reading-text";
import { RefreshWhile } from "../components/refresh-while";
import { UnlockButton } from "../components/unlock-button";
import { ReadingStory } from "../story/reading-story";
import { ReadingShell } from "./reading-shell";

/** Placeholder under the blur. Never the real reading: that stays on the server. */
const BLURRED_FILLER =
    "Venus no se mueve igual para todos. En tu carta marca un ritmo que explica por qué ciertas personas te atrapan desde la primera conversación, y por qué otras, que parecían seguras, se apagan sin aviso. Lo que se repite no es casualidad: tiene un origen y tiene una salida. Tu Luna habla de lo que necesitas para sentirte en casa con alguien, y ahí está la respuesta a tu pregunta. En los próximos meses";

export type PaymentState = "none" | "confirming" | "failed" | "review";

function Header({ reading }: { reading: Reading }) {
    return (
        <header className="flex flex-col gap-3">
            <p className="font-mono text-[11px] text-astral-gold uppercase tracking-[0.2em]">
                Lectura de amor · {reading.sunSign}
            </p>
            <h1 className="text-pretty font-display text-4xl sm:text-5xl">
                Lo que tu carta dice del amor
            </h1>
        </header>
    );
}

export function LockedReadingScreen({
    reading,
    payment,
}: {
    reading: Reading;
    payment: PaymentState;
}) {
    return (
        <ReadingShell>
            <Header reading={reading} />
            <ReadingText text={reading.teaser} />
            <div className="relative">
                <p
                    aria-hidden
                    className="select-none text-lg leading-relaxed blur-[6px]"
                >
                    {BLURRED_FILLER}
                </p>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-astral-gold/30 bg-card/60 p-6">
                {payment === "confirming" ? (
                    <>
                        <RefreshWhile />
                        <p className="font-display text-2xl">
                            Estamos confirmando tu pago…
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Suele tardar unos segundos. No cierres esta página.
                        </p>
                    </>
                ) : payment === "review" ? (
                    <>
                        <p className="font-display text-2xl">
                            Estamos revisando tu pago
                        </p>
                        <p
                            role="alert"
                            className="text-muted-foreground text-sm"
                        >
                            No pudimos confirmarlo automáticamente. No vuelvas a
                            pagar: escríbenos a{" "}
                            <a
                                href={`mailto:${BUSINESS.supportEmail}`}
                                className="underline underline-offset-4"
                            >
                                {BUSINESS.supportEmail}
                            </a>{" "}
                            con tu número de operación y lo resolvemos.
                        </p>
                    </>
                ) : (
                    <>
                        {payment === "failed" && (
                            <p
                                role="alert"
                                className="text-destructive text-sm"
                            >
                                El pago no se completó. No se te cobró nada;
                                puedes intentarlo otra vez.
                            </p>
                        )}
                        <p className="font-display text-2xl">
                            Tu lectura completa y {OFFER.chatHours} horas de
                            chat
                        </p>
                        <p className="text-muted-foreground text-sm">
                            {OFFER.price}, pago único. Sin suscripción.{" "}
                            <a
                                href={LEGAL_ROUTES.refunds}
                                className="underline underline-offset-4"
                            >
                                Política de reembolsos
                            </a>
                            .
                        </p>
                        <UnlockButton
                            readingId={reading.id}
                            label={`Desbloquear por ${OFFER.price}`}
                        />
                    </>
                )}
            </div>
        </ReadingShell>
    );
}

/** While the full text is written: their chart draws itself, as before. */
function WritingScreen({
    reading,
    notice,
    refresh = false,
}: {
    reading: Reading;
    notice?: React.ReactNode;
    /** The text is being written elsewhere: poll until it lands. */
    refresh?: boolean;
}) {
    return (
        <ReadingShell>
            {notice}
            <Header reading={reading} />
            <ReadingText text={reading.teaser} />
            {refresh && <RefreshWhile />}
            <WritingReading reading={reading} />
        </ReadingShell>
    );
}

export function UnlockedReadingScreen({
    reading,
    content,
    notice,
}: {
    reading: Reading;
    /** Streams in: the full text may still be being written. */
    content: React.ReactNode;
    /** Above the reading (e.g. "it only lives in this browser"). */
    notice?: React.ReactNode;
}) {
    return (
        <Suspense
            fallback={<WritingScreen reading={reading} notice={notice} />}
        >
            {content}
        </Suspense>
    );
}

/** Usually skipped: the text is written during checkout. Otherwise, their chart. */
export function WritingReading({ reading }: { reading: Reading }) {
    return (
        <div aria-busy>
            <ChartReveal
                chart={reading.chart}
                birthDate={reading.birthDate}
                mode="reading"
            />
        </div>
    );
}

export function ReadingBody({
    reading,
    messages,
    account,
    notice,
}: {
    reading: Reading;
    messages: ChatMessage[];
    /** Between the reading and the chat: save it in an account, or "saved". */
    account?: React.ReactNode;
    /** On the cover (e.g. "it only lives in this browser"). */
    notice?: React.ReactNode;
}) {
    if (!reading.content)
        return <WritingScreen reading={reading} notice={notice} refresh />;
    return (
        <ReadingStory
            reading={reading}
            content={reading.content}
            notice={notice}
            account={account}
            chat={
                <ReadingChat
                    readingId={reading.id}
                    initialMessages={messages}
                    expiresAt={reading.chatExpiresAt}
                    sunSign={reading.sunSign}
                    closing={closingLine(reading.content)}
                />
            }
        />
    );
}
