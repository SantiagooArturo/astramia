import { describe, expect, it } from "vitest";
import { natalChart, readingOutlook } from "../chart";
import { SAMPLE_READING } from "../sample-reading";
import {
    buildStory,
    type StoryInput,
    storyQuestion,
    visualKey,
} from "../story";

const chart = natalChart(
    SAMPLE_READING.birthDate,
    SAMPLE_READING.birthTime,
    SAMPLE_READING.birthTimeZone,
);
const skyAhead = readingOutlook(
    SAMPLE_READING,
    new Date(SAMPLE_READING.writtenAt),
).events;

function input(overrides: Partial<StoryInput> = {}): StoryInput {
    return {
        teaser: SAMPLE_READING.teaser,
        content: SAMPLE_READING.content,
        chart,
        question: storyQuestion(SAMPLE_READING.answers),
        skyAhead,
        ...overrides,
    };
}

describe("buildStory", () => {
    const story = buildStory(input());

    it("tells the five sections as chapters, in the prompt's order", () => {
        expect(story.chapters).toEqual([
            { numeral: "I", label: "Cómo amas" },
            { numeral: "II", label: "Lo que necesitas" },
            { numeral: "III", label: "Tu pregunta" },
            { numeral: "IV", label: "Lo que viene" },
            { numeral: "V", label: "Un gesto" },
        ]);
        expect(
            story.steps.filter((s) => s.kind === "chapter").map((s) => s.title),
        ).toEqual([
            "Entras corriendo, sales caminando",
            "Lo que tu calma necesita",
            "Lo que tu carta sí puede decirte",
            "Lo que viene",
            "Para este martes",
        ]);
    });

    it("starts with the teaser, then the opening, over their sky", () => {
        const [prologue, opening] = story.steps;
        expect(prologue).toMatchObject({
            kind: "prologue",
            text: SAMPLE_READING.teaser,
            visual: { kind: "sky" },
            chapter: null,
        });
        expect(opening).toMatchObject({ kind: "paragraph", chapter: null });
        expect(opening.kind === "paragraph" && opening.text).toMatch(
            /^Hoy manda la que se apura/,
        );
    });

    it("shows the Moon's phase before explaining it, then the Moon and the Sun", () => {
        const second = story.steps.filter((s) => s.chapter === 1);
        expect(
            second.map((s) =>
                s.kind === "title"
                    ? s.title
                    : s.kind === "note"
                      ? `note:${s.label}`
                      : s.kind,
            ),
        ).toEqual([
            "chapter",
            "Había Luna menguante",
            "note:Qué es",
            "La Luna estaba en Capricornio",
            "El Sol estaba en Piscis",
            "paragraph",
            "paragraph",
        ]);
        // The card opens on a quiet night: the Moon starts with its title.
        expect(second[0].visual).toEqual({ kind: "night" });
        expect(second[1].visual).toEqual({
            kind: "moonPhase",
            phase: "Luna menguante",
        });
        // The text stays over the last thing it was introduced with.
        expect(visualKey(second[5].visual)).toBe("planet:Sol");
    });

    it("introduces Venus and Mars with their signs", () => {
        const titles = story.steps.filter(
            (s) => s.chapter === 0 && s.kind === "title",
        );
        expect(titles.map((s) => s.visual)).toEqual([
            { kind: "planet", body: "Venus", sign: "Aries" },
            { kind: "planet", body: "Marte", sign: "Sagitario" },
        ]);
    });

    it("says their question back and draws the months ahead", () => {
        expect(
            story.steps.find((s) => s.chapter === 2 && s.kind === "title"),
        ).toMatchObject({ title: "¿Cuándo llega alguien para mí?" });
        const path = story.steps.find(
            (s) => s.chapter === 3 && s.kind === "title",
        );
        expect(path?.visual).toEqual({ kind: "venusPath", events: skyAhead });
        expect(skyAhead.map((e) => e.when)).toEqual([
            "finales de octubre",
            "mediados de noviembre",
            "principios de diciembre",
            "principios de enero",
        ]);
    });

    it("ends on the bold line, taken out of the last chapter", () => {
        const last = story.steps.at(-1);
        expect(last).toMatchObject({
            kind: "quote",
            text: "Lo que es para ti no necesita que corras: necesita que lo veas venir.",
            visual: { kind: "dawn" },
        });
        expect(
            story.steps.some(
                (s) => s.kind === "paragraph" && s.text.includes("**"),
            ),
        ).toBe(false);
    });

    it("splits a bold line glued to the last paragraph", () => {
        const glued = SAMPLE_READING.content.replace(
            "bonito.\n\n**",
            "bonito. **",
        );
        const steps = buildStory(input({ content: glued })).steps;
        expect(steps.at(-1)).toMatchObject({ kind: "quote" });
        expect(steps.at(-2)).toMatchObject({
            kind: "paragraph",
            text: expect.stringMatching(/mensaje bonito\.$/),
        });
    });

    it("skips what it can't show: no question, no sky ahead", () => {
        const steps = buildStory(input({ question: null, skyAhead: [] })).steps;
        expect(
            steps.filter(
                (s) =>
                    (s.chapter === 2 || s.chapter === 3) && s.kind === "title",
            ),
        ).toEqual([]);
    });

    it("names a Moon that changed sign that day as uncertain", () => {
        const noTime = natalChart("2001-02-21", null, "America/Lima");
        const steps = buildStory(input({ chart: noTime })).steps;
        const moon = steps.find(
            (s) => s.kind === "title" && s.title.startsWith("La Luna estaba"),
        );
        if (noTime.moonRange)
            expect(moon).toMatchObject({
                title: `La Luna estaba entre ${noTime.moonRange.early} y ${noTime.moonRange.late}`,
            });
        else
            expect(moon).toMatchObject({
                title: expect.stringMatching(/^La Luna estaba en /),
            });
    });

    it("still tells a text that doesn't follow the five sections", () => {
        const story = buildStory(
            input({
                content:
                    "Apertura.\n\n## Uno\nPrimero.\n\n## Dos\nSegundo.\n\n**Cierre.**",
            }),
        );
        expect(story.chapters).toEqual([
            { numeral: "I", label: "Uno" },
            { numeral: "II", label: "Dos" },
        ]);
        expect(story.steps.map((s) => s.kind)).toEqual([
            "prologue",
            "paragraph",
            "chapter",
            "paragraph",
            "chapter",
            "paragraph",
            "quote",
        ]);
        expect(story.steps.some((s) => s.kind === "title")).toBe(false);
    });
});

describe("storyQuestion", () => {
    it("says their first question back as a question", () => {
        expect(
            storyQuestion([{ questionId: "pregunta", optionId: "quedarme" }]),
        ).toBe("¿Me quedo o me voy?");
        expect(storyQuestion([])).toBeNull();
    });
});
