import type { MoonPhaseName } from "@/core/landing/domain/ephemeris";
import { toReadingBlocks } from "./markdown";
import type { NatalChart, QuizAnswer, SkyEvent } from "./types";

/**
 * The paid reading as a story told on scroll: each idea is introduced by
 * something to look at (the Moon settling on the phase they were born
 * under, Venus over its sign) before the text explains it.
 *
 * The visuals come from the chart, never from the model, so they can't
 * contradict the sky. The text is the model's, split along the five
 * sections READING_PROMPT asks for; a text that doesn't follow them is
 * still told, with a calmer backdrop.
 */

export type StoryBody = "Sol" | "Luna" | "Venus" | "Marte";

export type StoryVisual =
    /** Their whole chart, slowly turning: the night they were born. */
    | { kind: "sky" }
    /** The same chart with its tensions (aspects) lit. */
    | { kind: "wheel" }
    | {
          kind: "planet";
          body: StoryBody;
          sign: string;
          /** Unknown birth time and the Moon changed sign that day. */
          signs?: readonly [string, string];
      }
    /** A lunar month that comes to rest on their phase. */
    | { kind: "moonPhase"; phase: MoonPhaseName }
    | { kind: "venusPath"; events: readonly SkyEvent[] }
    | { kind: "star" }
    | { kind: "dawn" }
    /** Only the stars: a chapter title alone, before its first scene. */
    | { kind: "night" };

/** A concept shown before the text uses it: a big title over its visual. */
type TitleStep = {
    kind: "title";
    eyebrow: string;
    title: string;
    line?: string;
};
/** What that concept is, in plain words. */
type NoteStep = { kind: "note"; label: string; text: string };
type Intro = (TitleStep | NoteStep) & { visual: StoryVisual };

export type StoryStep = { visual: StoryVisual; chapter: number | null } & (
    | { kind: "prologue"; text: string }
    | { kind: "chapter"; numeral: string; label: string; title: string }
    | TitleStep
    | NoteStep
    | { kind: "paragraph"; text: string }
    | { kind: "quote"; text: string }
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
            return `planet:${visual.body}`;
        case "moonPhase":
            return `moon:${visual.phase}`;
        default:
            return visual.kind;
    }
}

/** What each phase is (what you'd see that night), then what it says. */
export const MOON_PHASES: Record<
    MoonPhaseName,
    { title: string; note: string }
