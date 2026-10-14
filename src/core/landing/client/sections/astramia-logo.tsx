import { cn } from "@/frontend/lib/utils";

export function AstramiaLogo({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex items-center gap-2", className)}>
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-6 text-astral-gold"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.4"
                />
                <path
                    d="M12 3.5 13.6 10.4 20.5 12 13.6 13.6 12 20.5 10.4 13.6 3.5 12 10.4 10.4Z"
                    fill="currentColor"
                />
            </svg>
            <span className="font-display text-2xl tracking-tight">
                Astramia <span className="text-astral-gold italic">AI</span>
            </span>
        </span>
    );
}
