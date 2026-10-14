"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { GoldButton } from "@/core/landing/client/effects";
import { natalChart } from "@/core/reading/domain/chart";
import type { LOVE_QUIZ } from "@/core/reading/domain/quiz";
import {
    createdReadingSchema,
    createReadingSchema,
} from "@/core/reading/domain/schemas";
import type {
    NatalChart,
    QuizAnswer,
    ReadingTopic,
} from "@/core/reading/domain/types";
import { authClient } from "@/frontend/auth/auth";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Spinner } from "@/frontend/components/ui/spinner";
import { useReadings } from "../hooks";
import { ChartReveal } from "./chart-reveal";

/** Anonymous session first, so the reading has an owner without a sign-up. */
async function ensureSession(): Promise<void> {
    const { data } = await authClient.getSession();
    if (data) return;
    const { error } = await authClient.signIn.anonymous();
    if (error) throw new Error(error.message ?? "No pudimos iniciar tu sesión");
}

export function QuizFlow({
    topic,
    questions,
}: {
    topic: ReadingTopic;
    questions: typeof LOVE_QUIZ;
}) {
    const router = useRouter();
    const create = useReadings().useCreate();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [birth, setBirth] = useState({ date: "", time: "", place: "" });
    const [submitting, setSubmitting] = useState(false);
    /** Their chart, drawn while the hook is being written. */
    const [revealing, setRevealing] = useState<{
        chart: NatalChart;
        birthDate: string;
    } | null>(null);

    const total = questions.length + 1;
    const question = questions[step];

    function choose(optionId: string) {
        const next = [
            ...answers.filter((a) => a.questionId !== question.id),
            { questionId: question.id, optionId },
        ];
        setAnswers(next);
        setStep(step + 1);
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        const parsed = createReadingSchema.safeParse({
            topic,
            birthDate: birth.date,
            birthTime: birth.time || undefined,
            birthPlace: birth.place.trim() || undefined,
            answers,
        });
        if (!parsed.success) {
            toast.error(
                parsed.error.issues[0]?.message ??
                    "Revisa tus datos de nacimiento",
            );
            return;
        }
        setSubmitting(true);
        setRevealing({
            chart: natalChart(
                parsed.data.birthDate,
                parsed.data.birthTime ?? null,
            ),
            birthDate: parsed.data.birthDate,
        });
        try {
            await ensureSession();
            // Eden only infers 200 bodies; the 201 envelope is parsed here.
            const { response } = z
                .object({ response: createdReadingSchema })
                .parse(await create.mutateAsync(parsed.data));
            router.push(`/lectura/r/${response.id}`);
        } catch {
            toast.error(
                "No pudimos preparar tu lectura. Inténtalo de nuevo en un momento.",
            );
            setRevealing(null);
            setSubmitting(false);
        }
    }

    if (revealing)
        return (
            <ChartReveal
                chart={revealing.chart}
                birthDate={revealing.birthDate}
                mode="teaser"
            />
        );

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
                {step > 0 && !submitting && (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Pregunta anterior"
                        onClick={() => setStep(step - 1)}
                    >
                        <ArrowLeft />
                    </Button>
                )}
                <div
                    className="h-1 flex-1 overflow-hidden rounded-full bg-astral-ink"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={step + 1}
                >
                    <div
                        className="h-full bg-astral-gold transition-[width] duration-500"
                        style={{ width: `${((step + 1) / total) * 100}%` }}
                    />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground tracking-[0.16em]">
                    {step + 1}/{total}
                </span>
            </div>

            {question ? (
                <fieldset className="flex flex-col gap-5">
                    <legend className="mb-5 text-pretty font-display text-3xl sm:text-4xl">
                        {question.question}
                    </legend>
                    <div className="flex flex-col gap-3">
                        {question.options.map((option) => {
                            const selected = answers.some(
                                (a) =>
                                    a.questionId === question.id &&
                                    a.optionId === option.id,
                            );
                            return (
                                <Button
                                    key={option.id}
                                    variant="outline"
                                    aria-pressed={selected}
                                    className="h-auto justify-start whitespace-normal border-astral-ink bg-card/40 px-5 py-4 text-left text-base aria-pressed:border-astral-gold"
                                    onClick={() => choose(option.id)}
                                >
                                    {option.label}
                                </Button>
                            );
                        })}
                    </div>
                </fieldset>
            ) : (
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div>
                        <h2 className="text-pretty font-display text-3xl sm:text-4xl">
                            ¿Cuándo naciste?
                        </h2>
                        <p className="mt-2 text-muted-foreground text-sm">
                            Con la fecha basta. La hora y el lugar afinan tu
                            Luna, si los sabes.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="birth-date">Fecha de nacimiento</Label>
                        <Input
                            id="birth-date"
                            type="date"
                            required
                            value={birth.date}
                            onChange={(e) =>
                                setBirth({ ...birth, date: e.target.value })
                            }
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="birth-time">Hora (opcional)</Label>
                            <Input
                                id="birth-time"
                                type="time"
                                value={birth.time}
                                onChange={(e) =>
                                    setBirth({ ...birth, time: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="birth-place">
                                Ciudad (opcional)
                            </Label>
                            <Input
                                id="birth-place"
                                maxLength={120}
                                placeholder="Lima"
                                value={birth.place}
                                onChange={(e) =>
                                    setBirth({
                                        ...birth,
                                        place: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                    <GoldButton
                        type="submit"
                        size="lg"
                        disabled={submitting}
                        className="rounded-full"
                    >
                        {submitting ? (
                            <>
                                <Spinner /> Leyendo tu carta…
                            </>
                        ) : (
                            "Ver mi lectura"
                        )}
                    </GoldButton>
                </form>
            )}
        </div>
    );
}
