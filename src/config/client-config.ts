import { env } from "./env";

export const ClientConfig = {
    baseUrl: env.NEXT_PUBLIC_APP_URL,
    /**
     * Same origin as the page in the browser. The configured URL may be the
     * apex while the site is served on www (or a preview URL): calling it
     * would be cross-origin and the browser blocks the auth cookie.
     */
    apiOrigin:
        typeof window === "undefined"
            ? env.NEXT_PUBLIC_APP_URL
            : window.location.origin,
} as const;
