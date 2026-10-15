"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { GoldButton } from "@/core/landing/client/effects";
import { authClient } from "@/frontend/auth/auth";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Spinner } from "@/frontend/components/ui/spinner";
import { authErrorMessage } from "./auth-errors";

const CODE_LENGTH = 6;

/**
 * Sign in or up with a code sent by e-mail: no password to invent or forget.
 * The code is typed here, in the same browser, so it also works inside
 * Instagram/TikTok and keeps the anonymous session that owns the reading
 * (a magic link would open in another browser). From that session, signing
 * in moves the readings into the account (`claimAnonymousData`).
 */
export function CodeForm({
    defaultEmail = "",
    submitLabel = "Entrar",
    reload = false,
}: {
    /** The e-mail they paid with, so it's one tap. */
    defaultEmail?: string;
    submitLabel?: string;
    /** Full reload after signing in: a `notFound()` page ignores refresh. */
    reload?: boolean;
}) {
    const id = useId();
    const router = useRouter();
    const [email, setEmail] = useState(defaultEmail);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function send(event?: React.FormEvent) {
        event?.preventDefault();
        setPending(true);
        setError(null);
        const { error } = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "sign-in",
        });
        setPending(false);
        if (error) {
            setError(authErrorMessage(error));
            return;
        }
        setSentTo(email);
        setCode("");
    }

    async function verify(otp: string) {
        if (!sentTo || pending) return;
        setPending(true);
        setError(null);
        const { error } = await authClient.signIn.emailOtp({
            email: sentTo,
            otp,
        });
        if (error) {
            setPending(false);
            setError(authErrorMessage(error));
            return;
        }
        if (reload) window.location.reload();
        else router.refresh();
    }

    const alert = error && (
        <p role="alert" className="text-destructive text-sm">
            {error}
        </p>
    );

    if (!sentTo)
        return (
            <form onSubmit={send} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor={`${id}-email`}>Tu correo</Label>
                    <Input
                        id={`${id}-email`}
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                {alert}
                <GoldButton
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-full sm:w-fit"
                >
                    {pending && <Spinner />}
                    Continuar
                </GoldButton>
            </form>
        );

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                verify(code);
            }}
            className="flex flex-col gap-4"
        >
            <p className="text-muted-foreground text-sm">
                Te mandamos un correo a{" "}
                <span className="text-foreground">{sentTo}</span> con un código
                de {CODE_LENGTH} números. Ábrelo y escríbelo aquí:
            </p>
            <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-code`}>Código</Label>
                <Input
                    id={`${id}-code`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern={`[0-9]{${CODE_LENGTH}}`}
                    maxLength={CODE_LENGTH}
                    required
                    placeholder="• • • • • •"
                    className="font-mono text-lg tracking-[0.4em]"
                    value={code}
                    onChange={(e) => {
                        const digits = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, CODE_LENGTH);
                        setCode(digits);
                        // Pasted or autofilled: no need to tap the button.
                        if (digits.length === CODE_LENGTH) verify(digits);
                    }}
                />
                <p className="text-muted-foreground text-xs">
                    ¿No te llegó? Mira en Spam o en Promociones.
                </p>
            </div>
            {alert}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <GoldButton
                    type="submit"
                    disabled={pending || code.length < CODE_LENGTH}
                    className="w-full rounded-full sm:w-auto"
                >
                    {pending && <Spinner />}
                    {submitLabel}
                </GoldButton>
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="link"
                        className="h-auto px-0 text-muted-foreground"
                        disabled={pending}
                        onClick={() => send()}
                    >
                        Enviarlo otra vez
                    </Button>
                    <Button
                        type="button"
                        variant="link"
                        className="h-auto px-0 text-muted-foreground"
                        onClick={() => {
                            setSentTo(null);
                            setError(null);
                        }}
                    >
                        Usar otro correo
                    </Button>
                </div>
            </div>
        </form>
    );
}
