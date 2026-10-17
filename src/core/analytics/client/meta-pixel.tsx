"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { PRODUCTS } from "@/core/payment/domain/catalog";

/** The Meta Pixel the ads are measured with (Business Manager → Events). */
export const META_PIXEL_ID = "1653247253123702";

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

/** The team's own panel isn't anyone's visit. */
const isPanel = (path: string) => path.startsWith("/panel");

type MetaEvent = "Lead" | "InitiateCheckout" | "Purchase";

/**
 * A Meta standard event, the ones ads optimize for: Lead (a reading
 * started), InitiateCheckout (the pay button), Purchase (paid). `id` lets
 * Meta drop a repeat of the same event.
 */
export function metaEvent(
    name: MetaEvent,
    params: Record<string, unknown> = {},
    id?: string,
): void {
    if (typeof window === "undefined" || isPanel(window.location.pathname))
        return;
    window.fbq?.("track", name, params, id ? { eventID: id } : undefined);
}

/** What one reading costs, as Meta wants it: a number and a currency. */
export const READING_VALUE = {
    value: PRODUCTS.reading_unlock.price.amountCents / 100,
    currency: PRODUCTS.reading_unlock.price.currency,
};

/**
 * Meta's base code, as their panel gives it, loaded after the page is
 * interactive. It counts the first page view; client-side navigations,
 * which don't reload the page, are counted here.
 */
export function MetaPixel() {
    const path = usePathname();
    const first = useRef(true);
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        if (!isPanel(path)) window.fbq?.("track", "PageView");
    }, [path]);

    return (
        <>
            <Script id="meta-pixel" strategy="afterInteractive">
                {`if (!location.pathname.startsWith("/panel")) {
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
}`}
            </Script>
            <noscript>
                {/* biome-ignore lint/performance/noImgElement: Meta's no-JS beacon must be a plain img. */}
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    alt=""
                    src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                />
            </noscript>
        </>
    );
}
