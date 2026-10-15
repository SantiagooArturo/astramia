import Link from "next/link";
import { BUSINESS } from "@/core/legal/domain/business";
import { ReadingShell } from "@/core/reading/client/screens/reading-shell";
import { Button } from "@/frontend/components/ui/button";

/**
 * A reading belongs to the browser that took the quiz (anonymous session).
 * Opened anywhere else (another phone, the app's in-app browser, after paying
 * in the Mercado Pago app) it can't be shown: say why and how to get it back.
 */
export default function ReadingNotFound() {
    return (
        <ReadingShell>
            <h1 className="text-pretty font-display text-3xl sm:text-4xl">
                No vemos esta lectura en este navegador
            </h1>
            <div className="flex flex-col gap-4 text-muted-foreground">
                <p>
                    Tu lectura se guarda en el navegador donde hiciste el
                    cuestionario. Ábrela desde ahí: si llegaste desde Instagram,
                    TikTok o la app de Mercado Pago, prueba con ese mismo
                    navegador.
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
            <Button asChild variant="outline" className="w-fit rounded-full">
                <Link href="/">Ir al inicio</Link>
            </Button>
        </ReadingShell>
    );
}
