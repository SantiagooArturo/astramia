"use client";

import { Lock } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { GoldButton } from "@/core/landing/client/effects";
import { Spinner } from "@/frontend/components/ui/spinner";
import { useReadings } from "../hooks";

/** Opens the hosted checkout; the gateway sends the buyer back to this page. */
export function UnlockButton({
    readingId,
    label,
}: {
    readingId: string;
    label: string;
}) {
    const checkout = useReadings().useCheckout(readingId);
    const { reset } = checkout;

    // Back from the gateway, the browser may restore this page from its
    // back/forward cache with the state frozen at "redirecting": the button
    // would spin forever. A restored page starts over.
    useEffect(() => {
        const onShow = (event: PageTransitionEvent) => {
            if (event.persisted) reset();
        };
        window.addEventListener("pageshow", onShow);
        return () => window.removeEventListener("pageshow", onShow);
    }, [reset]);

    async function start() {
        try {
            const result = await checkout.mutateAsync(undefined);
            window.location.assign(result.response.checkoutUrl);
        } catch {
            toast.error("No pudimos abrir el pago. Inténtalo de nuevo.");
        }
    }

    // Stays busy after success too, while the browser navigates away.
    const busy = checkout.isPending || checkout.isSuccess;

    return (
        <GoldButton
            size="lg"
            className="w-full rounded-full sm:w-auto"
            disabled={busy}
            onClick={start}
        >
            {busy ? <Spinner /> : <Lock />}
            {label}
        </GoldButton>
    );
}
