"use client";

import { GripVertical } from "lucide-react";
import { LayoutGroup, motion, Reorder } from "motion/react";
import { useRef, useState } from "react";
import { GoldButton } from "@/core/landing/client/effects";
import { labelFor, type QuizQuestion } from "@/core/reading/domain/quiz";
import type { QuizAnswer } from "@/core/reading/domain/types";
import { Button } from "@/frontend/components/ui/button";

/** A fresh order: none of the options starts on top, so the order is theirs. */
function shuffled<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

// The same padding with or without the grip icon (the button narrows it for icons).
const CARD =
    "h-auto w-full justify-start gap-4 whitespace-normal border-astral-ink bg-card/40 px-5 py-4 text-left text-base has-[>svg]:px-5";

/**
 * A "rank" question: they tap the options from most to least important and
 * each one climbs to its place; the ones placed can be dragged to reorder,
 * or tapped to take them back. With one left, it can only go last.
 */
export function RankQuestion({
    question,
    answers,
    ranking,
    onRank,
}: {
    question: QuizQuestion;
    /** Their answers so far, which some labels follow. */
    answers: readonly QuizAnswer[];
    /** The order they gave before, coming back to it. */
    ranking?: readonly string[];
    onRank: (ranking: string[]) => void;
}) {
    const [offered] = useState(() =>
        ranking ? [...ranking] : shuffled(question.options.map((o) => o.id)),
    );
    const [ranked, setRanked] = useState<string[]>(() =>
        ranking ? [...ranking] : [],
    );
    // A drag ends in a click on the card it moved: that one isn't a tap.
    const dragged = useRef(false);
    const labels = new Map(
        question.options.map((o) => [o.id, labelFor(o, answers)]),
    );
    const rest = offered.filter((id) => !ranked.includes(id));

    function place(id: string) {
        const next = [...ranked, id];
        const left = offered.filter((o) => !next.includes(o));
        setRanked(left.length === 1 ? [...next, ...left] : next);
    }

    function takeBack(id: string) {
        if (dragged.current) return;
        setRanked(ranked.filter((o) => o !== id));
    }

    return (
        <fieldset className="flex flex-col gap-5">
            <legend className="mb-2 text-pretty font-display text-3xl sm:text-4xl">
                {question.question}
            </legend>
            {question.hint && (
                <p className="mb-1 text-muted-foreground text-sm">
                    {question.hint}
                </p>
            )}
            <div className="flex flex-col gap-3">
                <LayoutGroup>
                    <Reorder.Group
                        as="ol"
                        axis="y"
                        values={ranked}
                        onReorder={setRanked}
                        className="flex flex-col gap-3"
                    >
                        {ranked.map((id, i) => (
                            <Reorder.Item
                                key={id}
                                value={id}
                                layoutId={id}
                                className="touch-none"
                                onDragStart={() => {
                                    dragged.current = true;
                                }}
                                onDragEnd={() => {
                                    setTimeout(() => {
                                        dragged.current = false;
                                    });
                                }}
                            >
                                <Button
                                    variant="outline"
                                    aria-label={`${i + 1}. ${labels.get(id)}. Tocar para quitarlo`}
                                    className={`${CARD} border-astral-gold`}
                                    onClick={() => takeBack(id)}
                                >
                                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-astral-gold font-mono text-background text-sm">
                                        {i + 1}
                                    </span>
                                    <span className="flex-1">
                                        {labels.get(id)}
                                    </span>
                                    <GripVertical
                                        aria-hidden="true"
                                        className="text-muted-foreground"
                                    />
                                </Button>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                    {rest.length > 0 && (
                        <ul className="flex flex-col gap-3">
                            {rest.map((id) => (
                                <motion.li key={id} layoutId={id}>
                                    <Button
                                        variant="outline"
                                        className={CARD}
                                        onClick={() => place(id)}
                                    >
                                        <span className="size-7 shrink-0 rounded-full border border-astral-ink border-dashed" />
                                        <span className="flex-1">
                                            {labels.get(id)}
                                        </span>
                                    </Button>
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </LayoutGroup>
            </div>
            {rest.length === 0 && (
                <GoldButton
                    size="lg"
                    className="mt-2 rounded-full"
                    onClick={() => onRank(ranked)}
                >
                    Continuar
                </GoldButton>
            )}
        </fieldset>
    );
}
