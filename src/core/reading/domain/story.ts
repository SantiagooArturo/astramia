import type { MoonPhaseName } from "@/core/landing/domain/ephemeris";
import { toReadingBlocks } from "./markdown";
import { parseScenes } from "./reading-content";
import type { NatalChart, QuizAnswer, ReadingScenes, SkyEvent } from "./types";

/**
 * The paid reading as a story told on scroll: each idea is shown (the Moon
 * settling on the phase they were born under, Venus over its sign) while
 * its text is read.
 *
 * The visuals come from the chart, never from the model, so they can't
 * contradict the sky. Readings written per scene (`readingScenesSchema`)
 * put each text next to its body; older Markdown readings are split along
 * the five sections their prompt asked for.
 */

export type StoryBody = "Sol" | "Luna" | "Venus" | "Marte";

/** Right after the free paragraph: where a buyer lands to keep reading. */
export const CONTINUE_ANCHOR = "sigue";

export type StoryVisual =
    /** The solar system the day they were born, seen from afar. */
    | { kind: "system" }
    /** Their chart with its tensions (aspects) lit. */
    | { kind: "wheel" }
    | {
          kind: "planet";
          body: StoryBody;
          sign: string;
          /** Unknown birth time and the Moon changed sign that day. */
          signs?: readonly [string, string];
          /**
           * The camera only heads for it: the line of sight, no landing.
           * Where the preview stops, before the reading is bought.
           */
          approach?: boolean;
      }
    /** Two bodies side by side: what they do together. */
    | { kind: "pair"; bodies: readonly [StoryBody, StoryBody] }
    /** A lunar month that comes to rest on their phase. */
    | { kind: "moonPhase"; phase: MoonPhaseName }
    /** Venus over the months ahead; `focus` is where it is (an event index). */
    | { kind: "venusPath"; events: readonly SkyEvent[]; focus?: number }
    | { kind: "star" };

/** A body shown with its title, and the model's text about it. */
type SceneStep = {
    kind: "scene";
    eyebrow?: string;
    title?: string;
    /** A fixed fact about what's on screen (what that Moon phase is). */
    note?: string;
    text: string;
};
/** Older readings: a concept shown before the text uses it. */
type TitleStep = {
    kind: "title";
    eyebrow: string;
    title: string;
    line?: string;
};
type NoteStep = { kind: "note"; label: string; text: string };
type Intro = (TitleStep | NoteStep) & { visual: StoryVisual };

export type StoryStep = { visual: StoryVisual; chapter: number | null } & (
    | { kind: "prologue"; text: string }
    | { kind: "chapter"; numeral: string; label: string; title: string }
    | SceneStep
    | TitleStep
    | NoteStep
    | { kind: "paragraph"; text: string; heading?: string }
    /**
     * Where the preview stops: the first body, what the reading holds, and
     * under it the page's own box (unlock it, or "it's being written").
     */
    | { kind: "door"; eyebrow: string; title: string; inside: string[] }
    /** The reading's last line: the story ends here, before the chat. */
    | { kind: "closing"; text: string }
);

export interface StoryChapter {
    numeral: string;
    label: string;
}

export interface Story {
    chapters: StoryChapter[];
    steps: StoryStep[];
}

export interface StoryInput {
    teaser: string;
    content: string;
    chart: NatalChart;
    question: string | null;
    skyAhead: readonly SkyEvent[];
}

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

/** Same key → same scene on stage: it stays put instead of replaying. */
export function visualKey(visual: StoryVisual): string {
    switch (visual.kind) {
        case "planet":
        case "moonPhase":
            // The solar system stays on stage: the camera pulls back from
            // one body and flies to the next instead of cutting.
            return "system";
        case "pair":
            return `pair:${visual.bodies.join("+")}`;
        default:
            // venusPath keeps one key: Venus travels between its stops.
            return visual.kind;
    }
}

/** What you'd see in the sky that night, then what it says about you. */
export const MOON_PHASES: Record<
    MoonPhaseName,
    { title: string; sky: string; meaning: string }
