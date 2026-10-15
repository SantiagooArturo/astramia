import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Starfield } from "@/core/landing/client/effects";
import { AstramiaLogo } from "@/core/landing/client/sections/astramia-logo";

/** Astral backdrop + logo for every step after the landing. */
export function ReadingShell({ children }: PropsWithChildren) {
    return (
        <div className="theme-astral relative min-h-svh overflow-x-clip bg-background text-foreground">
            <Starfield />
            <div className="relative z-10 mx-auto flex max-w-2xl flex-col gap-10 px-4 py-6 sm:px-6 sm:py-10">
                <nav className="flex items-center justify-between gap-4">
                    <Link
                        href="/"
                        aria-label="Astramia AI, inicio"
                        className="w-fit"
                    >
                        <AstramiaLogo />
                    </Link>
                    <Link
                        href="/lecturas"
                        className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.16em] hover:text-foreground"
                    >
                        Mis lecturas
                    </Link>
                </nav>
                <main className="flex flex-col gap-10 pb-16">{children}</main>
            </div>
        </div>
    );
}
