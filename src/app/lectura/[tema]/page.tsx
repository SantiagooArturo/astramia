import { notFound } from "next/navigation";
import { QuizScreen } from "@/core/reading/client/screens/quiz-screen";
import {
    knownBirthDaySchema,
    readingTopicSchema,
} from "@/core/reading/domain/schemas";

export default async function QuizPage({
    params,
    searchParams,
}: {
    params: Promise<{ tema: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const topic = readingTopicSchema.safeParse((await params).tema);
    if (!topic.success) notFound();
    const known = knownBirthDaySchema.safeParse(await searchParams);
    return (
        <QuizScreen
            topic={topic.data}
            knownBirthDay={known.success ? known.data : undefined}
        />
    );
}
