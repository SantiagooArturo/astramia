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
    google:
        env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
            ? {
                  clientId: env.GOOGLE_CLIENT_ID,
                  clientSecret: env.GOOGLE_CLIENT_SECRET,
              }
            : null,
    email: {
        resendApiKey: env.RESEND_API_KEY,
        from: env.EMAIL_FROM,
    },
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
            review: env.AI_MODEL_REVIEW,
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
    /** The live site; Vercel previews and local builds aren't. */
    isLiveSite: env.VERCEL_ENV === "production",
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

/**
 * Which ways to sign in the UI offers. E-mail codes need a sender, except in
 * development, where codes are written to the server log.
 */
export const AUTH_METHODS = {
    google: ServerConfig.google !== null,
    emailCode:
        Boolean(ServerConfig.email.resendApiKey) || ServerConfig.isDevelopment,
} as const;
