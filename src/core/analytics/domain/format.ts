/** Numbers as the panel says them: short, Spanish, never a raw float. */

const count = new Intl.NumberFormat("es-PE");

export const formatCount = (n: number): string => count.format(n);

/** "38 %": a share of a whole; "—" when there's no whole. */
export function formatShare(part: number, whole: number): string {
    if (whole <= 0) return "—";
    const share = (part / whole) * 100;
    // A no-break space: "12 %" never splits across lines.
    return `${share < 10 && share > 0 ? share.toFixed(1) : Math.round(share)}\u00a0%`;
}

/** "45 s", "5 min 20 s", "1 h 3 min". */
export function formatSeconds(seconds: number | null): string {
    if (seconds === null) return "—";
    const s = Math.round(seconds);
    if (s < 60) return `${s} s`;
    if (s < 3600) {
        const rest = s % 60;
        return rest ? `${Math.floor(s / 60)} min ${rest} s` : `${s / 60} min`;
    }
    return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`;
}

export const formatMs = (ms: number | null): string =>
    ms === null ? "—" : formatSeconds(ms / 1000);

export function formatMoney(cents: number, currency: string | null): string {
    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: currency ?? "PEN",
    }).format(cents / 100);
}

export const formatUsd = (usd: number | null, digits = 2): string =>
    usd === null ? "—" : `US$ ${usd.toFixed(digits)}`;

/** A day or moment in Lima, the way the team reads it. */
export function formatWhen(iso: string, withTime = true): string {
    return new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        day: "numeric",
        month: "short",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    }).format(new Date(iso));
}
