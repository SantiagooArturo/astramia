import { env } from "@/config/env";

export const ServerConfig = {
    databaseURL: env.DATABASE_URL,
    baseUrl: env.NEXT_PUBLIC_APP_URL,
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    payments: {
        provider: env.PAYMENT_PROVIDER,
        mercadopago: {
            accessToken: env.MERCADOPAGO_ACCESS_TOKEN,
            webhookSecret: env.MERCADOPAGO_WEBHOOK_SECRET,
        },
    },
    ai: {
        models: {
            teaser: env.AI_MODEL_TEASER,
            reading: env.AI_MODEL_READING,
            chat: env.AI_MODEL_CHAT,
        },
    },
    info: {
        name: "Astramia API",
        version: "1.0.0",
        description: "Astramia API",
    },
    /** Single sanctioned read of the Node built-in. */
    isProduction: process.env.NODE_ENV === "production",
    isDevelopment: process.env.NODE_ENV === "development",
} as const;
