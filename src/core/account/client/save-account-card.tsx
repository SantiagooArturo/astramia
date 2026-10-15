import Link from "next/link";
import { AccountForm } from "./account-form";

/** Anchor of "save it" links: the top link scrolls here. */
export const SAVE_ACCOUNT_ANCHOR = "guardar";

/**
 * For an anonymous buyer: their reading lives in one browser's cookie until
 * they sign up (or in), which moves it into the account. Kept small and
 * plain: it sits inside the reading, and most buyers aren't technical.
 */
export function SaveAccountCard({
    defaultEmail,
    title = "Guarda tu lectura",
}: {
    defaultEmail?: string | null;
    title?: string;
}) {
    return (
        <section
            id={SAVE_ACCOUNT_ANCHOR}
            aria-labelledby={`${SAVE_ACCOUNT_ANCHOR}-title`}
            className="flex scroll-mt-6 flex-col gap-4 rounded-2xl border border-astral-ink bg-card/40 p-5"
        >
            <div>
                <h2
                    id={`${SAVE_ACCOUNT_ANCHOR}-title`}
                    className="font-display text-xl"
                >
                    {title}
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                    Para volver a leerla cuando quieras, desde cualquier
                    celular.
                </p>
            </div>
            <AccountForm defaultEmail={defaultEmail} submitLabel="Guardar" />
        </section>
    );
}

/** Shown instead of the card once the reading belongs to an account. */
export function SavedInAccount({ email }: { email: string }) {
    return (
        <p className="text-muted-foreground text-sm">
            Guardada en tu cuenta ({email}). Para verla en otro celular, entra
            en{" "}
            <Link href="/lecturas" className="underline underline-offset-4">
                Mis lecturas
            </Link>
            .
        </p>
    );
}

/** A quiet link at the top of an anonymous reading, down to the card. */
export function SaveAccountNotice() {
    return (
        <a
            href={`#${SAVE_ACCOUNT_ANCHOR}`}
            className="w-fit font-mono text-[11px] text-astral-gold uppercase tracking-[0.18em] hover:underline"
        >
            Guardar mi lectura ↓
        </a>
    );
}
