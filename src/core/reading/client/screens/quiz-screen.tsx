import { LOVE_QUIZ } from "@/core/reading/domain/quiz";
import type { ReadingTopic } from "@/core/reading/domain/types";
import { QuizFlow } from "../components/quiz-flow";
import { ReadingShell } from "./reading-shell";

export function QuizScreen({ topic }: { topic: ReadingTopic }) {
    return (
        <ReadingShell>
            <QuizFlow topic={topic} questions={LOVE_QUIZ} />
        </ReadingShell>
    );
}
