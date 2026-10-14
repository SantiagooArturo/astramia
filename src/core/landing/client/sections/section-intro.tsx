import type { ReactNode } from "react";
import { cn } from "@/frontend/lib/utils";

interface SectionIntroProps {
    /** Running section number, "01", "02"… printed as marginalia. */
    index: string;
    label: string;
    title: ReactNode;
    description?: ReactNode;
    className?: string;
    /** Narrower title column for sections that sit beside content. */
    compact?: boolean;
}

/**
 * Left-aligned, editorial section opener: a numbered mono rule on the
 * left, the serif title on the right. No pills, no centering.
 */
export function SectionIntro({
    index,
    label,
    title,
    description,
    className,
    compact,
}: SectionIntroProps) {
    return (
        <div
            className={cn(
                "grid gap-5",
                compact ? "" : "md:grid-cols-12 md:gap-8",
                className,
            )}
        >
            <p
                className={cn(
                    "flex items-center gap-3 font-mono text-[11px] text-astral-gold/80 uppercase tracking-[0.24em]",
                    compact ? "" : "md:col-span-3 md:items-start md:pt-3",
                )}
            >
                <span>{index}</span>
                <span
                    aria-hidden
                    className={cn(
                        "h-px bg-astral-ink",
                        compact ? "w-8" : "w-8 md:mt-[0.45em] md:flex-1",
                    )}
                />
                <span>{label}</span>
            </p>
            <div
                className={cn(
                    "flex max-w-2xl flex-col gap-4",
                    compact ? "" : "md:col-span-9",
                )}
            >
                <h2 className="text-balance font-display text-4xl leading-[1.02] sm:text-5xl md:text-6xl">
                    {title}
                </h2>
                {description && (
                    <p className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
