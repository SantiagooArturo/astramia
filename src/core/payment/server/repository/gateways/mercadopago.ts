import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ServerConfig } from "@/config/server-config";
import type { PaymentStatus } from "@/core/payment/domain/types";
import type { PaymentGateway, WebhookDelivery } from "./payment-gateway";

const API_URL = "https://api.mercadopago.com";

const preferenceResponseSchema = z.object({
    id: z.string(),
    init_point: z.url(),
});

const paymentResponseSchema = z.object({
    id: z.union([z.number(), z.string()]).transform(String),
    status: z.string(),
    external_reference: z.string().nullish(),
    transaction_amount: z.number(),
    currency_id: z.string(),
    payer: z.object({ email: z.string().nullish() }).nullish(),
});

/** Mercado Pago's payment states → ours. Unknown states stay pending. */
export function mapMercadoPagoStatus(status: string): PaymentStatus {
    switch (status) {
        case "approved":
            return "approved";
        case "rejected":
        case "cancelled":
            return "rejected";
        case "refunded":
        case "charged_back":
            return "refunded";
        default:
            return "pending";
    }
}

/**
 * Verifies the `x-signature` header: HMAC-SHA256 over
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` with the webhook secret.
 */
export function verifyMercadoPagoSignature(params: {
    secret: string;
    signature: string | null;
    requestId: string | null;
    dataId: string;
}): boolean {
    if (!params.signature) return false;
    const parts = Object.fromEntries(
        params.signature.split(",").map((part) => {
            const [key, ...rest] = part.trim().split("=");
            return [key, rest.join("=")];
        }),
    );
    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    let manifest = `id:${params.dataId.toLowerCase()};`;
    if (params.requestId) manifest += `request-id:${params.requestId};`;
    manifest += `ts:${ts};`;

    const expected = createHmac("sha256", params.secret)
        .update(manifest)
        .digest("hex");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(v1, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
}

function accessToken(): string {
    const token = ServerConfig.payments.mercadopago.accessToken;
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    return token;
}

async function call(path: string, init?: RequestInit): Promise<unknown> {
    const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${accessToken()}`,
            "Content-Type": "application/json",
            ...init?.headers,
        },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok)
        throw new Error(
            `Mercado Pago ${init?.method ?? "GET"} ${path} → ${res.status}: ${JSON.stringify(body)}`,
        );
    return body;
}

function dataIdOf(delivery: WebhookDelivery): string | null {
    const fromQuery = delivery.query["data.id"] ?? delivery.query.id;
    if (fromQuery) return fromQuery;
    try {
        const parsed = z
            .object({ data: z.object({ id: z.coerce.string() }) })
            .safeParse(JSON.parse(delivery.rawBody));
        return parsed.success ? parsed.data.data.id : null;
    } catch {
        return null;
    }
}

/** Checkout Pro adapter: hosted checkout + payment webhooks. */
export const mercadoPagoGateway: PaymentGateway = {
    provider: "mercadopago",

    async createCheckout(request) {
        const body = await call("/checkout/preferences", {
            method: "POST",
            headers: { "X-Idempotency-Key": request.orderId },
            body: JSON.stringify({
                items: [
                    {
                        id: request.productId,
                        title: request.title,
                        quantity: 1,
                        unit_price: request.price.amountCents / 100,
                        currency_id: request.price.currency,
                    },
                ],
                external_reference: request.orderId,
                payer: request.payerEmail
                    ? { email: request.payerEmail }
                    : undefined,
                back_urls: {
                    success: request.successUrl,
                    failure: request.failureUrl,
                    pending: request.pendingUrl,
                },
                auto_return: "approved",
                notification_url: request.notificationUrl,
                statement_descriptor: "ASTRAMIA",
            }),
        });
        const preference = preferenceResponseSchema.parse(body);
        return {
            providerRef: preference.id,
            checkoutUrl: preference.init_point,
        };
    },

    async parseWebhook(delivery) {
        const secret = ServerConfig.payments.mercadopago.webhookSecret;
        const dataId = dataIdOf(delivery);
        // Fail closed: without a secret nothing can be authenticated.
        if (!secret || !dataId) return { kind: "invalid" };

        const valid = verifyMercadoPagoSignature({
            secret,
            signature: delivery.headers.get("x-signature"),
            requestId: delivery.headers.get("x-request-id"),
            dataId,
        });
        if (!valid) return { kind: "invalid" };

        const topic = delivery.query.type ?? delivery.query.topic;
        if (topic !== "payment") return { kind: "ignored" };
        return { kind: "payment", providerPaymentId: dataId };
    },

    parseReturn(query) {
        return query.payment_id ?? query.collection_id ?? null;
    },

    async fetchPayment(providerPaymentId) {
        const body = await call(
            `/v1/payments/${encodeURIComponent(providerPaymentId)}`,
        );
        const payment = paymentResponseSchema.parse(body);
        return {
            providerPaymentId: payment.id,
            orderId: payment.external_reference ?? null,
            status: mapMercadoPagoStatus(payment.status),
            price: {
                amountCents: Math.round(payment.transaction_amount * 100),
                currency: payment.currency_id.toUpperCase(),
            },
            payerEmail: payment.payer?.email ?? null,
        };
    },
};
