import { env } from "@/config/env";

/** The app's origin and its www/apex twin: the host serves one and redirects the other. */
function withWwwTwin(url: string): [string, string] {
    const { protocol, host } = new URL(url);
    const twin = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
    return [`${protocol}//${host}`, `${protocol}//${twin}`];
}

export const ServerConfig = {
    databaseURL: env.DATABASE_URL,
    baseUrl: env.NEXT_PUBLIC_APP_URL,
    /** Origins the browser may call from; the first is the configured one. */
    appOrigins: withWwwTwin(env.NEXT_PUBLIC_APP_URL),
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
            fallback: env.AI_MODEL_FALLBACK,
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

/**
 * The origin this request reached, when it's one of ours. Links the server
 * hands out (checkout return, webhooks) use it, so they never go through the
 * apex↔www redirect: a gateway's webhook POST doesn't follow it.
 */
export function requestOrigin(request: Request): string {
    const { origin } = new URL(request.url);
    return ServerConfig.appOrigins.includes(origin)
        ? origin
        : ServerConfig.appOrigins[0];
}
