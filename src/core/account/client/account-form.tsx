import "server-only";
import { headers } from "next/headers";
import { AUTH_METHODS } from "@/config/server-config";
import { isInAppBrowser } from "../domain/in-app-browser";
import { CodeForm } from "./code-form";
import { EmailOption } from "./email-option";
import { GoogleButton } from "./google-button";
import { PasswordForm } from "./password-form";

/**
 * Every way in this deployment offers. Google first and alone when possible:
 * it's the one everybody recognizes. The e-mail way (a code, or a password
 * while no sender is set up) folds behind a quiet link then, and stands on
 * its own inside social apps' browsers, where Google refuses to sign in.
 */
export async function AccountForm({
    defaultEmail,
    submitLabel,
    reload = false,
    signInOnly = false,
}: {
    defaultEmail?: string | null;
    /** The code step's button (e.g. "Guardar mi lectura"). */
    submitLabel?: string;
    /** Full reload after signing in: a `notFound()` page ignores refresh. */
    reload?: boolean;
    /** Password form only: no "create one" where it would recover nothing. */
    signInOnly?: boolean;
}) {
    const userAgent = (await headers()).get("user-agent") ?? "";
    const google = AUTH_METHODS.google && !isInAppBrowser(userAgent);
    const email = AUTH_METHODS.emailCode ? (
        <CodeForm
            defaultEmail={defaultEmail ?? ""}
            submitLabel={submitLabel}
            reload={reload}
        />
    ) : (
        <PasswordForm
            initialMode={signInOnly ? "signIn" : "signUp"}
            defaultEmail={defaultEmail ?? ""}
            reload={reload}
            signInOnly={signInOnly}
        />
    );
    if (!google) return email;
    return (
        <div className="flex flex-col gap-3">
            <GoogleButton />
            <EmailOption>{email}</EmailOption>
        </div>
    );
}
