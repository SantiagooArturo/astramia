import "server-only";
import { ServerConfig } from "@/config/server-config";
import { PRODUCTS } from "@/core/payment/domain/catalog";
import type { CheckoutResponse, ProductId } from "@/core/payment/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { getActivePaymentGateway } from "../repository/gateways";
import { createOrder, setOrderProviderRef } from "../repository/orders";

/**
 * Opens a hosted checkout for `productId` and returns where to send the buyer.
 * The buyer comes back to `returnPath` with `?checkout=<provider>` plus
 * whatever the gateway appends; that page calls `syncCheckoutReturnService`.
 */
export async function createCheckoutService(input: {
    userId: string;
    productId: ProductId;
    referenceId: string;
    returnPath: string;
    payerEmail?: string;
}): AsyncAppResult<CheckoutResponse> {
    const gateway = getActivePaymentGateway();
    const product = PRODUCTS[input.productId];
    try {
        const order = await createOrder({
            userId: input.userId,
            provider: gateway.provider,
            productId: input.productId,
            referenceId: input.referenceId,
            amountCents: product.price.amountCents,
            currency: product.price.currency,
        });

        const returnUrl = new URL(input.returnPath, ServerConfig.baseUrl);
        returnUrl.searchParams.set("checkout", gateway.provider);
        const webhookUrl = new URL(
            `/api/v1/payments/webhooks/${gateway.provider}`,
            ServerConfig.baseUrl,
        );

        const session = await gateway.createCheckout({
            orderId: order.id,
            productId: input.productId,
            title: product.title,
            price: product.price,
            payerEmail: input.payerEmail,
            successUrl: returnUrl.toString(),
            failureUrl: returnUrl.toString(),
            pendingUrl: returnUrl.toString(),
            // Gateways can't reach localhost; the return page syncs instead.
            notificationUrl:
                webhookUrl.protocol === "https:"
                    ? webhookUrl.toString()
                    : undefined,
        });
        await setOrderProviderRef(order.id, session.providerRef);
        return ok({ checkoutUrl: session.checkoutUrl });
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
