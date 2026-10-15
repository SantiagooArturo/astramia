import { Suspense } from "react";
import { OFFER } from "@/core/landing/domain/content";
import { BUSINESS } from "@/core/legal/domain/business";
import { LEGAL_ROUTES } from "@/core/legal/domain/policies";
import type { ChatMessage, Reading } from "@/core/reading/domain/types";
import { ReadingChat } from "../components/reading-chat";
import { RefreshWhile } from "../components/refresh-while";
import { UnlockButton } from "../components/unlock-button";
import { ReadingStory } from "../story/reading-story";

export type PaymentState = "none" | "confirming" | "failed" | "review";

/** Under the preview, in the story's own style. */
const BOX =
    "flex flex-col gap-4 rounded-2xl border border-astral-gold/30 bg-background/70 p-6 backdrop-blur-md";

/** Where the free part stops: the price, the button, or the payment's state. */
function UnlockBox({
    reading,
    payment,
}: {
    reading: Reading;
    payment: PaymentState;
}) {
    if (payment === "confirming")
        return (
            <div className={BOX}>
                <RefreshWhile />
                <p className="font-display text-2xl">
                    Estamos confirmando tu pago…
                </p>
                <p className="text-muted-foreground text-sm">
                    Suele tardar unos segundos. No cierres esta página.
                </p>
            </div>
        );
    if (payment === "review")
        return (
            <div className={BOX}>
                <p className="font-display text-2xl">
                    Estamos revisando tu pago
                </p>
                <p role="alert" className="text-muted-foreground text-sm">
                    No pudimos confirmarlo automáticamente. No vuelvas a pagar:
                    escríbenos a{" "}
                    <a
                        href={`mailto:${BUSINESS.supportEmail}`}
                        className="underline underline-offset-4"
                    >
                        {BUSINESS.supportEmail}
                    </a>{" "}
                    con tu número de operación y lo resolvemos.
                </p>
            </div>
        );
    return (
        <div className={BOX}>
            {payment === "failed" && (
                <p role="alert" className="text-destructive text-sm">
                    El pago no se completó. No se te cobró nada; puedes
                    intentarlo otra vez.
                </p>
            )}
            <p className="font-display text-2xl leading-tight">
                Tu lectura completa y {OFFER.chatHours} horas de chat con tu Sol
            </p>
            <UnlockButton
                readingId={reading.id}
                label={`Desbloquear por ${OFFER.price}`}
            />
            <p className="text-muted-foreground text-sm">
                Pago único. Sin suscripción.{" "}
                <a
                    href={LEGAL_ROUTES.refunds}
                    className="underline underline-offset-4"
                >
                    Política de reembolsos
                </a>
                .
            </p>
        </div>
    );
}

/** Before paying: the start of their story, up to the door. */
export function LockedReadingScreen({
    reading,
    payment,
}: {
    reading: Reading;
    payment: PaymentState;
}) {
    return (
        <ReadingStory
            reading={reading}
            door={<UnlockBox reading={reading} payment={payment} />}
        />
    );
}

/** Paid, still being written (usually done during checkout). */
export function WritingScreen({
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
        <ReadingStory
            reading={reading}
            notice={notice}
            door={
                <div className={BOX} aria-busy>
                    {refresh && <RefreshWhile />}
                    <p className="flex items-center gap-3 font-display text-2xl">
                        <span
                            aria-hidden
                            className="size-2.5 shrink-0 animate-pulse rounded-full bg-astral-gold"
                        />
                        Tu Sol está escribiendo tu lectura
                    </p>
                    <p className="text-muted-foreground text-sm">
                        Tarda unos segundos. Aparece aquí en cuanto esté lista.
                    </p>
                </div>
            }
        />
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

export function ReadingBody({
    reading,
    messages,
    account,
    notice,
}: {
    reading: Reading;
    messages: ChatMessage[];
    /** Below the chat, for a reading without an account: save it in one. */
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
                />
            }
        />
    );
}
