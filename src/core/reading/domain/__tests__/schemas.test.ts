import { describe, expect, it } from "vitest";
import { natalPlacements, sunSignOf } from "../chart";
import { describeProfile, describeSky } from "../prompts";
import { LOVE_QUIZ } from "../quiz";
import { createReadingSchema } from "../schemas";

const answers = LOVE_QUIZ.map((q) => ({
    questionId: q.id,
    optionId: q.options[0].id,
}));

describe("createReadingSchema", () => {
    it("accepts a complete questionnaire", () => {
        const r = createReadingSchema.safeParse({
            topic: "amor",
            birthDate: "1995-08-14",
            birthTime: "07:30",
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

    it("rejects a repeated question", () => {
        const r = createReadingSchema.safeParse({
            topic: "amor",
            birthDate: "1995-08-14",
            answers: [...answers.slice(1), answers[1]],
        });
        expect(r.success).toBe(false);
    });
});

describe("chart", () => {
    it("finds the sun sign", () => {
        expect(sunSignOf("1995-08-14")).toBe("Leo");
    });

    it("places the sun in the same sign the calendar gives", () => {
        const [sun] = natalPlacements("1995-08-14", null);
        expect(sun.sign).toBe("Leo");
    });

    it("describes the profile with the chosen answers", () => {
        const text = describeProfile({
            birthDate: "1995-08-14",
            birthTime: null,
            birthPlace: "Lima",
            answers,
        });
        expect(text).toContain("Lima");
        // The form of address is an instruction, not one of the answers.
        expect(text).toContain("<trato>\nHáblale en femenino.");
        expect(text).not.toContain(LOVE_QUIZ[0].options[0].label);
        expect(text).toContain(LOVE_QUIZ[1].options[0].label);
    });

    it("tells the model when the Moon sign is a guess", () => {
        const text = describeProfile({
            birthDate: "1992-05-08",
            birthTime: null,
            birthPlace: null,
            answers,
        });
        expect(text).toContain("Luna en Cáncer o en Leo: incierta");
    });

    it("hands the model real Venus dates instead of letting it guess", () => {
        const sky = describeSky(
            {
                birthDate: "1995-10-10",
                birthTime: "10:00",
                birthPlace: null,
                answers,
            },
            new Date("2026-10-14T15:00:00Z"),
        );
        expect(sky).toContain("Hoy es 14 de octubre de 2026");
        expect(sky).toContain("Venus está retrógrada en Escorpio");
        expect(sky).toContain(
            "- finales de octubre: Venus entra en Libra (tu signo solar)",
        );
    });
});
