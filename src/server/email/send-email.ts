import "server-only";
import { getLogger } from "@logtape/logtape";
import { ServerConfig } from "@/config/server-config";
import { BUSINESS } from "@/core/legal/domain/business";

const logger = getLogger(["server", "email"]);

export interface Email {
    to: string;
    subject: string;
    text: string;
    html: string;
}

/** Sends through Resend's HTTP API. In development, without a key, logs it. */
export async function sendEmail(email: Email): Promise<void> {
    const key = ServerConfig.email.resendApiKey;
    if (!key) {
        if (!ServerConfig.isDevelopment)
            throw new Error("No e-mail sender configured (RESEND_API_KEY)");
        logger.info("E-mail to {to}: {subject}\n{text}", { ...email });
        return;
    }
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: ServerConfig.email.from,
            to: email.to,
            reply_to: BUSINESS.supportEmail,
            subject: email.subject,
            text: email.text,
            html: email.html,
        }),
    });
    if (!response.ok)
        throw new Error(
            `Resend ${response.status}: ${(await response.text()).slice(0, 300)}`,
        );
}
