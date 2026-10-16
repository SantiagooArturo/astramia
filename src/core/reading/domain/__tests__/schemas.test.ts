import { describe, expect, it } from "vitest";
import { natalPlacements, sunSignOf } from "../chart";
import { cluesFor } from "../clues";
import { ageOn, describeProfile, describeSky } from "../prompts";
import {
    describeAnswer,
    isCompleteQuiz,
    LOVE_QUIZ,
    optionLabel,
    QUIZ_LENGTH,
    questionsFor,
    tratoOf,
} from "../quiz";
import { createReadingSchema, knownBirthDaySchema } from "../schemas";

import type { QuizAnswer } from "../types";

/** Each question's first option, along the path those answers lead to. */
function firstOptions(): QuizAnswer[] {
    const path: QuizAnswer[] = [];
    for (const q of LOVE_QUIZ)
        if (questionsFor(path).includes(q))
            path.push({ questionId: q.id, optionId: q.options[0].id });
    return path;
}

const answers = firstOptions();

describe("createReadingSchema", () => {
    it("accepts a complete questionnaire", () => {
        const r = createReadingSchema.safeParse({
            topic: "amor",
            birthDate: "1995-08-14",
            birthTime: "07:30",
            birthTimeZone: "America/Lima",
            answers,
        });
        expect(r.success).toBe(true);
    });

    it("rejects minors", () => {
        const year = new Date().getUTCFullYear() - 10;
        const r = createReadingSchema.safeParse({
            topic: "amor",
            birthDate: `${year}-01-01`,
            answers,
        });
        expect(r.success).toBe(false);
    });

    it("rejects options that are not in the quiz", () => {
        const r = createReadingSchema.safeParse({
            topic: "amor",
            birthDate: "1995-08-14",
            answers: [
                ...answers.slice(1),
                { questionId: answers[0].questionId, optionId: "nope" },
            ],
        });
        expect(r.success).toBe(false);
    });

    it("rejects a follow-up left from an answer they changed", () => {
        // They said "single", then went back to "someone I like".
        const changed = answers.map((a) =>
            a.questionId === "situacion" ? { ...a, optionId: "alguien" } : a,
        );
        expect(isCompleteQuiz(changed)).toBe(false);
        const r = createReadingSchema.safeParse({
            topic: "amor",
            birthDate: "1995-08-14",
            answers: changed,
        });
        expect(r.success).toBe(false);
    });

    it("rejects a repeated question", () => {
        const r = createReadingSchema.safeParse({
            topic: "amor",
            birthDate: "1995-08-14",
            answers: [...answers.slice(1), answers[1]],
        });
        expect(r.success).toBe(false);
    });
});

describe("the questionnaire", () => {
    it("asks one follow-up, the one for where their heart is", () => {
        expect(questionsFor([]).map((q) => q.id)).not.toContain("ultimo_amor");
        const single = questionsFor([
            { questionId: "situacion", optionId: "soltera" },
        ]).map((q) => q.id);
        expect(single).toEqual([
            "trato",
            "situacion",
            "ultimo_amor",
            "patron",
            "espera",
            "herida",
            "pregunta",
        ]);
        expect(QUIZ_LENGTH).toBe(7);
    });

    it("has a follow-up for every answer about where their heart is", () => {
        const situacion = LOVE_QUIZ.find((q) => q.id === "situacion");
        for (const option of situacion?.options ?? [])
            expect(
                questionsFor([
                    { questionId: "situacion", optionId: option.id },
                ]),
            ).toHaveLength(QUIZ_LENGTH);
    });

    it("still reads what older readings answered", () => {
        expect(describeAnswer("necesidad", "libertad")?.answer).toBe(
            "Espacio y libertad",
        );
    });
});

/** A fixed "today", so ages in the prompt don't drift with the calendar. */
const TODAY = new Date("2026-10-16T12:00:00Z");

