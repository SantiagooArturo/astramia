import Link from "next/link";
import { BUSINESS, PAYMENT_PROCESSOR } from "@/core/legal/domain/business";
import { LEGAL_ROUTES } from "@/core/legal/domain/policies";
import { Separator } from "@/frontend/components/ui/separator";
import { OFFER } from "../../domain/content";
import { AstramiaLogo } from "./astramia-logo";

const LEGAL_LINKS = [
    { href: LEGAL_ROUTES.terms, label: "Términos y Condiciones" },
    { href: LEGAL_ROUTES.privacy, label: "Política de Privacidad" },
    { href: LEGAL_ROUTES.refunds, label: "Reembolsos" },
] as const;

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
                    <a
                        href={`mailto:${BUSINESS.supportEmail}`}
                        className="w-fit text-astral-gold text-sm underline-offset-4 hover:underline"
                    >
                        {BUSINESS.supportEmail}
                    </a>
                </div>
                <p className="max-w-md text-pretty text-muted-foreground text-xs leading-relaxed md:col-span-5">
                    Astramia es entretenimiento y autoconocimiento. Todas las
                    lecturas y respuestas del chat son generadas por
                    inteligencia artificial, sin intervención de personas. No
                    sustituye asesoría médica, psicológica, legal ni financiera.
                    Una lectura cuesta {OFFER.price}, una sola vez; el pago lo
                    procesa {PAYMENT_PROCESSOR}.
                </p>
                <nav
                    aria-label="Legal"
                    className="flex flex-col gap-2 md:col-span-3 md:items-end"
                >
                    {LEGAL_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
            <p className="mt-10 font-mono text-[11px] text-muted-foreground/70">
                © {new Date().getFullYear()} {BUSINESS.brand}
            </p>
        </footer>
    );
}
