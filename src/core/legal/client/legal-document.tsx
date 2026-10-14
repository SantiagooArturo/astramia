import type { ReactNode } from "react";
import { Separator } from "@/frontend/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/frontend/components/ui/table";
import { cn } from "@/frontend/lib/utils";

export interface LegalSection {
    id: string;
    title: string;
    content: ReactNode;
}

interface LegalDocumentProps {
    kicker: string;
    title: string;
    version: string;
    updatedAt: string;
    intro: ReactNode;
    sections: LegalSection[];
}

/**
 * Shared shell for legal pages: numbered table of contents + numbered
 * sections, so anchors (e.g. /terminos#reembolsos) stay stable.
 */
export function LegalDocument({
    kicker,
    title,
    version,
    updatedAt,
    intro,
    sections,
}: LegalDocumentProps) {
    return (
        <article className="mx-auto max-w-6xl px-4 pt-14 pb-24 sm:px-6 md:pt-20">
            <header className="flex max-w-3xl flex-col gap-5">
                <p className="font-mono text-[11px] text-astral-gold/80 uppercase tracking-[0.24em]">
                    {kicker}
                </p>
                <h1 className="text-balance font-display text-5xl leading-[1.02] sm:text-6xl">
                    {title}
                </h1>
                <p className="font-mono text-muted-foreground text-xs">
                    Versión {version} · Última actualización: {updatedAt}
                </p>
                <div className="text-pretty text-base text-muted-foreground leading-relaxed sm:text-lg">
                    {intro}
                </div>
            </header>

            <Separator className="my-12 bg-astral-ink" />

            <div className="grid gap-12 lg:grid-cols-12">
                <nav
                    aria-label="Contenido"
                    className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start"
                >
                    <p className="mb-4 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                        Contenido
                    </p>
                    <ol className="flex flex-col gap-2 text-sm">
                        {sections.map((section, i) => (
                            <li key={section.id}>
                                <a
                                    href={`#${section.id}`}
                                    className="flex gap-3 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <span className="w-6 shrink-0 font-mono text-astral-gold/70 text-xs leading-5">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    {section.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="flex min-w-0 flex-col gap-14 lg:col-span-8">
                    {sections.map((section, i) => (
                        <section
                            key={section.id}
                            id={section.id}
                            className="scroll-mt-24"
                        >
                            <h2 className="flex items-baseline gap-4 font-display text-3xl leading-tight">
                                <span className="font-mono text-astral-gold/80 text-sm">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                {section.title}
                            </h2>
                            <div className="mt-5 flex flex-col gap-4 text-pretty text-[15px] text-muted-foreground leading-relaxed [&_a]:text-astral-gold [&_a]:underline-offset-4 hover:[&_a]:underline [&_strong]:font-medium [&_strong]:text-foreground">
                                {section.content}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </article>
    );
}

export function SubClause({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="font-medium text-base text-foreground">{title}</h3>
            {children}
        </div>
    );
}

export function ClauseList({ items }: { items: ReactNode[] }) {
    return (
        <ul className="flex flex-col gap-2 pl-1">
            {items.map((item, i) => (
                <li key={i} className="flex gap-3">
                    <span aria-hidden className="text-astral-gold/70">
                        —
                    </span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

export function Callout({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "rounded-xl border border-astral-gold/30 bg-astral-gold/5 p-5 text-foreground",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function LegalTable({
    head,
    rows,
}: {
    head: string[];
    rows: ReactNode[][];
}) {
    return (
        <div className="rounded-xl border bg-card/40">
            <Table>
                <TableHeader>
                    <TableRow>
                        {head.map((cell) => (
                            <TableHead
                                key={cell}
                                className="whitespace-normal font-mono text-[11px] uppercase tracking-[0.14em]"
                            >
                                {cell}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, i) => (
                        <TableRow key={i}>
                            {row.map((cell, j) => (
                                <TableCell
                                    key={j}
                                    className="whitespace-normal align-top text-muted-foreground"
                                >
                                    {cell}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
