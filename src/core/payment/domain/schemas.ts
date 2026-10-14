import { z } from "zod";

/**
 * Gateways Astramia can charge through. Adding one = a new adapter under
 * `server/repository/gateways/` plus its name here; nothing else changes.
 */
export const paymentProviderSchema = z.enum(["mercadopago"]);

/** What can be bought. `referenceId` on the order points at the thing sold. */
export const productIdSchema = z.enum(["reading_unlock"]);

export const orderStatusSchema = z.enum([
    "pending",
    "paid",
    "failed",
    "refunded",
]);

/** Normalized payment state, whatever the gateway calls it. */
export const paymentStatusSchema = z.enum([
    "approved",
    "pending",
    "rejected",
    "refunded",
]);

/** ISO 4217, upper-case. */
export const currencySchema = z.string().length(3).toUpperCase();

export const priceSchema = z.object({
    /** Minor units (céntimos) so money never touches floats. */
    amountCents: z.number().int().positive(),
    currency: currencySchema,
});

/** Gateway-agnostic request to open a hosted checkout. */
export const checkoutRequestSchema = z.object({
    orderId: z.string(),
    productId: productIdSchema,
    title: z.string().min(1),
    price: priceSchema,
    payerEmail: z.email().optional(),
    successUrl: z.url(),
    failureUrl: z.url(),
    pendingUrl: z.url(),
    /** Omitted when the app isn't publicly reachable (local dev). */
    notificationUrl: z.url().optional(),
});

export const checkoutSessionSchema = z.object({
    /** The gateway's id for the checkout (e.g. Mercado Pago preference id). */
    providerRef: z.string(),
    checkoutUrl: z.url(),
});

/** A payment as the gateway reports it, mapped to our vocabulary. */
export const gatewayPaymentSchema = z.object({
    providerPaymentId: z.string(),
    /** Our order id, echoed back by the gateway. */
    orderId: z.string().nullable(),
    status: paymentStatusSchema,
    price: priceSchema,
    payerEmail: z.string().nullable(),
});

/** What a webhook delivery boils down to once verified. */
export const webhookResultSchema = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("invalid") }),
    z.object({ kind: z.literal("ignored") }),
    z.object({ kind: z.literal("payment"), providerPaymentId: z.string() }),
]);

export const orderSchema = z.object({
    id: z.string(),
    userId: z.string(),
    provider: paymentProviderSchema,
    productId: productIdSchema,
    referenceId: z.string(),
    price: priceSchema,
    status: orderStatusSchema,
    paidAt: z.string().nullable(),
    createdAt: z.string(),
});

export const checkoutResponseSchema = z.object({ checkoutUrl: z.url() });

export const webhookParamsSchema = z.object({
    provider: paymentProviderSchema,
});
