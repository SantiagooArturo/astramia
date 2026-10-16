import "server-only";
import { and, eq } from "drizzle-orm";
import { isPanelEmail } from "@/core/analytics/domain/admins";
import { authenticate } from "@/server/auth/auth";
import { db } from "@/server/drizzle/db";
import { account } from "@/server/drizzle/schemas/auth-schema";

export type PanelAccess =
    | { kind: "sign-in" }
    /** One of the team, signed in a way that doesn't prove the address. */
    | { kind: "verify"; email: string }
    | { kind: "open"; email: string };

/**
 * Who may see the panel: anyone else gets `null` (a 404, so the page
 * doesn't exist for them). Being on the list isn't enough: the address
 * must be proven, by an e-mail code or Google, and the account must have
 * no password, since sign-up by password checks nobody's mailbox and
 * whoever chose that password could sign in as them.
 */
export async function panelAccess(): Promise<PanelAccess | null> {
    const session = await authenticate();
    if (!session || session.user.isAnonymous) return { kind: "sign-in" };
    const { email, emailVerified, id } = session.user;
    if (!isPanelEmail(email)) return null;
    const [password] = await db
        .select({ id: account.id })
        .from(account)
        .where(
            and(eq(account.userId, id), eq(account.providerId, "credential")),
        )
        .limit(1);
    return emailVerified && !password
        ? { kind: "open", email }
        : { kind: "verify", email };
}
