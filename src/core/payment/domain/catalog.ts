import type { OrderStatus, PaymentStatus, Price, ProductId } from "./types";

/**
 * Single source of what things cost. The landing reads its price from here,
 * so the number shown and the number charged can't drift.
 */
export const PRODUCTS = {
    reading_unlock: {
        title: "Lectura de amor + 2 horas de chat",
        price: { amountCents: 599, currency: "USD" },
    },
} as const satisfies Record<ProductId, { title: string; price: Price }>;

export function formatPrice({ amountCents, currency }: Price): string {
    const amount = (amountCents / 100).toFixed(2);
    return currency === "USD" ? `US$${amount}` : `${currency} ${amount}`;
}

/** Maps a gateway's payment state onto what the order should become. */
export function orderStatusFor(status: PaymentStatus): OrderStatus {
    switch (status) {
        case "approved":
            return "paid";
        case "pending":
            return "pending";
        case "rejected":
            return "failed";
        case "refunded":
            return "refunded";
    }
}

export function samePrice(a: Price, b: Price): boolean {
    return a.amountCents === b.amountCents && a.currency === b.currency;
}
