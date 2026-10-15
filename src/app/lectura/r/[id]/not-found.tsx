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
                No encontramos tu lectura aquí
            </h1>
            <div className="flex flex-col gap-4 text-muted-foreground">
                <p>
                    Si la guardaste, entra y la verás aquí. Si no, ábrela desde
                    el mismo lugar donde hiciste el cuestionario (por ejemplo,
                    desde Instagram o TikTok).
                </p>
                <p>
                    ¿Pagaste y no la encuentras? Escríbenos a{" "}
                    <a
                        href={`mailto:${BUSINESS.supportEmail}`}
                        className="text-foreground underline underline-offset-4"
                    >
                        {BUSINESS.supportEmail}
                    </a>{" "}
                    y te ayudamos. No vuelvas a pagar.
                </p>
            </div>
            <section className="flex flex-col gap-4 rounded-2xl border border-astral-ink bg-card/40 p-5">
                <h2 className="font-display text-xl">Entrar</h2>
                <AccountForm reload signInOnly />
            </section>
            <Button asChild variant="outline" className="w-fit rounded-full">
                <Link href="/">Ir al inicio</Link>
            </Button>
        </ReadingShell>
    );
}
