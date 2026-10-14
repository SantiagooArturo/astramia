import "server-only";
import type { Order, ProductId } from "@/core/payment/domain/types";
import { unlockReadingService } from "@/core/reading/server/services/unlock-reading-service";

/**
 * What each product grants once its order is paid. The only place payments
 * know about the rest of the app. Every handler must be idempotent: it runs
 * again on each re-sync of a paid order.
 */
const FULFILLMENTS: Record<ProductId, (order: Order) => Promise<unknown>> = {
    reading_unlock: (order) =>
        unlockReadingService(order.userId, order.referenceId),
};

export async function fulfillOrder(order: Order): Promise<void> {
    await FULFILLMENTS[order.productId](order);
}
