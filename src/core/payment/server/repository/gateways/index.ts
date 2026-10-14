import "server-only";
import { ServerConfig } from "@/config/server-config";
import type { PaymentProvider } from "@/core/payment/domain/types";
import { mercadoPagoGateway } from "./mercadopago";
import type { PaymentGateway } from "./payment-gateway";

const GATEWAYS: Record<PaymentProvider, PaymentGateway> = {
    mercadopago: mercadoPagoGateway,
};

/** The gateway a given order/webhook belongs to. */
export function getPaymentGateway(provider: PaymentProvider): PaymentGateway {
    return GATEWAYS[provider];
}

/** The gateway new checkouts go through (`PAYMENT_PROVIDER`). */
export function getActivePaymentGateway(): PaymentGateway {
    return GATEWAYS[ServerConfig.payments.provider];
}
