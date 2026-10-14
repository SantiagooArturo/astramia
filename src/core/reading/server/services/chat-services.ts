import "server-only";
import { ServerConfig } from "@/config/server-config";
import { stream } from "@/core/ai/server/repository/llm";
import { chatSystemPrompt } from "@/core/reading/domain/prompts";
import { CHAT_LIMITS } from "@/core/reading/domain/schemas";
import type { ChatMessage } from "@/core/reading/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import {
    addChatMessage,
    findReading,
    listChatMessages,
} from "../repository/readings";
import { toChatMessage, toProfile } from "../repository/utils";

export async function listChatMessagesService(
    userId: string,
    readingId: string,
): AsyncAppResult<ChatMessage[]> {
    try {
        const row = await findReading(userId, readingId);
        if (!row) return err(AppErrors.notFound({ targets: ["reading"] }));
        if (!row.unlockedAt) return err(AppErrors.forbidden());
        const messages = await listChatMessages(readingId);
        return ok(messages.map(toChatMessage));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}

/**
 * One chat turn: checks the paid window and the message cap, stores the
 * question, and streams the answer (stored when it finishes).
 */
export async function sendChatMessageService(
    userId: string,
    readingId: string,
    text: string,
): AsyncAppResult<ReturnType<typeof stream>> {
    try {
        const row = await findReading(userId, readingId);
        if (!row) return err(AppErrors.notFound({ targets: ["reading"] }));
        if (!row.unlockedAt || !row.chatExpiresAt)
            return err(AppErrors.forbidden());
        if (!row.content)
            return err(AppErrors.conflict({ targets: ["content"] }));
        if (row.chatExpiresAt.getTime() < Date.now())
            return err(AppErrors.forbidden());

        const history = await listChatMessages(readingId);
        const asked = history.filter((m) => m.role === "user").length;
        if (asked >= CHAT_LIMITS.maxUserMessages)
            return err(AppErrors.tooManyRequests());

        await addChatMessage({ readingId, role: "user", content: text });

        return ok(
            stream({
                model: ServerConfig.ai.models.chat,
                system: chatSystemPrompt(toProfile(row), row.content),
                messages: [
                    ...history.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    { role: "user" as const, content: text },
                ],
                maxOutputTokens: 800,
                usage: { purpose: "chat", userId, referenceId: readingId },
                onText: (reply) =>
                    addChatMessage({
                        readingId,
                        role: "assistant",
                        content: reply,
                    }),
            }),
        );
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
