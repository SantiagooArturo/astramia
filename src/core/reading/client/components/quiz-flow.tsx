"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { GoldButton } from "@/core/landing/client/effects";
import { MONTHS_ES } from "@/core/landing/domain/zodiac";
import { natalChart } from "@/core/reading/domain/chart";
import {
    optionLabel,
    type QuizQuestion,
    questionsFor,
    quizLength,
    tratoOf,
} from "@/core/reading/domain/quiz";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/frontend/components/ui/select";
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

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

/** "YYYY-MM-DD" from the three fields, or what to fix. */
function toBirthDate(birth: {
    day: string;
    month: string;
    year: string;
}): { date: string } | { error: string } {
    const { day, month, year } = birth;
    if (!day || !month || !/^\d{4}$/.test(year))
        return { error: "Completa tu fecha de nacimiento: día, mes y año" };
    const last = new Date(
        Date.UTC(Number(year), Number(month), 0),
    ).getUTCDate();
    if (Number(day) > last)
        return {
            error: `En ${year}, ${MONTHS_ES[Number(month) - 1]} tuvo ${last} días`,
        };
    return {
        date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    };
}

export function QuizFlow({
    topic,
    questions,
    knownBirthDay,
}: {
    topic: ReadingTopic;
    questions: readonly QuizQuestion[];
    /** Day and month they gave on the landing: pre-filled, still editable. */
    knownBirthDay?: { day: number; month: number };
}) {
    const router = useRouter();
    const create = useReadings().useCreate();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [birth, setBirth] = useState({
        day: knownBirthDay ? String(knownBirthDay.day) : "",
        month: knownBirthDay ? String(knownBirthDay.month) : "",
        year: "",
        time: "",
        place: "",
    });
    const yearRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);
    /** Their chart, drawn while the hook is being written. */
    const [revealing, setRevealing] = useState<{
        chart: NatalChart;
        birthDate: string;
    } | null>(null);

    // Follow-ups join the list once the answer they follow is in.
    const asked = questionsFor(answers, questions);
    const total = quizLength(questions) + 1;
    const question = asked[step];
    const trato = tratoOf(answers);
    const onBirthStep = !question;

    // Only the year is missing: go straight to it.
    useEffect(() => {
        if (onBirthStep && knownBirthDay) yearRef.current?.focus();
    }, [onBirthStep, knownBirthDay]);

    function choose(optionId: string) {
        const next = [
            ...answers.filter((a) => a.questionId !== question.id),
            { questionId: question.id, optionId },
        ];
        // Back and changed: the follow-up of the old answer goes with it.
        const stillAsked = new Set(
            questionsFor(next, questions).map((q) => q.id),
        );
        setAnswers(next.filter((a) => stillAsked.has(a.questionId)));
        setStep(step + 1);
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        const birthDate = toBirthDate(birth);
        if ("error" in birthDate) {
            toast.error(birthDate.error);
            return;
        }
        const parsed = createReadingSchema.safeParse({
            topic,
            birthDate: birthDate.date,
            birthTime: birth.time || undefined,
            birthTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
                parsed.data.birthTimeZone,
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
                                    {optionLabel(option.label, trato)}
                                </Button>
                            );
                        })}
                    </div>
                </fieldset>
            ) : (
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div>
                        <h2 className="text-pretty font-display text-3xl sm:text-4xl">
                            {knownBirthDay
                                ? "Solo falta el año"
                                : "¿Cuándo naciste?"}
                        </h2>
                        <p className="mt-2 text-muted-foreground text-sm">
                            {knownBirthDay
                                ? "El día y el mes ya nos los diste. Con el año ubicamos tu Venus y tu Marte; con la hora, si la sabes, tu Luna queda exacta."
                                : "Con la fecha basta. Si sabes la hora, tu Luna queda exacta."}
                        </p>
                    </div>
                    <fieldset className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-3">
                        <legend className="sr-only">Fecha de nacimiento</legend>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="birth-day">Día</Label>
                            <Select
                                value={birth.day}
                                onValueChange={(day) =>
                                    setBirth({ ...birth, day })
                                }
                            >
                                <SelectTrigger
                                    id="birth-day"
                                    className="w-full font-mono"
                                >
                                    <SelectValue placeholder="--" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS.map((d) => (
                                        <SelectItem
                                            key={d}
                                            value={d}
                                            className="font-mono"
                                        >
                                            {d.padStart(2, "0")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="birth-month">Mes</Label>
                            <Select
                                value={birth.month}
                                onValueChange={(month) =>
                                    setBirth({ ...birth, month })
                                }
                            >
                                <SelectTrigger
                                    id="birth-month"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MONTHS_ES.map((name, i) => (
                                        <SelectItem
                                            key={name}
                                            value={String(i + 1)}
                                        >
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="birth-year">Año</Label>
                            <Input
                                id="birth-year"
                                ref={yearRef}
                                inputMode="numeric"
                                autoComplete="bday-year"
                                placeholder="1995"
                                maxLength={4}
                                required
                                className="font-mono"
                                value={birth.year}
                                onChange={(e) =>
                                    setBirth({
                                        ...birth,
                                        year: e.target.value.replace(/\D/g, ""),
                                    })
                                }
                            />
                        </div>
                    </fieldset>
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
