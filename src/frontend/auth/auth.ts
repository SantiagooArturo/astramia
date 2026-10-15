import { anonymousClient, emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ClientConfig } from "@/config/client-config";

export const authClient = createAuthClient({
    baseURL: ClientConfig.apiOrigin,
    basePath: "/api/v1/auth",
    plugins: [anonymousClient(), emailOTPClient()],
});
