"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/frontend/auth/auth";
import { Button } from "@/frontend/components/ui/button";
import { Spinner } from "@/frontend/components/ui/spinner";
import { authErrorMessage } from "./auth-errors";

const GOOGLE_FAILED =
    "No pudimos entrar con Google. Inténtalo otra vez o usa tu correo.";

function GoogleLogo() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
            <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z"
            />
            <path
                fill="#34A853"
                d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
            />
            <path
                fill="#FBBC05"
                d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z"
            />
            <path
                fill="#EA4335"
                d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
            />
        </svg>
    );
}

/**
 * One tap with Google. Comes back to this same page; the callback signs in
 * from the anonymous session, so the reading moves into the account.
 */
export function GoogleButton() {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Back from Google's screen, a restored page must not keep spinning.
    useEffect(() => {
        const onShow = (event: PageTransitionEvent) => {
            if (event.persisted) setPending(false);
        };
        window.addEventListener("pageshow", onShow);
        return () => window.removeEventListener("pageshow", onShow);
    }, []);

    // A failed sign-in comes back here with ?error=: say so, then drop it
    // from the address so a reload is clean. Cancelling isn't a failure.
    useEffect(() => {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("error");
        if (!code) return;
        if (code !== "access_denied") setError(GOOGLE_FAILED);
        url.searchParams.delete("error");
        url.searchParams.delete("error_description");
        window.history.replaceState(window.history.state, "", url);
    }, []);

    async function start() {
        setPending(true);
        setError(null);
        const here = `${window.location.pathname}${window.location.search}`;
        const { error } = await authClient.signIn.social({
            provider: "google",
            callbackURL: here,
            errorCallbackURL: here,
        });
        if (error) {
            setPending(false);
            setError(authErrorMessage(error));
        }
    }

    const button = (
        <Button
            type="button"
            onClick={start}
            disabled={pending}
            // Google's own white button: the one people already know.
            className="h-12 w-full rounded-full border-0 bg-white text-[#1f1f1f] text-base hover:bg-white/90 sm:w-fit sm:px-8"
        >
            {pending ? <Spinner /> : <GoogleLogo />}
            Continuar con Google
        </Button>
    );
    if (!error) return button;
    return (
        <div className="flex flex-col gap-2">
            {button}
            <p role="alert" className="text-destructive text-sm">
                {error}
            </p>
        </div>
    );
}
