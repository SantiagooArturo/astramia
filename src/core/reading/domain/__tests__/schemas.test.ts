import { describe, expect, it } from "vitest";
import { natalPlacements, sunSignOf } from "../chart";
import { cluesFor } from "../clues";
import { ageOn, describeProfile, describeSky } from "../prompts";
import {
    describeAnswer,
    isCompleteQuiz,
    LOVE_QUIZ,
    labelFor,
    optionLabel,
    optionsFor,
    pruneAnswers,
    QUIZ_LENGTH,
    questionFor,
    questionsFor,
    tratoOf,
} from "../quiz";
import { createReadingSchema, knownBirthDaySchema } from "../schemas";

import type { QuizAnswer } from "../types";

/** Each question's first option (a ranking, as listed), along their path. */
function firstOptions(): QuizAnswer[] {
    const path: QuizAnswer[] = [];
    for (const q of LOVE_QUIZ)
        if (questionsFor(path).includes(q))
            path.push(
                q.kind === "rank"
                    ? {
                          questionId: q.id,
                          ranking: optionsFor(q, path).map((o) => o.id),
                      }
                    : { questionId: q.id, optionId: optionsFor(q, path)[0].id },
            );
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
            "prioridades",
            "pregunta",
        ]);
        expect(QUIZ_LENGTH).toBe(8);
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
        expect(
            describeAnswer({ questionId: "necesidad", optionId: "libertad" })
                ?.answer,
        ).toBe("Espacio y libertad");
    });
});

describe("a ranking", () => {
    const order = ["proyectos", "gente", "amor", "libertad"];
    const ranked = (ranking: string[]) =>
        answers.map((a) =>
            a.questionId === "prioridades"
                ? { questionId: "prioridades", ranking }
                : a,
        );

    it("takes every option once, in any order", () => {
        expect(isCompleteQuiz(ranked(order))).toBe(true);
        expect(isCompleteQuiz(ranked(order.slice(0, 3)))).toBe(false);
        expect(
            isCompleteQuiz(ranked(["proyectos", "proyectos", "amor", "gente"])),
        ).toBe(false);
        expect(isCompleteQuiz(ranked([...order.slice(0, 3), "nope"]))).toBe(
            false,
        );
        // The first version's options are read, never taken anew.
        expect(
            isCompleteQuiz(ranked(["dinero", "familia", "amor", "amigos"])),
        ).toBe(false);
    });

    it("never takes one picked option, nor a ranking for a one-tap question", () => {
        expect(
            isCompleteQuiz(
                answers.map((a) =>
                    a.questionId === "prioridades"
                        ? { questionId: "prioridades", optionId: "amor" }
                        : a,
                ),
            ),
        ).toBe(false);
        expect(
            isCompleteQuiz(
                answers.map((a) =>
                    a.questionId === "pregunta"
                        ? { questionId: "pregunta", ranking: ["cuando"] }
                        : a,
                ),
            ),
        ).toBe(false);
    });

    it("reaches the prompt in order, love named as the reader saw it", () => {
        const inLove = ranked(order).map((a) =>
            a.questionId === "situacion" ? { ...a, optionId: "relacion" } : a,
        );
        const prioridades = inLove.find((a) => a.questionId === "prioridades");
        expect(prioridades && describeAnswer(prioridades, inLove)?.answer).toBe(
            "Mi carrera y mis proyectos > Familia y amigos > Mi relación > Mi libertad (de más a menos importante)",
        );
        expect(
            describeAnswer(
                { questionId: "prioridades", ranking: order },
                ranked(order),
            )?.answer,
        ).toContain("> Amor >");
        // A reading made with the first version still reads.
        expect(
            describeAnswer({
                questionId: "prioridades",
                ranking: ["dinero", "familia", "amor", "amigos"],
            })?.answer,
        ).toContain("Éxito financiero > Familia > Amor > Amigos");
    });

    it("tells the reading what weighs most and keeps it off what's last", () => {
        const clues = cluesFor([
            { questionId: "prioridades", ranking: order },
        ]).join(" | ");
        expect(clues).toContain("está construyendo algo propio");
        expect(clues).toContain("necesita escapar");
    });
});

