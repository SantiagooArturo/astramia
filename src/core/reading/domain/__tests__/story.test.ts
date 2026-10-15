import { describe, expect, it } from "vitest";
import { natalChart, readingOutlook } from "../chart";
import { SAMPLE_READING, SAMPLE_SCENES } from "../sample-reading";
import {
    buildStory,
    previewStory,
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
        // No title alone on an empty screen: each heading leads its text.
        expect(story.steps.some((s) => s.kind === "chapter")).toBe(false);
        expect(
            story.steps.flatMap((s) =>
                s.kind === "paragraph" && s.heading ? [s.heading] : [],
            ),
        ).toEqual([
            "Entras corriendo, sales caminando",
            "Lo que tu calma necesita",
            "Lo que tu carta sí puede decirte",
            "Lo que viene",
            "Para este martes",
        ]);
    });

    it("starts with the teaser, then the opening, over their solar system", () => {
        const [prologue, opening] = story.steps;
        expect(prologue).toMatchObject({
            kind: "prologue",
            text: SAMPLE_READING.teaser,
            visual: { kind: "system" },
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
            "Había Luna menguante",
            "note:Qué es",
            "La Luna estaba en Capricornio",
            "El Sol estaba en Piscis",
            "paragraph",
            "paragraph",
        ]);
        expect(second[0].visual).toEqual({
            kind: "moonPhase",
            phase: "Luna menguante",
        });
        // The text stays over the last thing it was introduced with.
        expect(second[4].visual).toMatchObject({ kind: "planet", body: "Sol" });
        // Planets share the stage with the solar system: no cut between them.
        expect(visualKey(second[4].visual)).toBe("system");
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
        expect(story.steps.at(-1)).toMatchObject({
            kind: "closing",
            text: "Lo que es para ti no necesita que corras: necesita que lo veas venir.",
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
        const glue = buildStory(input({ content: glued }));
        expect(glue.steps.at(-1)).toEqual(story.steps.at(-1));
        expect(glue.steps.at(-2)).toMatchObject({
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
            "closing",
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

describe("buildStory, a reading written per scene", () => {
    const scenes = buildStory(
        input({ content: JSON.stringify(SAMPLE_SCENES) }),
    );
    const at = (chapter: number | null) =>
        scenes.steps.filter((s) => s.chapter === chapter);

    it("shows each body with its own text, then the two together", () => {
        expect(
            at(0).map((s) => (s.kind === "scene" ? s.title : s.kind)),
        ).toEqual([
            "Venus estaba en Aries",
            "Marte estaba en Sagitario",
            "Venus y Marte",
        ]);
        expect(at(0).map((s) => s.visual)).toEqual([
            { kind: "planet", body: "Venus", sign: "Aries" },
            { kind: "planet", body: "Marte", sign: "Sagitario" },
            { kind: "pair", bodies: ["Venus", "Marte"] },
        ]);
        expect(at(0).map((s) => s.kind === "scene" && s.text)).toEqual([
            SAMPLE_SCENES.venus,
            SAMPLE_SCENES.mars,
            SAMPLE_SCENES.venusMars,
        ]);
    });

    it("puts what the Moon phase is next to what it says about them", () => {
        const [phase, moon, sun, pair] = at(1);
        expect(phase).toMatchObject({
            kind: "scene",
            title: "Había Luna menguante",
            note: expect.stringMatching(/^Queda un hilo de luz/),
            text: SAMPLE_SCENES.moonPhase,
        });
        expect(moon).toMatchObject({ title: "La Luna estaba en Capricornio" });
        expect(sun).toMatchObject({
            eyebrow: "Por eso eres Piscis",
            title: "El Sol estaba en Piscis",
        });
        expect(pair.visual).toEqual({ kind: "pair", bodies: ["Luna", "Sol"] });
    });

    it("has no title alone on an empty screen", () => {
        expect(scenes.steps.some((s) => s.kind === "chapter")).toBe(false);
        expect(scenes.steps.some((s) => s.kind === "title")).toBe(false);
    });

    it("splits a long answer over two screens under their question", () => {
        const [first, second] = at(2);
        expect(first).toMatchObject({
            kind: "scene",
            title: "¿Cuándo llega alguien para mí?",
        });
        expect(second).toMatchObject({ kind: "paragraph" });
        expect(
            [first, second]
                .map((s) =>
                    s.kind === "scene" || s.kind === "paragraph" ? s.text : "",
                )
                .join(" "),
        ).toBe(SAMPLE_SCENES.question);
    });

    it("moves Venus to each moment as it's read", () => {
        expect(at(3).map((s) => s.visual)).toEqual(
            SAMPLE_SCENES.moments.map((m) => ({
                kind: "venusPath",
                events: skyAhead,
                focus: m.event - 1,
            })),
        );
        expect(new Set(at(3).map((s) => visualKey(s.visual))).size).toBe(1);
    });

    it("drops a moment that points to no event", () => {
        const story = buildStory(
            input({
                content: JSON.stringify({
                    ...SAMPLE_SCENES,
                    moments: [
                        { event: 9, text: "Nunca." },
                        ...SAMPLE_SCENES.moments,
                    ],
                }),
            }),
        );
        expect(
            story.steps.some((s) => s.kind === "scene" && s.text === "Nunca."),
        ).toBe(false);
    });

    it("ends on the closing line, under the gesture's star", () => {
        expect(scenes.steps.slice(-2)).toMatchObject([
            { kind: "scene", text: SAMPLE_SCENES.gesture },
            {
                kind: "closing",
                text: SAMPLE_SCENES.closing,
                visual: { kind: "star" },
            },
        ]);
    });
});

describe("the preview, before paying", () => {
    const preview = previewStory({
        teaser: SAMPLE_READING.teaser,
        chart,
        question: "¿Cuándo llega alguien para mí?",
    });

    it("starts the same story and stops at Venus, without landing", () => {
        expect(preview.steps.map((s) => s.kind)).toEqual([
            "prologue",
            "scene",
            "door",
        ]);
        expect(preview.steps[0].visual).toEqual({ kind: "system" });
        expect(preview.steps[1]).toMatchObject({
            title: "Venus estaba en Aries",
            visual: {
                kind: "planet",
                body: "Venus",
                sign: "Aries",
                approach: true,
            },
        });
        // The camera stays on the same stage as the paid story.
        expect(visualKey(preview.steps[1].visual)).toBe("system");
        expect(preview.steps[2].visual).toEqual(preview.steps[1].visual);
    });

    it("says what the reading holds, their own question included", () => {
        const door = preview.steps[2];
        expect(door.kind === "door" && door.inside).toContain(
            "Tu pregunta: ¿Cuándo llega alguien para mí?",
        );
    });
});
