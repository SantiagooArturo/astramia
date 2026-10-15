"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { GoldButton } from "@/core/landing/client/effects";
import { BUSINESS } from "@/core/legal/domain/business";
import { authClient } from "@/frontend/auth/auth";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Spinner } from "@/frontend/components/ui/spinner";
import { authErrorMessage } from "./auth-errors";

type Mode = "signUp" | "signIn";

const MIN_PASSWORD = 8;

/**
 * E-mail + password, until an e-mail sender (Resend) is configured and codes
 * take over. From an anonymous session, signing up or in moves the visitor's
 * readings into the account (`claimAnonymousData`).
 */
export function PasswordForm({
    initialMode = "signUp",
    defaultEmail = "",
    submitLabel,
    reload = false,
    signInOnly = false,
}: {
    initialMode?: Mode;
    /** The e-mail they paid with, so only the password is left. */
    defaultEmail?: string;
    submitLabel?: string;
    /**
     * Full reload instead of `router.refresh()`: a `notFound()` page keeps its
     * boundary on refresh, even once the new session can see the reading.
     */
    reload?: boolean;
    /** Where a new, empty account would recover nothing: no sign-up offer. */
    signInOnly?: boolean;
}) {
    const id = useId();
    const router = useRouter();
    const [mode, setMode] = useState<Mode>(initialMode);
    const [email, setEmail] = useState(defaultEmail);
    const [password, setPassword] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setPending(true);
        setError(null);
        const { error } =
            mode === "signUp"
                ? await authClient.signUp.email({
                      email,
                      password,
                      // Shown nowhere; Better Auth requires one.
                      name: email.split("@")[0] ?? "",
                  })
                : await authClient.signIn.email({ email, password });
        if (error) {
            setPending(false);
            if (error.code?.startsWith("USER_ALREADY_EXISTS")) {
                setMode("signIn");
                setError("Ese correo ya tiene cuenta. Escribe tu contraseña.");
                return;
            }
            setError(authErrorMessage(error));
            return;
        }
        if (reload) window.location.reload();
        else router.refresh();
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label htmlFor={`${id}-email`}>Tu correo</Label>
                    <Input
                        id={`${id}-email`}
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor={`${id}-password`}>
                        {mode === "signUp"
                            ? "Crea una contraseña"
                            : "Contraseña"}
                    </Label>
                    <Input
                        id={`${id}-password`}
                        type="password"
                        autoComplete={
                            mode === "signUp"
                                ? "new-password"
                                : "current-password"
                        }
                        minLength={MIN_PASSWORD}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>
            {error && (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            )}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <GoldButton
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-full sm:w-auto"
                >
                    {pending && <Spinner />}
                    {submitLabel ??
                        (mode === "signUp"
                            ? "Crear mi cuenta"
                            : "Iniciar sesión")}
                </GoldButton>
                {!signInOnly && (
                    <Button
                        type="button"
                        variant="link"
                        className="h-auto px-0 text-muted-foreground"
                        onClick={() => {
                            setMode(mode === "signUp" ? "signIn" : "signUp");
                            setError(null);
                        }}
                    >
                        {mode === "signUp"
                            ? "Ya tengo cuenta"
                            : "No tengo cuenta: crear una"}
                    </Button>
                )}
            </div>
            {mode === "signIn" && (
                <p className="text-muted-foreground text-xs">
                    ¿Olvidaste tu contraseña? Escríbenos a{" "}
                    <a
                        href={`mailto:${BUSINESS.supportEmail}`}
                        className="underline underline-offset-4"
                    >
                        {BUSINESS.supportEmail}
                    </a>
                    .
                </p>
            )}
        </form>
    );
}