> = {
    "Luna nueva": {
        title: "La Luna nueva",
        note: "Es la noche en que la Luna no se ve: pasa entre la Tierra y el Sol y nos da la espalda. Con ella empieza un ciclo. Quien nace así suele empezar las cosas sin mapa y aprende en el camino.",
    },
    "Luna creciente": {
        title: "La Luna creciente",
        note: "Asoma un hilo de luz que cada noche se hace más grande. Es la Luna del impulso: quien nace así va hacia lo que quiere aunque todavía no lo vea completo.",
    },
    "Cuarto creciente": {
        title: "El cuarto creciente",
        note: "Se ve media Luna y la luz sigue aumentando. Es la Luna de las decisiones: quien nace así se mueve mejor cuando le toca elegir.",
    },
    "Gibosa creciente": {
        title: "La Luna gibosa creciente",
        note: "Está casi llena: le falta un borde para completarse. Es la Luna que afina: quien nace así quiere que las cosas queden bien, no solo que pasen.",
    },
    "Luna llena": {
        title: "La Luna llena",
        note: "La Tierra queda entre el Sol y la Luna, y la vemos entera. Es la Luna de lo que se ve: quien nace así se entiende a sí mismo a través de sus relaciones.",
    },
    "Gibosa menguante": {
        title: "La Luna gibosa menguante",
        note: "Acaba de pasar la Luna llena y la luz empieza a recogerse. Es la Luna que comparte: quien nace así suele ser a quien le cuentan todo.",
    },
    "Cuarto menguante": {
        title: "El cuarto menguante",
        note: "Otra vez media Luna, pero ahora la luz se va. Es la Luna que revisa: quien nace así sabe, antes que nadie, cuándo algo ya no le queda.",
    },
    "Luna menguante": {
        title: "La Luna menguante",
        note: "Queda un hilo de luz antes de que la Luna desaparezca y todo empiece de nuevo. Es la Luna que suelta: quien nace así reconoce rápido lo que termina y se queda con lo que vale.",
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

/** The five sections READING_PROMPT writes, in its order. */
function chapterPlan(input: StoryInput): {
    label: string;
    visual: StoryVisual;
    intro: Intro[];
}[] {
    const byBody = new Map(input.chart.placements.map((p) => [p.body, p]));
    const sign = (body: StoryBody) => byBody.get(body)?.sign ?? "";
    const range = input.chart.moonRange;
    const phase = input.chart.moonPhase;

    const venus: Intro = {
        kind: "title",
        eyebrow: "Cómo te enamoras",
        title: `Venus en ${sign("Venus")}`,
        line: "Venus es el planeta del amor: marca qué te atrae y cómo te entregas.",
        visual: { kind: "planet", body: "Venus", sign: sign("Venus") },
    };
    const mars: Intro = {
        kind: "title",
        eyebrow: "Cómo deseas",
        title: `Marte en ${sign("Marte")}`,
        line: "Marte es el impulso: cómo vas por lo que quieres, y cómo peleas.",
        visual: { kind: "planet", body: "Marte", sign: sign("Marte") },
    };
    const moonPhase: Intro[] = [
        {
            kind: "title",
            eyebrow: "La Luna el día que naciste",
            title: MOON_PHASES[phase].title,
            visual: { kind: "moonPhase", phase },
        },
        {
            kind: "note",
            label: "Qué es",
            text: MOON_PHASES[phase].note,
            visual: { kind: "moonPhase", phase },
        },
    ];
    const moon: Intro = range
        ? {
              kind: "title",
              eyebrow: "Lo que necesitas para estar en paz",
              title: `Luna entre ${range.early} y ${range.late}`,
              line: "Ese día la Luna cambió de signo: sin tu hora exacta, tiene un pie en cada uno.",
              visual: {
                  kind: "planet",
                  body: "Luna",
                  sign: range.early,
                  signs: [range.early, range.late],
              },
          }
        : {
              kind: "title",
              eyebrow: "Lo que necesitas para estar en paz",
              title: `Luna en ${sign("Luna")}`,
              line: "La Luna es tu mundo emocional: lo que necesitas para sentirte en casa con alguien.",
              visual: { kind: "planet", body: "Luna", sign: sign("Luna") },
          };
    const sun: Intro = {
        kind: "title",
        eyebrow: "Tu centro",
        title: `Sol en ${sign("Sol")}`,
        line: "Tu signo: lo que te da energía y lo que no negocias.",
        visual: { kind: "planet", body: "Sol", sign: sign("Sol") },
    };

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
            visual: { kind: "venusPath", events: input.skyAhead },
            intro: input.skyAhead.length
                ? [
                      {
                          kind: "title",
                          eyebrow: "Los próximos meses",
                          title: "El camino de Venus",
                          line: "Hacia dónde se mueve el planeta del amor, y cuándo toca tu carta.",
                          visual: { kind: "venusPath", events: input.skyAhead },
                      },
                  ]
                : [],
        },
        { label: "Un gesto", visual: { kind: "star" }, intro: [] },
    ];
}

const BOLD_ENDING = /^(.*?)\s*\*\*([^*]+)\*\*\s*$/s;

/**
 * The closing line READING_PROMPT asks for: one short sentence in bold at
 * the very end, on its own or after the last paragraph's text.
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

export function buildStory(input: StoryInput): Story {
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
    const sky: StoryVisual = { kind: "sky" };
    const steps: StoryStep[] = [
        { kind: "prologue", text: input.teaser, visual: sky, chapter: null },
        ...opening.map(
            (text): StoryStep => ({
                kind: "paragraph",
                text,
                visual: sky,
                chapter: null,
            }),
        ),
    ];
    const chapters: StoryChapter[] = [];

    sections.forEach((section, i) => {
        const planned = plan?.[i];
        const numeral = NUMERALS[i] ?? String(i + 1);
        // Off-plan texts alternate the two calm backdrops.
        // A chapter that introduces something opens on a quiet night, so
        // its first scene starts with its title instead of under this card.
        const visual: StoryVisual = planned
            ? planned.intro.length
                ? { kind: "night" }
                : planned.visual
            : i % 2
              ? { kind: "wheel" }
              : sky;
        const label = planned?.label ?? section.heading;
        chapters.push({ numeral, label });

        steps.push({
            kind: "chapter",
            numeral,
            label: planned ? label : "",
            title: section.heading,
            visual,
            chapter: i,
        });
        let current = visual;
        for (const intro of planned?.intro ?? []) {
            steps.push({ ...intro, chapter: i });
            current = intro.visual;
        }
        for (const text of section.paragraphs)
            steps.push({
                kind: "paragraph",
                text,
                visual: current,
                chapter: i,
            });
    });

    if (closing)
        steps.push({
            kind: "quote",
            text: closing,
            visual: { kind: "dawn" },
            chapter: null,
        });

    return { chapters, steps };
}
