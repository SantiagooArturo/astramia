import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/frontend/lib/utils";

const SECTIONS = [
    { href: "/panel", label: "Resumen" },
    { href: "/panel/conversaciones", label: "Conversaciones" },
] as const;

const RANGES = [
    { key: "7", label: "7 días" },
    { key: "30", label: "30 días" },
    { key: "90", label: "90 días" },
    { key: "todo", label: "Todo" },
] as const;

/** The panel's frame: where you are, the range, and the way out to data. */
export function PanelShell({
    section,
    range,
    email,
    children,
}: {
    section: (typeof SECTIONS)[number]["href"];
    /** The selected range, when the page has one. */
    range?: string;
    email: string;
    children: ReactNode;
}) {
    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
            <header className="flex flex-col gap-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h1 className="font-semibold text-2xl">
                        Panel de Astramia
                    </h1>
                    <span className="text-muted-foreground text-sm">
                        {email}
                    </span>
                </div>
                <nav className="flex flex-wrap items-center gap-2 text-sm">
                    {SECTIONS.map((s) => (
                        <Link
                            key={s.href}
                            href={range ? `${s.href}?dias=${range}` : s.href}
                            className={cn(
                                "rounded-full border px-3 py-1",
                                s.href === section
                                    ? "border-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {s.label}
                        </Link>
                    ))}
                    <span className="mx-1 h-4 w-px bg-border" />
                    {range &&
                        RANGES.map((r) => (
                            <Link
                                key={r.key}
                                href={`${section}?dias=${r.key}`}
                                className={cn(
                                    "rounded-full px-3 py-1",
                                    r.key === range
                                        ? "bg-foreground text-background"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {r.label}
                            </Link>
                        ))}
                    <a
                        href={`/panel/exportar?que=conversaciones&dias=${range ?? "todo"}`}
                        className="ml-auto text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        Descargar conversaciones
                    </a>
                    <a
                        href={`/panel/exportar?que=eventos&dias=${range ?? "30"}`}
                        className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        Descargar eventos
                    </a>
                </nav>
            </header>
            {children}
        </main>
    );
}
