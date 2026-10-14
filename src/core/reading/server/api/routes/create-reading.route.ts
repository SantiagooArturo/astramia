import { Elysia } from "elysia";
import {
    createdReadingSchema,
    createReadingSchema,
} from "@/core/reading/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    createdResponseSchema,
    errorResponseSchema,
    errorToResponse,
} from "@/server/common/responses";
import { createReadingService } from "../../services/create-reading-service";

export const createReadingRoute = new Elysia().use(authed).post(
    "/",
    async ({ user, body, status }) => {
        const result = await createReadingService(user.id, body);
        if (!result.ok)
            return status(
                result.error.status as 429 | 500,
                errorToResponse(result.error),
            );
        return status(201, CommonResponse.created({ response: result.data }));
    },
    {
        authed: true,
        body: createReadingSchema,
        response: {
            201: createdResponseSchema(createdReadingSchema, "Reading"),
            400: errorResponseSchema(400),
            429: errorResponseSchema(429),
            500: errorResponseSchema(500),
        },
        detail: {
            tags: ["Readings"],
            summary: "Start a reading (questionnaire → teaser)",
        },
    },
);
