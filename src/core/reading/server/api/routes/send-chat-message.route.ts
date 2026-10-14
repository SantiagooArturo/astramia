import { Elysia } from "elysia";
import {
    chatTurnSchema,
    readingIdParamsSchema,
} from "@/core/reading/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    errorResponseSchema,
    errorToResponse,
} from "@/server/common/responses";
import { sendChatMessageService } from "../../services/chat-services";

/** Streams the reply as an AI SDK UI message stream (read by `useChat`). */
export const sendChatMessageRoute = new Elysia().use(authed).post(
    "/:id/chat",
    async ({ user, params, body, status }) => {
        const result = await sendChatMessageService(
            user.id,
            params.id,
            body.text,
        );
        if (!result.ok)
            return status(
                result.error.status as 403 | 404 | 409 | 429 | 500,
                errorToResponse(result.error),
            );
        return result.data.toUIMessageStreamResponse();
    },
    {
        authed: true,
        params: readingIdParamsSchema,
        body: chatTurnSchema,
        response: {
            403: errorResponseSchema(403),
            404: errorResponseSchema(404),
            409: errorResponseSchema(409),
            429: errorResponseSchema(429),
            500: errorResponseSchema(500),
        },
        detail: { tags: ["Readings"], summary: "Ask the reading's chat" },
    },
);
