import { Separator } from "@/frontend/components/ui/separator";
import { OFFER } from "../../domain/content";
import { AstramiaLogo } from "./astramia-logo";

export function SiteFooter() {
    return (
        <footer className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6">
            <Separator className="bg-astral-ink" />
            <div className="mt-10 grid gap-8 md:grid-cols-12">
                <div className="flex flex-col gap-3 md:col-span-4">
                    <AstramiaLogo />
                    <p className="font-mono text-[11px] text-muted-foreground/70 uppercase tracking-[0.18em]">
                        Lecturas astrológicas con IA · Perú y LatAm
                    </p>
                </div>
                <p className="max-w-md text-pretty text-muted-foreground text-xs leading-relaxed md:col-span-5">
                    Astramia es entretenimiento y autoconocimiento generado con
                    inteligencia artificial. No sustituye asesoría médica,
                    psicológica, legal ni financiera. Una lectura cuesta{" "}
                    {OFFER.price}, una sola vez.
                </p>
                <p className="font-mono text-[11px] text-muted-foreground/70 md:col-span-3 md:text-right">
                    © {new Date().getFullYear()} Astramia AI
                </p>
            </div>
        </footer>
    );
}
