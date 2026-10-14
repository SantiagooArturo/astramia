"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Re-runs the server component every `ms` while mounted. Used while the
 * payment is confirming or the full reading is being written.
 */
export function RefreshWhile({ ms = 3000 }: { ms?: number }) {
    const router = useRouter();
    useEffect(() => {
        const id = setInterval(() => router.refresh(), ms);
        return () => clearInterval(id);
    }, [router, ms]);
    return null;
}
