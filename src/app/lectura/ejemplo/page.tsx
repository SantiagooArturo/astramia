import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServerConfig } from "@/config/server-config";
import { ReadingChat } from "@/core/reading/client/components/reading-chat";
import {
    LockedReadingScreen,
    WritingScreen,
} from "@/core/reading/client/screens/reading-screen";
import { ReadingStory } from "@/core/reading/client/story/reading-story";
import { natalChart, readingOutlook } from "@/core/reading/domain/chart";
import { LOVE_PLAN } from "@/core/reading/domain/plan";
import { lockTeaser } from "@/core/reading/domain/reading-content";
import {
    SAMPLE_FREE,
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
export default async function SampleReadingPage({
    searchParams,
}: {
    /** `?vista=bloqueada` or `escribiendo`: the preview before paying, or while it's written. */
    searchParams: Promise<{ vista?: string }>;
}) {
    if (ServerConfig.isLiveSite) notFound();
    const { vista } = await searchParams;
    const chart = natalChart(
        SAMPLE_READING.birthDate,
        SAMPLE_READING.birthTime,
        SAMPLE_READING.birthTimeZone,
    );
    // Written as now: the free scenes (and the hook) in `teaser`, the rest here.
    const { opening, venus, mars, venusMars, ...paid } = SAMPLE_SCENES;
    const reading: Reading = {
        id: SAMPLE_READING.id,
        topic: "amor",
        sunSign: chart.placements[0].sign,
        teaser: JSON.stringify(SAMPLE_FREE),
        birthDate: SAMPLE_READING.birthDate,
        birthTime: SAMPLE_READING.birthTime,
        birthPlace: SAMPLE_READING.birthPlace,
        chart,
        locked: false,
        content: JSON.stringify(paid),
        question: storyQuestion(SAMPLE_READING.answers),
        skyAhead: readingOutlook(
            SAMPLE_READING,
            new Date(SAMPLE_READING.writtenAt),
        ).events,
        chatExpiresAt: null,
        createdAt: SAMPLE_READING.writtenAt,
    };
    if (vista === "bloqueada")
        return (
            <LockedReadingScreen
                reading={{
                    ...reading,
                    locked: true,
                    content: null,
                    // As the server sends it: the hook cut to its free part.
                    teaser: lockTeaser(reading.teaser, LOVE_PLAN),
                }}
                payment="none"
            />
        );
    if (vista === "escribiendo")
        return <WritingScreen reading={{ ...reading, content: null }} />;
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