/** Every way through the quiz: each answer to "where's your heart" and its follow-up. */
function everyPath(): QuizAnswer[][] {
    const situacion = LOVE_QUIZ.find((q) => q.id === "situacion");
    return (situacion?.options ?? []).flatMap((s) => {
        const start: QuizAnswer[] = [
            { questionId: "trato", optionId: "femenino" },
            { questionId: "situacion", optionId: s.id },
        ];
        const follow = questionsFor(start).find((q) => q.after);
        return (follow?.options ?? []).map((f) => [
            ...start,
            { questionId: follow?.id ?? "", optionId: f.id },
        ]);
    });
}

/** Everything a path shows after its follow-up, as text. */
function shown(path: QuizAnswer[]) {
    return questionsFor(path)
        .filter((q) => !path.some((a) => a.questionId === q.id))
        .map((q) => ({
            id: q.id,
            question: questionFor(q, path),
            options: optionsFor(q, path).map((o) => ({
                id: o.id,
                label: labelFor(o, path),
            })),
        }));
}

const has = (path: QuizAnswer[], questionId: string, optionId: string) =>
    path.some(
        (a) =>
            "optionId" in a &&
            a.questionId === questionId &&
            a.optionId === optionId,
    );

describe("every way through the quiz makes sense", () => {
    const paths = everyPath();

    it("covers all 23 of them, each question with options to choose from", () => {
        expect(paths).toHaveLength(23);
        for (const path of paths)
            for (const q of shown(path))
                expect(
                    q.options.length,
                    `${q.id} on ${JSON.stringify(path)}`,
                ).toBeGreaterThanOrEqual(3);
    });

    it("never asks about «that person» before they named one", () => {
        for (const path of paths) {
            // Only "single, nobody in mind" has named nobody: a partner, a crush,
            // an ex and a complicated someone are all "that person".
            const named = !has(path, "situacion", "soltera");
            if (named) continue;
            for (const q of shown(path)) {
                expect(q.question).not.toMatch(
                    /esa persona|tu pareja|lo nuestro/,
                );
                for (const o of q.options)
                    expect(o.label, q.id).not.toMatch(
                        /esa persona|lo nuestro|lo que tenemos|quedarme o irme/,
                    );
            }
        }
    });

    it("offers what a relationship does only to whoever had one", () => {
        for (const path of paths.filter((p) =>
            has(p, "ultimo_amor", "nunca"),
        )) {
            const herida = shown(path).find((q) => q.id === "herida");
            const ids = herida?.options.map((o) => o.id) ?? [];
            expect(ids).not.toContain("control");
            expect(ids).not.toContain("perder_me");
            expect(ids).toContain("nada");
        }
        for (const path of paths.filter((p) =>
            has(p, "situacion", "alguien"),
        )) {
            const ids =
                shown(path)
                    .find((q) => q.id === "herida")
                    ?.options.map((o) => o.id) ?? [];
            expect(ids).not.toContain("perder_me");
        }
    });

    it("asks whoever is happy together how to care for it, not whether to leave", () => {
        const happy = paths.find((p) => has(p, "como_estan", "muy_bien")) ?? [];
        const ids =
            shown(happy)
                .find((q) => q.id === "pregunta")
                ?.options.map((o) => o.id) ?? [];
        expect(ids).toContain("cuidar");
        expect(ids).not.toContain("quedarme");
        expect(ids).not.toContain("cuando");
    });

    it("drops answers a changed path no longer offers", () => {
        const inLove: QuizAnswer[] = [
            { questionId: "trato", optionId: "femenino" },
            { questionId: "situacion", optionId: "relacion" },
            { questionId: "como_estan", optionId: "dudas" },
            { questionId: "herida", optionId: "perder_me" },
            { questionId: "pregunta", optionId: "quedarme" },
        ];
        const nowSingle = pruneAnswers([
            ...inLove.filter(
                (a) =>
                    a.questionId !== "situacion" &&
                    a.questionId !== "como_estan",
            ),
            { questionId: "situacion", optionId: "soltera" },
            { questionId: "ultimo_amor", optionId: "nunca" },
        ]);
        expect(nowSingle.map((a) => a.questionId).sort()).toEqual([
            "situacion",
            "trato",
            "ultimo_amor",
        ]);
        expect(
            isCompleteQuiz([
                ...answers.filter((a) => a.questionId !== "pregunta"),
                { questionId: "pregunta", optionId: "quedarme" },
            ]),
        ).toBe(false);
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
        expect(
            describeAnswer({ questionId: "necesidad", optionId: "seguridad" })
                ?.answer,
        ).toBe("Sentir seguridad");
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
