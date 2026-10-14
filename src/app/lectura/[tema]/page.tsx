import { notFound } from "next/navigation";
import { QuizScreen } from "@/core/reading/client/screens/quiz-screen";
import { readingTopicSchema } from "@/core/reading/domain/schemas";

export default async function QuizPage({
    params,
}: {
    params: Promise<{ tema: string }>;
}) {
    const topic = readingTopicSchema.safeParse((await params).tema);
    if (!topic.success) notFound();
    return <QuizScreen topic={topic.data} />;
}
