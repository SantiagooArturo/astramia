import type { Metadata } from "next";
import { MyReadingsScreen } from "@/core/reading/client/screens/my-readings-screen";
import { listReadingsService } from "@/core/reading/server/services/get-reading-service";
import { authenticate } from "@/server/auth/auth";

export const metadata: Metadata = { title: "Mis lecturas · Astramia" };

export default async function MyReadingsPage() {
    const session = await authenticate();
    const readings = session
        ? await listReadingsService(session.user.id)
        : null;
    return (
        <MyReadingsScreen
            account={
                session
                    ? {
                          email: session.user.email,
                          anonymous: Boolean(session.user.isAnonymous),
                      }
                    : null
            }
            readings={readings?.ok ? readings.data : []}
        />
    );
}
