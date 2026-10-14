import "server-only";
import { after } from "next/server";
import type { CheckoutResponse } from "@/core/payment/domain/types";
import { createCheckoutService } from "@/core/payment/server/services/create-checkout-service";
import { AppErrors, type AsyncAppResult, err } from "@/server/common/responses";
import { findReading } from "../repository/readings";
import { prepareReadingContentService } from "./ensure-reading-content-service";

/** Opens the checkout that unlocks one of the caller's own locked readings. */
export async function startReadingCheckoutService(
    user: { id: string; email: string; isAnonymous?: boolean | null },
    readingId: string,
): AsyncAppResult<CheckoutResponse> {
    try {
        const row = await findReading(user.id, readingId);
        if (!row) return err(AppErrors.notFound({ targets: ["reading"] }));
        if (row.unlockedAt)
            return err(AppErrors.conflict({ targets: ["reading"] }));

        const checkout = await createCheckoutService({
            userId: user.id,
            productId: "reading_unlock",
            referenceId: row.id,
            returnPath: `/lectura/r/${row.id}`,
            // Anonymous accounts carry a placeholder address; let the gateway ask.
            payerEmail: user.isAnonymous ? undefined : user.email,
        });
        // Start writing while they pay: the checkout hides the model's ~30 s.
        if (checkout.ok)
            after(() => prepareReadingContentService(user.id, row.id));
        return checkout;
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
