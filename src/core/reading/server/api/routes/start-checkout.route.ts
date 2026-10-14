import { Elysia } from "elysia";
import { checkoutResponseSchema } from "@/core/payment/domain/schemas";
import { readingIdParamsSchema } from "@/core/reading/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { startReadingCheckoutService } from "../../services/start-reading-checkout-service";

export const startCheckoutRoute = new Elysia().use(authed).post(
    "/:id/checkout",
    async ({ user, params, status }) => {
        const result = await startReadingCheckoutService(user, params.id);
        if (!result.ok)
            return status(
                result.error.status as 404 | 409 | 500,
                errorToResponse(result.error),
            );
        return status(
            200,
            CommonResponse.successful({ response: result.data }),
        );
    },
    {
        authed: true,
        params: readingIdParamsSchema,
        response: {
            200: successResponseSchema(checkoutResponseSchema, "Checkout"),
            404: errorResponseSchema(404),
            409: errorResponseSchema(409),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Readings"], summary: "Open the unlock checkout" },
    },
);
