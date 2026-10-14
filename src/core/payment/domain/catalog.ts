import type { OrderStatus, PaymentStatus, Price, ProductId } from "./types";

/**
 * Single source of what things cost. The landing reads its price from here,
 * so the number shown and the number charged can't drift.
 */
export const PRODUCTS = {
    reading_unlock: {
        title: "Lectura de amor + 2 horas de chat",
        // Soles: Mercado Pago Perú turns a USD price into PEN at its own rate
        // and reports the payment in PEN, so a USD order never matches it.
        price: { amountCents: 1990, currency: "PEN" },
    },
} as const satisfies Record<ProductId, { title: string; price: Price }>;

/** Non-breaking space keeps "S/ 19.90" on one line. */
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "US$",
    PEN: "S/\u00a0",
};

export function formatPrice({ amountCents, currency }: Price): string {
    const amount = (amountCents / 100).toFixed(2);
    const symbol = CURRENCY_SYMBOLS[currency];
    return symbol ? `${symbol}${amount}` : `${currency} ${amount}`;
}

/** The pieces of a price for layouts that size them apart ("S/" "19" ".90"). */
export function priceParts({ amountCents, currency }: Price) {
    return {
        symbol: (CURRENCY_SYMBOLS[currency] ?? currency).trim(),
        whole: String(Math.floor(amountCents / 100)),
        cents: String(amountCents % 100).padStart(2, "0"),
    };
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
