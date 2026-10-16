import type { ReactNode } from "react";
import { cn } from "@/frontend/lib/utils";

/**
 * The panel's few chart pieces, plain HTML: one data color (a single
 * series never needs a legend), thin bars with a rounded data end, values
 * in text colors, a native tooltip on every mark.
 */

export function Card({
    title,
    note,
    children,
    className,
}: {
    title: string;
    /** One line on how to read it. */
    note?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                "flex flex-col gap-4 rounded-xl border bg-card p-5",
                className,
            )}
        >
            <header>
                <h2 className="font-semibold text-base">{title}</h2>
                {note && (
                    <p className="mt-1 text-muted-foreground text-sm">{note}</p>
                )}
            </header>
            {children}
        </section>
    );
}

export function StatTile({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className="font-semibold text-2xl">{value}</span>
            {detail && (
                <span className="text-muted-foreground text-xs leading-snug">
                    {detail}
                </span>
            )}
        </div>
    );
}

export interface Bar {
    label: string;
    value: number;
    /** What's written at its end: a count, a share, both. */
    display: string;
    /** The tooltip; the label and display by default. */
    title?: string;
    /** A second, quieter line under the label. */
    note?: string;
}

/** Horizontal bars, longest = the largest value: label above, bar below. */
export function BarList({ bars, max }: { bars: Bar[]; max?: number }) {
    const top = max ?? Math.max(0, ...bars.map((b) => b.value));
    return (
        <ul className="flex flex-col gap-3">
            {bars.map((bar) => (
                <li
                    key={bar.label}
                    title={bar.title ?? `${bar.label}: ${bar.display}`}
                >
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span>{bar.label}</span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                            {bar.display}
                        </span>
                    </div>
                    <div className="mt-1 h-2.5 w-full">
                        <div
                            className="h-full rounded-r-[4px] bg-[var(--viz)]"
                            style={{
                                width: `${top > 0 ? (bar.value / top) * 100 : 0}%`,
                                minWidth: bar.value > 0 ? 2 : 0,
                            }}
                        />
                    </div>
                    {bar.note && (
                        <p className="mt-1 text-muted-foreground text-xs">
                            {bar.note}
                        </p>
                    )}
                </li>
            ))}
        </ul>
    );
}

export interface Column {
    key: string;
    value: number;
    title: string;
}

/** Columns over time or position, with the first and last tick under them. */
export function Columns({
    columns,
    first,
    last,
    label,
}: {
    columns: Column[];
    first: string;
    last: string;
    /** What the tallest column is: "14 visitantes". */
    label: (max: number) => string;
}) {
    const max = Math.max(0, ...columns.map((c) => c.value));
    return (
        <figure className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">
                Máximo: {label(max)}
            </span>
            <div
                className="flex h-28 items-end gap-[2px] border-b"
                role="img"
                aria-label={columns.map((c) => c.title).join(", ")}
            >
                {columns.map((c) => (
                    <div
                        key={c.key}
                        title={c.title}
                        className="flex h-full min-w-0 flex-1 items-end justify-center"
                    >
                        <div
                            className="w-full max-w-6 rounded-t-[4px] bg-[var(--viz)]"
                            style={{
                                height: `${max > 0 ? (c.value / max) * 100 : 0}%`,
                                minHeight: c.value > 0 ? 2 : 0,
                            }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
                <span>{first}</span>
                <span>{last}</span>
            </div>
        </figure>
    );
}

/** A small table: the first column is text, the rest numbers. */
export function Table({
    head,
    rows,
    empty = "Sin datos todavía",
}: {
    head: string[];
    rows: ReactNode[][];
    empty?: string;
}) {
    if (!rows.length)
        return <p className="text-muted-foreground text-sm">{empty}</p>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b text-left text-muted-foreground">
                        {head.map((h, i) => (
                            <th
                                key={h}
                                className={cn(
                                    "py-2 pr-3 font-normal",
                                    i > 0 && "text-right",
                                )}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, r) => (
                        <tr key={r} className="border-b last:border-0">
                            {row.map((cell, i) => (
                                <td
                                    key={i}
                                    className={cn(
                                        "py-2 pr-3 align-top",
                                        i > 0 && "text-right tabular-nums",
                                    )}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
