import { Elysia } from "elysia";
import { z } from "zod";
import { webhookParamsSchema } from "@/core/payment/domain/schemas";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { handleWebhookService } from "../../services/handle-webhook-service";

/**
 * Public endpoint each gateway posts to. The provider in the path picks the
 * adapter, so an old gateway's refunds keep arriving after a switch. Body is
 * read as raw text: some gateways sign the exact bytes.
 */
export const paymentWebhookRoute = new Elysia().post(
    "/webhooks/:provider",
    async ({ params, query, body, request, status }) => {
        const result = await handleWebhookService(params.provider, {
            headers: request.headers,
            query,
            rawBody: body,
        });
        if (!result.ok)
            return status(
                result.error.status as 401 | 500,
                errorToResponse(result.error),
            );
        return status(
            200,
            CommonResponse.successful({ response: result.data }),
        );
    },
    {
        parse: "text",
        params: webhookParamsSchema,
        query: z.record(z.string(), z.string().optional()),
        body: z.string(),
        response: {
            200: successResponseSchema(
                z.object({ handled: z.boolean() }),
                "PaymentWebhook",
            ),
            401: errorResponseSchema(401),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Payments"], summary: "Payment gateway webhook" },
    },
);