> = {
    "Luna nueva": {
        title: "Había Luna nueva",
        sky: "Es la noche en que la Luna no se ve: pasa entre la Tierra y el Sol y nos da la espalda.",
        meaning:
            "Con ella empieza un ciclo. Quien nace así suele empezar las cosas sin mapa y aprende en el camino.",
    },
    "Luna creciente": {
        title: "Había Luna creciente",
        sky: "Asoma un hilo de luz que cada noche se hace más grande.",
        meaning:
            "Es la Luna del impulso: quien nace así va hacia lo que quiere aunque todavía no lo vea completo.",
    },
    "Cuarto creciente": {
        title: "Había cuarto creciente",
        sky: "Se ve media Luna y la luz sigue aumentando.",
        meaning:
            "Es la Luna de las decisiones: quien nace así se mueve mejor cuando le toca elegir.",
    },
    "Gibosa creciente": {
        title: "Había Luna gibosa creciente",
        sky: "Está casi llena: le falta un borde para completarse.",
        meaning:
            "Es la Luna que afina: quien nace así quiere que las cosas queden bien, no solo que pasen.",
    },
    "Luna llena": {
        title: "Había Luna llena",
        sky: "La Tierra queda entre el Sol y la Luna, y la vemos entera.",
        meaning:
            "Es la Luna de lo que se ve: quien nace así se entiende a sí mismo a través de sus relaciones.",
    },
    "Gibosa menguante": {
        title: "Había Luna gibosa menguante",
        sky: "Acaba de pasar la Luna llena y la luz empieza a recogerse.",
        meaning:
            "Es la Luna que comparte: quien nace así suele ser a quien le cuentan todo.",
    },
    "Cuarto menguante": {
        title: "Había cuarto menguante",
        sky: "Otra vez media Luna, pero ahora la luz se va.",
        meaning:
            "Es la Luna que revisa: quien nace así sabe, antes que nadie, cuándo algo ya no le queda.",
    },
    "Luna menguante": {
        title: "Había Luna menguante",
        sky: "Queda un hilo de luz antes de que la Luna desaparezca y todo empiece de nuevo.",
        meaning:
            "Es la Luna que suelta: quien nace así reconoce rápido lo que termina y se queda con lo que vale.",
    },
};

/** "¿Qué quieres saber primero?" answers, said back as their question. */
const QUESTIONS: Record<string, string> = {
    volvera: "¿Esa persona va a volver?",
    cuando: "¿Cuándo llega alguien para mí?",
    por_que: "¿Por qué me pasa siempre lo mismo?",
    quedarme: "¿Me quedo o me voy?",
    quien: "¿Qué tipo de persona me conviene?",
};

export function storyQuestion(answers: readonly QuizAnswer[]): string | null {
    const id = answers.find((a) => a.questionId === "pregunta")?.optionId;
    return (id && QUESTIONS[id]) ?? null;
}

/** What the chart says, as the story titles it ("Venus estaba en Aries"). */
function skyFacts(chart: NatalChart) {
    const byBody = new Map(chart.placements.map((p) => [p.body, p]));
    const sign = (body: StoryBody) => byBody.get(body)?.sign ?? "";
    const range = chart.moonRange;
    const planet = (body: StoryBody): StoryVisual => ({
        kind: "planet",
        body,
        sign: sign(body),
    });
    return {
        sign,
        venus: {
            title: `Venus estaba en ${sign("Venus")}`,
            visual: planet("Venus"),
        },
        mars: {
            title: `Marte estaba en ${sign("Marte")}`,
            visual: planet("Marte"),
        },
        moon: range
            ? {
                  title: `La Luna estaba entre ${range.early} y ${range.late}`,
                  visual: {
                      kind: "planet",
                      body: "Luna",
                      sign: range.early,
                      signs: [range.early, range.late],
                  } satisfies StoryVisual,
              }
            : {
                  title: `La Luna estaba en ${sign("Luna")}`,
                  visual: planet("Luna"),
              },
        sun: {
            title: `El Sol estaba en ${sign("Sol")}`,
            visual: planet("Sol"),
        },
        phase: chart.moonPhase,
    };
}

