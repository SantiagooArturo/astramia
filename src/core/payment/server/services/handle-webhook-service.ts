import "server-only";
import type { PaymentProvider } from "@/core/payment/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { getPaymentGateway } from "../repository/gateways";
import type { WebhookDelivery } from "../repository/gateways/payment-gateway";
import { syncPaymentService } from "./sync-payment-service";

/** Verifies a gateway webhook and syncs the payment it points at. */
export async function handleWebhookService(
    provider: PaymentProvider,
    delivery: WebhookDelivery,
): AsyncAppResult<{ handled: boolean }> {
    const result = await getPaymentGateway(provider).parseWebhook(delivery);
    if (result.kind === "invalid") return err(AppErrors.unauthorized());
    if (result.kind === "ignored") return ok({ handled: false });

    const synced = await syncPaymentService(provider, result.providerPaymentId);
    if (synced.ok) return ok({ handled: true });
    // An amount mismatch is logged and won't fix itself on retry: acknowledge it.
    if (synced.error.code === "CONFLICT") return ok({ handled: false });
    return synced;
}
