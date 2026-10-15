import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getLogger } from "@logtape/logtape";
import { APIError, betterAuth } from "better-auth";
import { anonymous, openAPI } from "better-auth/plugins";
import { headers } from "next/headers";
import { cache } from "react";
import { ServerConfig } from "@/config/server-config";
import { db } from "@/server/drizzle/db";
import * as authSchema from "@/server/drizzle/schemas/auth-schema";

const logger = getLogger(["server", "auth"]);

export const auth = betterAuth({
    baseURL: ServerConfig.baseUrl,
    basePath: "/api/v1/auth",
    // The site answers on one of apex/www; requests come from whichever it is.
    trustedOrigins: [...ServerConfig.appOrigins],
    secret: ServerConfig.betterAuthSecret,
    // Long-lived: anonymous buyers keep their reading through this cookie.
    session: { freshAge: 0, expiresIn: 60 * 60 * 24 * 90 },
    rateLimit: {
        customRules: {
            // Every anonymous account can trigger a paid teaser call.
            "/sign-in/anonymous": { window: 60 * 60, max: 5 },
        },
    },
    emailAndPassword: {
        enabled: true,
        // Starter keeps verification off so sign-up works with no email provider.
        requireEmailVerification: false,
    },
    plugins: [
        // Visitors take the quiz without signing up; see core/reading.
        anonymous(),
        openAPI({ disableDefaultReference: !ServerConfig.isDevelopment }),
    ],
    database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
});

/**
 * React cache()-wrapped session read for server components / guards.
 * Swallows errors → null so callers can treat it as a null-tolerant read.
 */
export const authenticate = cache(async () => {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        return session
            ? { user: session.user, session: session.session }
            : null;
    } catch (e) {
        if (e instanceof APIError) {
            logger.warn("Auth API error: {error}", { error: e });
            return null;
        }
        logger.error("Authentication error: {error}", { error: e });
        return null;
    }
});
