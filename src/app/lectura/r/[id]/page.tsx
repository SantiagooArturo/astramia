import { notFound, redirect } from "next/navigation";
import { syncCheckoutReturnService } from "@/core/payment/server/services/sync-checkout-return-service";
import {
    LockedReadingScreen,
    type PaymentState,
    ReadingBody,
    UnlockedReadingScreen,
} from "@/core/reading/client/screens/reading-screen";
import { listChatMessagesService } from "@/core/reading/server/services/chat-services";
import { ensureReadingContentService } from "@/core/reading/server/services/ensure-reading-content-service";
import { getReadingService } from "@/core/reading/server/services/get-reading-service";
import { authenticate } from "@/server/auth/auth";

type Query = Record<string, string | string[] | undefined>;

function flatten(query: Query): Record<string, string | undefined> {
    return Object.fromEntries(
        Object.entries(query).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
    );
}

/**
 * The reading page. Calls services directly (RSC) and hands the screens plain
 * props; only the pay button and the chat are client islands.
 */
export default async function ReadingPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Query>;
}) {
    const { id } = await params;
    const session = await authenticate();
    if (!session) notFound();
    const userId = session.user.id;

    let payment: PaymentState = "none";
    const returned = await syncCheckoutReturnService(
        flatten(await searchParams),
    );
    if (returned.ok && returned.data) {
        const status = returned.data.order?.status;
        // Paid: drop the gateway's query string so a reload is a clean view.
        if (status === "paid") redirect(`/lectura/r/${id}`);
        payment = status === "failed" ? "failed" : "confirming";
    }

    const reading = await getReadingService(userId, id);
    if (!reading.ok) notFound();

    if (reading.data.locked)
        return <LockedReadingScreen reading={reading.data} payment={payment} />;

    return (
        <UnlockedReadingScreen
            reading={reading.data}
            content={<FullReading userId={userId} id={id} />}
        />
    );
}

async function FullReading({ userId, id }: { userId: string; id: string }) {
    const [reading, messages] = await Promise.all([
        ensureReadingContentService(userId, id),
        listChatMessagesService(userId, id),
    ]);
    if (!reading.ok) throw new Error("No pudimos escribir tu lectura");
    return (
        <ReadingBody
            reading={reading.data}
            messages={messages.ok ? messages.data : []}
        />
    );
}
