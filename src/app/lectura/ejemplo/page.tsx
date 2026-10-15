import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServerConfig } from "@/config/server-config";
import { ReadingChat } from "@/core/reading/client/components/reading-chat";
import { ReadingStory } from "@/core/reading/client/story/reading-story";
import { natalChart, readingOutlook } from "@/core/reading/domain/chart";
import {
    SAMPLE_READING,
    SAMPLE_SCENES,
} from "@/core/reading/domain/sample-reading";
import { storyQuestion } from "@/core/reading/domain/story";
import type { ChatMessage, Reading } from "@/core/reading/domain/types";

export const metadata: Metadata = {
    title: "Lectura de ejemplo · Astramia AI",
    robots: { index: false },
};

/** One exchange, so the preview shows how the Sun answers. */
const SAMPLE_CHAT: ChatMessage[] = [
    {
        id: "ejemplo-1",
        role: "user",
        content: "¿Por qué siempre termino haciendo todos los planes?",
        createdAt: SAMPLE_READING.writtenAt,
    },
    {
        id: "ejemplo-2",
        role: "assistant",
        content:
            "Porque tu Venus en Aries llega primero a todo: ve la posibilidad y ya está en camino. El problema no es que propongas, es que no esperas a ver si la otra persona también lo haría.\n\nPrueba algo pequeño: la próxima vez que sientas que toca proponer, no lo hagas durante un día. Tu Luna en Capricornio necesita esa prueba: ver quién aparece sin que tú lo empujes.",
        createdAt: SAMPLE_READING.writtenAt,
    },
];

/**
 * The paid reading with a sample text and chart, to see (and check) the
 * experience without paying. Never on the live site.
 */
export default function SampleReadingPage() {
    if (ServerConfig.isLiveSite) notFound();
    const chart = natalChart(
        SAMPLE_READING.birthDate,
        SAMPLE_READING.birthTime,
        SAMPLE_READING.birthTimeZone,
    );
    const reading: Reading = {
        id: SAMPLE_READING.id,
        topic: "amor",
        sunSign: chart.placements[0].sign,
        teaser: SAMPLE_READING.teaser,
        birthDate: SAMPLE_READING.birthDate,
        birthTime: SAMPLE_READING.birthTime,
        birthPlace: SAMPLE_READING.birthPlace,
        chart,
        locked: false,
        content: JSON.stringify(SAMPLE_SCENES),
        question: storyQuestion(SAMPLE_READING.answers),
        skyAhead: readingOutlook(
            SAMPLE_READING,
            new Date(SAMPLE_READING.writtenAt),
        ).events,
        chatExpiresAt: null,
        createdAt: SAMPLE_READING.writtenAt,
    };
    return (
        <ReadingStory
            reading={reading}
            content={reading.content ?? ""}
            chat={
                <ReadingChat
                    readingId={reading.id}
                    initialMessages={SAMPLE_CHAT}
                    expiresAt={null}
                    sunSign={reading.sunSign}
                    demo
                />
            }
        />
    );
}
