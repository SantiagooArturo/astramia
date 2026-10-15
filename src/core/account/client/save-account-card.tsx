import Link from "next/link";
import { AccountForm } from "./account-form";

/** Anchor of "save it" links: the top notice scrolls here. */
export const SAVE_ACCOUNT_ANCHOR = "guardar";

/**
 * For an anonymous buyer: their reading lives in one browser's cookie until
 * they sign up (or in), which moves it into the account.
 */
export function SaveAccountCard({
    defaultEmail,
    title = "Guarda tu lectura en una cuenta",
}: {
    defaultEmail?: string | null;
    title?: string;
}) {
    return (
        <section
            id={SAVE_ACCOUNT_ANCHOR}
            aria-labelledby={`${SAVE_ACCOUNT_ANCHOR}-title`}
            className="flex scroll-mt-6 flex-col gap-4 rounded-2xl border border-astral-gold/30 bg-card/60 p-6"
        >
            <div>
                <h2
                    id={`${SAVE_ACCOUNT_ANCHOR}-title`}
                    className="font-display text-2xl"
                >
                    {title}
                </h2>
                <p className="mt-2 text-muted-foreground text-sm">
                    Ahora vive solo en este navegador. Con una cuenta la abres
                    desde cualquier celular o computadora, y no la pierdes si
                    borras el historial. Solo e-mail y contraseña.
                </p>
            </div>
            <AccountForm defaultEmail={defaultEmail ?? ""} />
        </section>
    );
}

/** Shown instead of the card once the reading belongs to an account. */
export function SavedInAccount({ email }: { email: string }) {
    return (
        <p className="rounded-xl border border-astral-ink bg-card/40 px-4 py-3 text-muted-foreground text-sm">
            Guardada en tu cuenta{" "}
            <span className="text-foreground">{email}</span>. La encuentras en{" "}
            <Link href="/lecturas" className="underline underline-offset-4">
                Mis lecturas
            </Link>{" "}
            desde cualquier dispositivo.
        </p>
    );
}

/** One line at the top of an anonymous reading, pointing at the card. */
export function SaveAccountNotice() {
    return (
        <p className="rounded-xl border border-astral-gold/30 bg-card/40 px-4 py-3 text-muted-foreground text-sm">
            Tu lectura está guardada solo en este navegador.{" "}
            <a
                href={`#${SAVE_ACCOUNT_ANCHOR}`}
                className="text-foreground underline underline-offset-4"
            >
                Crea tu cuenta para no perderla
            </a>
            .
        </p>
    );
}