const SKY: StoryVisual = { kind: "system" };
const WORDS_PER_SCREEN = 70;

/** A long answer on two screens, split at the sentence nearest its middle. */
function splitLong(text: string): string[] {
    const sentences = text.match(/[^.!?…]+[.!?…]+["»”]?\s*/g) ?? [text];
    if (text.split(/\s+/).length <= WORDS_PER_SCREEN || sentences.length < 2)
        return [text];
    const half = text.length / 2;
    let cut = 1;
    let length = 0;
    sentences.forEach((sentence, i) => {
        length += sentence.length;
        if (length <= half) cut = i + 1;
    });
    return [
        sentences.slice(0, cut).join("").trim(),
        sentences.slice(cut).join("").trim(),
    ];
}

/** A reading written per scene: each text beside the body it talks about. */
function sceneStory(input: StoryInput, scenes: ReadingScenes): Story {
    const facts = skyFacts(input.chart);
    const chapters: StoryChapter[] = [];
    const steps: StoryStep[] = [
        { kind: "prologue", text: input.teaser, visual: SKY, chapter: null },
        { kind: "scene", text: scenes.opening, visual: SKY, chapter: null },
    ];
    const chapter = (label: string, add: (index: number) => StoryStep[]) => {
        const index = chapters.length;
        const added = add(index);
        if (!added.length) return;
        chapters.push({ numeral: NUMERALS[index], label });
        steps.push(...added);
    };
    const born = "El día que naciste";

    chapter("Cómo amas", (i) => [
        {
            kind: "scene",
            eyebrow: born,
            title: facts.venus.title,
            text: scenes.venus,
            visual: facts.venus.visual,
            chapter: i,
        },
        {
            kind: "scene",
            eyebrow: "Ese mismo día",
            title: facts.mars.title,
            text: scenes.mars,
            visual: facts.mars.visual,
            chapter: i,
        },
        {
            kind: "scene",
            eyebrow: "Juntos",
            title: "Venus y Marte",
            text: scenes.venusMars,
            visual: { kind: "pair", bodies: ["Venus", "Marte"] },
            chapter: i,
        },
    ]);

    chapter("Lo que necesitas", (i) => [
        {
            kind: "scene",
            eyebrow: born,
            title: MOON_PHASES[facts.phase].title,
            note: MOON_PHASES[facts.phase].sky,
            text: scenes.moonPhase,
            visual: { kind: "moonPhase", phase: facts.phase },
            chapter: i,
        },
        {
            kind: "scene",
            eyebrow: born,
            title: facts.moon.title,
            text: scenes.moon,
            visual: facts.moon.visual,
            chapter: i,
        },
        {
            kind: "scene",
            eyebrow: `Por eso eres ${facts.sign("Sol")}`,
            title: facts.sun.title,
            text: scenes.sun,
            visual: facts.sun.visual,
            chapter: i,
        },
        {
            kind: "scene",
            eyebrow: "Juntos",
            title: "La Luna y el Sol",
            text: scenes.moonSun,
            visual: { kind: "pair", bodies: ["Luna", "Sol"] },
            chapter: i,
        },
    ]);

    chapter("Tu pregunta", (i) => {
        const [first, ...rest] = splitLong(scenes.question);
        const wheel: StoryVisual = { kind: "wheel" };
        return [
            {
                kind: "scene",
                eyebrow: "Lo que querías saber",
                title: input.question ?? undefined,
                text: first,
                visual: wheel,
                chapter: i,
            },
            ...rest.map(
                (text): StoryStep => ({
                    kind: "paragraph",
                    text,
                    visual: wheel,
                    chapter: i,
                }),
            ),
        ];
    });

    // Each moment moves Venus to its date; ones that point nowhere are left out.
    chapter("Lo que viene", (i) =>
        scenes.moments
            .filter((m) => m.event >= 1 && m.event <= input.skyAhead.length)
            .map(
                (moment, n): StoryStep => ({
                    kind: "scene",
                    eyebrow: n === 0 ? "Desde hoy" : undefined,
                    title: n === 0 ? "El camino de Venus" : undefined,
                    text: moment.text,
                    visual: {
                        kind: "venusPath",
                        events: input.skyAhead,
                        focus: moment.event - 1,
                    },
                    chapter: i,
                }),
            ),
    );

    chapter("Un gesto", (i) => [
        {
            kind: "scene",
            eyebrow: "Para esta semana",
            title: "Un gesto",
            text: scenes.gesture,
            visual: { kind: "star" },
            chapter: i,
        },
    ]);

    steps.push({
        kind: "closing",
        text: scenes.closing,
        // The gesture's star stays: the story ends where it last pointed.
        visual: { kind: "star" },
        chapter: null,
    });
    return { chapters, steps };
}

/** Older readings' five sections, in their prompt's order. */
function chapterPlan(input: StoryInput): {
    label: string;
    visual: StoryVisual;
    intro: Intro[];
}[] {
    const facts = skyFacts(input.chart);
    const moonLine = input.chart.moonRange
        ? "Ese día la Luna cambió de signo: sin tu hora exacta, tiene un pie en cada uno."
        : "La Luna es tu mundo emocional: lo que necesitas para sentirte en casa con alguien.";
    const venus: Intro = {
        kind: "title",
        eyebrow: "El día que naciste",
        title: facts.venus.title,
        line: "Venus es el planeta del amor: marca qué te atrae y cómo te entregas.",
        visual: facts.venus.visual,
    };
    const mars: Intro = {
        kind: "title",
        eyebrow: "Ese mismo día",
        title: facts.mars.title,
        line: "Marte es el impulso: cómo vas por lo que quieres, y cómo peleas.",
        visual: facts.mars.visual,
    };
    const phase = MOON_PHASES[facts.phase];
    const moonPhase: Intro[] = [
        {
            kind: "title",
            eyebrow: "El día que naciste",
            title: phase.title,
            visual: { kind: "moonPhase", phase: facts.phase },
        },
        {
            kind: "note",
            label: "Qué es",
            text: `${phase.sky} ${phase.meaning}`,
            visual: { kind: "moonPhase", phase: facts.phase },
        },
    ];
    const moon: Intro = {
        kind: "title",
        eyebrow: "El día que naciste",
        title: facts.moon.title,
        line: moonLine,
        visual: facts.moon.visual,
    };
    const sun: Intro = {
        kind: "title",
        eyebrow: "El día que naciste",
        title: facts.sun.title,
        line: `Por eso eres ${facts.sign("Sol")}: es lo que te da energía y lo que no negocias.`,
        visual: facts.sun.visual,
    };
    const path: StoryVisual = { kind: "venusPath", events: input.skyAhead };

    return [
        { label: "Cómo amas", visual: venus.visual, intro: [venus, mars] },
        {
            label: "Lo que necesitas",
            visual: moonPhase[0].visual,
            intro: [...moonPhase, moon, sun],
        },
        {
            label: "Tu pregunta",
            visual: { kind: "wheel" },
            intro: input.question
                ? [
                      {
                          kind: "title",
                          eyebrow: "Lo que querías saber",
                          title: input.question,
                          visual: { kind: "wheel" },
                      },
                  ]
                : [],
        },
        {
            label: "Lo que viene",
            visual: path,
            intro: input.skyAhead.length
                ? [
                      {
                          kind: "title",
                          eyebrow: "Desde hoy",
                          title: "El camino de Venus",
                          line: "Ya no es el cielo de cuando naciste: es el de los próximos meses, y cuándo pasa por tus signos.",
                          visual: path,
                      },
                  ]
                : [],
        },
        { label: "Un gesto", visual: { kind: "star" }, intro: [] },
    ];
}

const BOLD_ENDING = /^(.*?)\s*\*\*([^*]+)\*\*\s*$/s;

/**
 * The closing line the Markdown prompt asked for: one short sentence in bold
 * at the very end, on its own or after the last paragraph's text.
 */
function splitClosing(paragraphs: string[]): {
    paragraphs: string[];
    closing: string | null;
} {
    const last = paragraphs.at(-1);
    const match = last?.match(BOLD_ENDING);
    if (!last || !match) return { paragraphs, closing: null };
    const before = match[1].trim();
    return {
        paragraphs: before
            ? [...paragraphs.slice(0, -1), before]
            : paragraphs.slice(0, -1),
        closing: match[2].trim(),
    };
}

/**
 * An older Markdown reading. A chapter's heading leads its first paragraph,
 * so no title sits alone on an empty screen; a text that doesn't follow the
 * five sections gets chapter cards over calm backdrops.
 */
function markdownStory(input: StoryInput): Story {
    const blocks = toReadingBlocks(input.content);
    const opening: string[] = [];
    const sections: { heading: string; paragraphs: string[] }[] = [];
    for (const block of blocks) {
        if (block.kind === "heading")
            sections.push({ heading: block.text, paragraphs: [] });
        else (sections.at(-1)?.paragraphs ?? opening).push(block.text);
    }

    // The bold line closes the whole text, wherever it landed.
    const tail = sections.at(-1) ?? { heading: "", paragraphs: opening };
    const { paragraphs, closing } = splitClosing(tail.paragraphs);
    tail.paragraphs.splice(0, tail.paragraphs.length, ...paragraphs);

    const plan = sections.length === 5 ? chapterPlan(input) : null;
    const steps: StoryStep[] = [
        { kind: "prologue", text: input.teaser, visual: SKY, chapter: null },
        ...opening.map(
            (text): StoryStep => ({
                kind: "paragraph",
                text,
                visual: SKY,
                chapter: null,
            }),
        ),
    ];
    const chapters: StoryChapter[] = [];

    sections.forEach((section, i) => {
        const planned = plan?.[i];
        const numeral = NUMERALS[i] ?? String(i + 1);
        chapters.push({ numeral, label: planned?.label ?? section.heading });

        let current: StoryVisual =
            planned?.visual ?? (i % 2 ? { kind: "wheel" } : SKY);
        if (!planned)
            steps.push({
                kind: "chapter",
                numeral,
                label: "",
                title: section.heading,
                visual: current,
                chapter: i,
            });
        for (const intro of planned?.intro ?? []) {
            steps.push({ ...intro, chapter: i });
            current = intro.visual;
        }
        section.paragraphs.forEach((text, n) => {
            steps.push({
                kind: "paragraph",
                text,
                heading: planned && n === 0 ? section.heading : undefined,
                visual: current,
                chapter: i,
            });
        });
    });

    if (closing)
        steps.push({
            kind: "closing",
            text: closing,
            visual: steps.at(-1)?.visual ?? SKY,
            chapter: null,
        });

    return { chapters, steps };
}

/**
 * The free part, as the start of the same story: their sky, the paragraph
 * they got, and Venus in its sign (a fact, free) with the line of sight
 * drawn. The camera stops there; the reading continues after the box.
 */
export function previewStory(
    input: Pick<StoryInput, "teaser" | "chart" | "question">,
): Story {
    const facts = skyFacts(input.chart);
    const venus = facts.venus.visual;
    const toward: StoryVisual =
        venus.kind === "planet" ? { ...venus, approach: true } : venus;
    return {
        chapters: [],
        steps: [
            {
                kind: "prologue",
                text: input.teaser,
                visual: SKY,
                chapter: null,
            },
            {
                kind: "scene",
                eyebrow: "El día que naciste",
                title: facts.venus.title,
                text: "Venus habla de cómo te enamoras. La tuya tiene algo que contarte.",
                visual: toward,
                chapter: null,
            },
            {
                kind: "door",
                eyebrow: "Lo que sigue",
                title: "Lo que te cuenta tu cielo",
                inside: [
                    "Cómo amas: tu Venus y tu Marte",
                    "Lo que necesitas: tu Luna y tu Sol",
                    input.question
                        ? `Tu pregunta: ${input.question}`
                        : "Lo que más quieres saber",
                    "Lo que viene en los próximos meses",
                    "Un gesto para esta semana",
                ],
                visual: toward,
                chapter: null,
            },
        ],
    };
}

export function buildStory(input: StoryInput): Story {
    const scenes = parseScenes(input.content);
    return scenes ? sceneStory(input, scenes) : markdownStory(input);
}