describe("chart", () => {
    it("finds the sun sign", () => {
        expect(sunSignOf("1995-08-14")).toBe("Leo");
    });

    it("places the sun in the same sign the calendar gives", () => {
        const [sun] = natalPlacements("1995-08-14", null);
        expect(sun.sign).toBe("Leo");
    });

    it("describes the profile with the chosen answers", () => {
        const text = describeProfile(
            {
                birthDate: "1995-08-14",
                birthTime: null,
                birthTimeZone: null,
                birthPlace: "Lima",
                answers,
            },
            TODAY,
        );
        expect(text).toContain("Lima");
        // The form of address is an instruction, not one of the answers.
        expect(text).toContain("<trato>\nHáblale en femenino");
        expect(text).not.toContain("En femenino");
        // Answers reach the model in the reader's own trato.
        expect(text).toContain("Sola, y sin nadie en mente");
    });

    it("speaks to a man in masculine, in the quiz and in the prompt", () => {
        const asMan = answers.map((a) =>
            a.questionId === "trato" ? { ...a, optionId: "masculino" } : a,
        );
        expect(tratoOf(asMan)).toBe("masculino");
        const text = describeProfile(
            {
                birthDate: "1995-08-14",
                birthTime: null,
                birthTimeZone: null,
                birthPlace: null,
                answers: asMan,
            },
            TODAY,
        );
        expect(text).toContain("<trato>\nHáblale en masculino");
        expect(text).toContain("Solo, y sin nadie en mente");
        expect(text).not.toMatch(/\bSola\b|segura|controlada/);
        expect(describeAnswer("necesidad", "seguridad", "neutro")?.answer).toBe(
            "Sentir seguridad",
        );
    });

    it("gives the model their age and what usually comes with their answers", () => {
        const text = describeProfile(
            {
                birthDate: "1995-10-20",
                birthTime: null,
                birthTimeZone: null,
                birthPlace: null,
                answers,
            },
            TODAY,
        );
        // Their birthday is still to come this year.
        expect(text).toContain("Tiene 30 años.");
        expect(ageOn("1995-10-16", TODAY)).toBe(31);
        expect(text).toMatch(/<pistas>\n[^<]*\n- /);
        // One step beyond each answer, never the answer itself.
        for (const clue of cluesFor(answers)) expect(text).toContain(clue);
    });

    it("never offers a mixed-gender option label", () => {
        for (const trato of ["femenino", "masculino", "neutro"] as const)
            for (const q of LOVE_QUIZ)
                for (const o of q.options)
                    expect(optionLabel(o.label, trato)).not.toMatch(
                        /\b(\w+)a o \1o\b/,
                    );
    });

    it("tells the model when the Moon sign is a guess", () => {
        const text = describeProfile(
            {
                birthDate: "1992-05-08",
                birthTime: null,
                birthTimeZone: null,
                birthPlace: null,
                answers,
            },
            TODAY,
        );
        expect(text).toContain("Luna en Cáncer o en Leo: incierta");
    });

    it("hands the model real Venus dates instead of letting it guess", () => {
        const sky = describeSky(
            {
                birthDate: "1995-10-10",
                birthTime: "10:00",
                birthTimeZone: null,
                birthPlace: null,
                answers,
            },
            new Date("2026-10-14T15:00:00Z"),
        );
        expect(sky).toContain("Hoy es 14 de octubre de 2026");
        expect(sky).toContain("Venus está retrógrada en Escorpio");
        expect(sky).toContain(
            "1. finales de octubre: Venus entra en Libra (tu signo solar)",
        );
    });
});

describe("knownBirthDaySchema", () => {
    it("carries the landing's day and month into the quiz", () => {
        expect(knownBirthDaySchema.parse({ dia: "29", mes: "2" })).toEqual({
            day: 29,
            month: 2,
        });
    });

    it("ignores a missing or impossible day", () => {
        expect(knownBirthDaySchema.safeParse({}).success).toBe(false);
        expect(
            knownBirthDaySchema.safeParse({ dia: "31", mes: "4" }).success,
        ).toBe(false);
        expect(
            knownBirthDaySchema.safeParse({ dia: "x", mes: "4" }).success,
        ).toBe(false);
    });
});
