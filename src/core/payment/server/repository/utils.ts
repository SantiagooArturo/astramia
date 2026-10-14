import type {
    Order,
    PaymentProvider,
    ProductId,
} from "@/core/payment/domain/types";
import type { OrderRow } from "@/server/drizzle/schemas/payment-schema";

export function toOrder(row: OrderRow): Order {
    return {
        id: row.id,
        userId: row.userId,
        provider: row.provider as PaymentProvider,
        productId: row.productId as ProductId,
        referenceId: row.referenceId,
        price: { amountCents: row.amountCents, currency: row.currency },
        status: row.status,
        paidAt: row.paidAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
    };
}
