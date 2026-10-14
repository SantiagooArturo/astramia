import "server-only";
import { paymentProviderSchema } from "@/core/payment/domain/schemas";
import type { Order } from "@/core/payment/domain/types";
import { type AsyncAppResult, ok } from "@/server/common/responses";
import { getPaymentGateway } from "../repository/gateways";
import { syncPaymentService } from "./sync-payment-service";

/**
 * Called by the page the buyer lands on after the hosted checkout. Doesn't
 * wait for the webhook: it reads the payment id from the URL and syncs it.
 * Returns `null` when the URL carries no checkout return.
 */
export async function syncCheckoutReturnService(
    query: Record<string, string | undefined>,
): AsyncAppResult<{ order: Order | null } | null> {
    const provider = paymentProviderSchema.safeParse(query.checkout);
    if (!provider.success) return ok(null);

    const paymentId = getPaymentGateway(provider.data).parseReturn(query);
    if (!paymentId) return ok(null);

    return syncPaymentService(provider.data, paymentId);
}
