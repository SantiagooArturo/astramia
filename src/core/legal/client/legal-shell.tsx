import type { PropsWithChildren } from "react";
import { Nebula } from "@/core/landing/client/effects";
import { SiteFooter } from "@/core/landing/client/sections/site-footer";
import { SiteHeader } from "@/core/landing/client/sections/site-header";

/** Landing chrome without the heavy effects — legal text must read calmly. */
export function LegalShell({ children }: PropsWithChildren) {
    return (
        <div className="theme-astral relative min-h-svh overflow-x-clip bg-background text-foreground">
            <Nebula />
            <div className="relative z-10">
                <SiteHeader />
                <main>{children}</main>
                <SiteFooter />
            </div>
        </div>
    );
}
