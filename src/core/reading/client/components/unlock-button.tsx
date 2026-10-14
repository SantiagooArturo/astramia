"use client";

import { Lock } from "lucide-react";
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
