import type { z } from "zod";
import type {
    checkoutRequestSchema,
    checkoutResponseSchema,
    checkoutSessionSchema,
    gatewayPaymentSchema,
    orderSchema,
    orderStatusSchema,
    paymentProviderSchema,
    paymentStatusSchema,
    priceSchema,
    productIdSchema,
    webhookResultSchema,
} from "./schemas";

export type PaymentProvider = z.infer<typeof paymentProviderSchema>;
export type ProductId = z.infer<typeof productIdSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type Price = z.infer<typeof priceSchema>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;
export type GatewayPayment = z.infer<typeof gatewayPaymentSchema>;
export type WebhookResult = z.infer<typeof webhookResultSchema>;
export type Order = z.infer<typeof orderSchema>;
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
