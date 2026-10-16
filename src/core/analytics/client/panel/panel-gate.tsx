import { AccountForm } from "@/core/account/client/account-form";
import { SignOutLink } from "@/core/account/client/sign-out-link";
import type { PanelAccess } from "@/core/analytics/server/services/panel-access";

/** Before the panel: sign in, or prove the address with a code or Google. */
export function PanelGate({
    access,
}: {
    access: Exclude<PanelAccess, { kind: "open" }>;
}) {
    return (
        <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-6 px-4">
            <div>
                <h1 className="font-semibold text-2xl">Panel de Astramia</h1>
                <p className="mt-2 text-muted-foreground text-sm">
                    {access.kind === "sign-in"
                        ? "Entra con tu correo o con Google."
                        : `${access.email} necesita entrar con un código por correo o con Google, sin contraseña.`}
                </p>
            </div>
            {access.kind === "sign-in" ? (
                <AccountForm reload signInOnly />
            ) : (
                <SignOutLink />
            )}
        </main>
    );
}
