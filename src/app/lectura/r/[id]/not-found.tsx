import Link from "next/link";
import { AccountForm } from "@/core/account/client/account-form";
import { BUSINESS } from "@/core/legal/domain/business";
import { ReadingShell } from "@/core/reading/client/screens/reading-shell";
import { Button } from "@/frontend/components/ui/button";

/**
 * A reading belongs to the browser that took the quiz (anonymous session),
 * or to the account it was saved in. Opened anywhere else without signing in
 * (another phone, an in-app browser, back from the Mercado Pago app) it can't
 * be shown: offer to sign in, and say how to get it back otherwise.
 */
export default function ReadingNotFound() {
    return (
        <ReadingShell>
            <h1 className="text-pretty font-display text-3xl sm:text-4xl">
                No vemos esta lectura en este navegador
            </h1>
            <div className="flex flex-col gap-4 text-muted-foreground">
                <p>
                    Si la guardaste en una cuenta, inicia sesión y te la
                    mostramos aquí. Si no, se guarda en el navegador donde
                    hiciste el cuestionario: ábrela desde ahí (si llegaste desde
                    Instagram, TikTok o la app de Mercado Pago, prueba con ese
                    mismo navegador).
                </p>
                <p>
                    Si ya pagaste y no la encuentras, escríbenos a{" "}
                    <a
                        href={`mailto:${BUSINESS.supportEmail}`}
                        className="text-foreground underline underline-offset-4"
                    >
                        {BUSINESS.supportEmail}
                    </a>{" "}
                    con tu número de operación y te la recuperamos. No vuelvas a
                    pagar.
                </p>
            </div>
            <section className="flex flex-col gap-4 rounded-2xl border border-astral-ink bg-card/40 p-6">
                <h2 className="font-display text-2xl">Inicia sesión</h2>
                <AccountForm initialMode="signIn" reload signInOnly />
            </section>
            <Button asChild variant="outline" className="w-fit rounded-full">
                <Link href="/">Ir al inicio</Link>
            </Button>
        </ReadingShell>
    );
}
