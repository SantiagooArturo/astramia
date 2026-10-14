import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
    server: {
        // Optional while only the landing + legal pages are deployed.
        // TODO: make required again once auth/DB features ship.
        DATABASE_URL: z.url().optional(),
        BETTER_AUTH_SECRET: z.string().min(32).optional(),
        /** Which gateway new checkouts go through. Webhooks of every gateway keep working. */
        PAYMENT_PROVIDER: z.enum(["mercadopago"]).default("mercadopago"),
        MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
        /** "Clave secreta" of the webhook in Mercado Pago → Tus integraciones → Webhooks. */
        MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
        /** Vercel AI Gateway. On Vercel deployments OIDC replaces it. */
        AI_GATEWAY_API_KEY: z.string().optional(),
        AI_MODEL_TEASER: z.string().default("google/gemini-2.5-flash-lite"),
        AI_MODEL_READING: z.string().default("google/gemini-2.5-flash"),
        AI_MODEL_CHAT: z.string().default("google/gemini-2.5-flash"),
    },
    client: {
        NEXT_PUBLIC_APP_URL: z.url(),
    },
    runtimeEnv: {
        DATABASE_URL: process.env.DATABASE_URL,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
        PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER,
        MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
        MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
        AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
        AI_MODEL_TEASER: process.env.AI_MODEL_TEASER,
        AI_MODEL_READING: process.env.AI_MODEL_READING,
        AI_MODEL_CHAT: process.env.AI_MODEL_CHAT,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
    emptyStringAsUndefined: true,
});
