import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getLogger } from "@logtape/logtape";
import { APIError, betterAuth } from "better-auth";
import { anonymous, emailOTP, openAPI } from "better-auth/plugins";
import { headers } from "next/headers";
import { cache } from "react";
import { ServerConfig } from "@/config/server-config";
import { db } from "@/server/drizzle/db";
import * as authSchema from "@/server/drizzle/schemas/auth-schema";
import { sendEmail } from "@/server/email/send-email";
import {
    SIGN_IN_CODE_MINUTES,
    signInCodeEmail,
} from "@/server/email/sign-in-code-email";
import { claimAnonymousData } from "./claim-anonymous-data";

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
        // Shared by every serverless instance; in memory each counted alone.
        storage: "database",
        customRules: {
            // Every anonymous account can trigger a paid teaser call, but
            // Peruvian mobile carriers put many buyers behind one IP (CGNAT).
            "/sign-in/anonymous": { window: 60 * 60, max: 60 },
        },
    },
    // Only once GOOGLE_CLIENT_ID/SECRET are set. Its callback signs in from an
    // anonymous session like any other method, so the reading follows along.
    socialProviders: ServerConfig.google
        ? { google: { ...ServerConfig.google, prompt: "select_account" } }
        : {},
    emailAndPassword: {
        enabled: true,
        // Starter keeps verification off so sign-up works with no email provider.
        requireEmailVerification: false,
    },
    plugins: [
        // Visitors take the quiz and pay without signing up (see core/reading).
        // Signing up or in later keeps what they bought.
        anonymous({
            onLinkAccount: ({ anonymousUser, newUser }) =>
                claimAnonymousData(anonymousUser.user.id, newUser.user.id),
        }),
        // Sign in (or up) with a 6-digit code by e-mail: no password to invent
        // or forget, and it works inside Instagram/TikTok's browsers, where
        // Google refuses to sign anyone in.
        emailOTP({
            otpLength: 6,
            expiresIn: SIGN_IN_CODE_MINUTES * 60,
            storeOTP: "hashed",
            // Per IP; carriers put many buyers behind one (CGNAT).
            rateLimit: { window: 60, max: 10 },
            sendVerificationOTP: ({ email, otp }) =>
                sendEmail(signInCodeEmail(email, otp)),
        }),
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
