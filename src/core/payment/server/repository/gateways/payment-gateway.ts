import type {
    CheckoutRequest,
    CheckoutSession,
    GatewayPayment,
    PaymentProvider,
    WebhookResult,
} from "@/core/payment/domain/types";

/** Everything a webhook handler may need to verify a delivery. */
export interface WebhookDelivery {
    headers: Headers;
    query: Record<string, string | undefined>;
    rawBody: string;
}

/**
 * The port every payment gateway implements. Services only ever talk to this,
 * so swapping Mercado Pago for another gateway is a new file next to
 * `mercadopago.ts` — services, routes and the database stay as they are.
 */
export interface PaymentGateway {
    readonly provider: PaymentProvider;
    /** Opens a hosted checkout and returns where to send the buyer. */
    createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
    /** Authenticates a webhook delivery and says which payment to re-sync. */
    parseWebhook(delivery: WebhookDelivery): Promise<WebhookResult>;
    /** Reads the payment id the gateway appends to the return URL, if any. */
    parseReturn(query: Record<string, string | undefined>): string | null;
    /** Source of truth: always re-read the payment instead of trusting a payload. */
    fetchPayment(providerPaymentId: string): Promise<GatewayPayment>;
}
