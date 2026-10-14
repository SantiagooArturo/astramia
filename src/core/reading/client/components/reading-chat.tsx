"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CHAT_LIMITS } from "@/core/reading/domain/schemas";
import type { ChatMessage } from "@/core/reading/domain/types";
import { Button } from "@/frontend/components/ui/button";
import { Spinner } from "@/frontend/components/ui/spinner";
import { Textarea } from "@/frontend/components/ui/textarea";
import { cn } from "@/frontend/lib/utils";
import { renderInline } from "./reading-text";

function toUIMessage(message: ChatMessage): UIMessage {
    return {
        id: message.id,
        role: message.role,
        parts: [{ type: "text", text: message.content }],
    };
}

function textOf(message: UIMessage): string {
    return message.parts
        .map((part) => (part.type === "text" ? part.text : ""))
        .join("");
}

/**
 * Formatted after mount: the server doesn't know the visitor's time zone, and
 * formatting there (UTC on Vercel) would not match the browser's hydration.
 */
function useLocalTime(iso: string): string | null {
    const [time, setTime] = useState<string | null>(null);
    useEffect(() => {
        setTime(
            new Date(iso).toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        );
    }, [iso]);
    return time;
}

/**
 * Chat about the reading. History lives on the server, so the request only
 * carries the new question (`{ text }`), validated by `chatTurnSchema`.
 */
export function ReadingChat({
    readingId,
    initialMessages,
    expiresAt,
}: {
    readingId: string;
    initialMessages: ChatMessage[];
    expiresAt: string;
}) {
    const [input, setInput] = useState("");
    const transport = useMemo(
        () =>
            new DefaultChatTransport<UIMessage>({
                api: `/api/v1/readings/${readingId}/chat`,
                prepareSendMessagesRequest: ({ messages }) => ({
                    body: { text: textOf(messages[messages.length - 1]) },
                }),
            }),
        [readingId],
    );
    const { messages, sendMessage, status, error } = useChat({
        messages: initialMessages.map(toUIMessage),
        transport,
    });

    const asked = messages.filter((m) => m.role === "user").length;
    const expired = new Date(expiresAt).getTime() < Date.now();
    const exhausted = asked >= CHAT_LIMITS.maxUserMessages;
    const busy = status === "submitted" || status === "streaming";
    const closed = expired || exhausted;

    function submit(event: React.FormEvent) {
        event.preventDefault();
        const text = input.trim();
        if (!text || busy || closed) return;
        sendMessage({ text });
        setInput("");
    }

    const closesAt = useLocalTime(expiresAt);

    return (
        <section
            aria-label="Chat sobre tu lectura"
            className="flex flex-col gap-4 rounded-2xl border border-astral-ink bg-card/40 p-4 sm:p-6"
        >
            <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl">Pregúntale a tu carta</h2>
                <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
                    {expired
                        ? "Chat cerrado"
                        : closesAt
                          ? `Abierto hasta las ${closesAt}`
                          : "Chat abierto"}
                </p>
            </header>

            <ol className="flex flex-col gap-3">
                {messages.map((message) => (
                    <li
                        key={message.id}
                        className={cn(
                            "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:text-base",
                            message.role === "user"
                                ? "self-end bg-astral-gold/15"
                                : "self-start bg-background/60",
                        )}
                    >
                        {message.role === "assistant"
                            ? renderInline(textOf(message))
                            : textOf(message)}
                    </li>
                ))}
                {status === "submitted" && (
                    <li className="self-start px-4 py-3 text-muted-foreground">
                        <Spinner />
                    </li>
                )}
            </ol>

            {error && (
                <p role="alert" className="text-destructive text-sm">
                    No pudimos responder ahora. Inténtalo otra vez.
                </p>
            )}

            {closed ? (
                <p className="text-muted-foreground text-sm">
                    {expired
                        ? "Tus horas de chat terminaron. Tu lectura sigue aquí cuando quieras volver."
                        : "Llegaste al límite de preguntas de esta lectura."}
                </p>
            ) : (
                <form onSubmit={submit} className="flex items-end gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) submit(e);
                        }}
                        maxLength={CHAT_LIMITS.maxMessageChars}
                        placeholder="¿Qué quieres saber de tu lectura?"
                        aria-label="Tu pregunta"
                        className="min-h-12 resize-none"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={busy || !input.trim()}
                        aria-label="Enviar"
                    >
                        <Send />
                    </Button>
                </form>
            )}
        </section>
    );
}
