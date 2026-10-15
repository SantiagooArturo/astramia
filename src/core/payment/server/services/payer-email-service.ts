import "server-only";
import { findPayerEmail } from "../repository/orders";

/**
 * The e-mail a buyer paid with, to pre-fill "save it in an account". Never
 * fails the page it decorates: no e-mail is just an empty field.
 */
export async function payerEmailService(
    userId: string,
    referenceId: string,
): Promise<string | null> {
    try {
        return await findPayerEmail(userId, referenceId);
    } catch {
        return null;
    }
}
