import type { QuizAnswer } from "./types";

/**
 * The love-reading questionnaire. Fixed options keep it one-tap on a phone
 * and give the model clean signals. `OFFER.questions` counts these.
 *
 * `trato` comes first: Spanish needs a grammatical gender, and without it
 * the model defaults to one and gets it wrong for many readers. Options that
 * describe the reader come in each trato, so the rest of the quiz already
 * speaks to them the way they asked.
 */
export const LOVE_QUIZ = [
    {
        id: "trato",
        question: "Para empezar, ¿cómo quieres que te hable?",
        options: [
            { id: "femenino", label: "En femenino" },
            { id: "masculino", label: "En masculino" },
            { id: "neutro", label: "Sin género" },
        ],
    },
    {
        id: "situacion",
        question: "¿Dónde está tu corazón ahora mismo?",
        options: [
            {
                id: "soltera",
                label: {
                    femenino: "Sola, y sin nadie en mente",
                    masculino: "Solo, y sin nadie en mente",
                    neutro: "Sin pareja y sin nadie en mente",
                },
            },
            { id: "alguien", label: "Hay alguien que me gusta" },
            { id: "relacion", label: "En una relación" },
            { id: "ruptura", label: "Saliendo de una ruptura" },
            { id: "complicado", label: "Es complicado" },
        ],
    },
    {
        id: "patron",
        question: "¿Qué se repite en tus relaciones?",
        options: [
            {
                id: "indisponibles",
                label: "Me fijo en quien no está disponible",
            },
            { id: "doy_demasiado", label: "Doy más de lo que recibo" },
            { id: "me_alejo", label: "Me alejo cuando se pone serio" },
            { id: "celos", label: "Me cuesta confiar" },
            { id: "no_se", label: "No lo tengo claro" },
        ],
    },
    {
        id: "necesidad",
        question: "En el amor, lo que más necesitas es…",
        options: [
            {
                id: "seguridad",
                label: {
                    femenino: "Sentirme segura",
                    masculino: "Sentirme seguro",
                    neutro: "Sentir seguridad",
                },
            },
            { id: "pasion", label: "Pasión y química" },
            { id: "libertad", label: "Espacio y libertad" },
            { id: "admiracion", label: "Admirar a la otra persona" },
            { id: "complicidad", label: "Complicidad y amistad" },
        ],
    },
    {
        id: "herida",
        question: "¿Qué es lo que más te ha dolido?",
        options: [
            { id: "abandono", label: "Que se fueran sin explicación" },
            { id: "engano", label: "Un engaño" },
            { id: "indiferencia", label: "La indiferencia" },
            {
                id: "control",
                label: {
                    femenino: "Sentirme controlada",
                    masculino: "Sentirme controlado",
                    neutro: "Que intentaran controlarme",
                },
            },
            { id: "perder_me", label: "Perderme a mí en la relación" },
        ],
    },
    {
        id: "pregunta",
        question: "¿Qué quieres saber primero?",
        options: [
            { id: "volvera", label: "Si esa persona va a volver" },
            { id: "cuando", label: "Cuándo llega alguien para mí" },
            { id: "por_que", label: "Por qué me pasa siempre lo mismo" },
            { id: "quedarme", label: "Si debo quedarme o irme" },
            { id: "quien", label: "Qué tipo de persona me conviene" },
        ],
    },
] as const;

export type LoveQuizQuestionId = (typeof LOVE_QUIZ)[number]["id"];

export type Trato = "femenino" | "masculino" | "neutro";

/** How the reader asked to be addressed; "neutro" until they say. */
export function tratoOf(answers: readonly QuizAnswer[]): Trato {
    const id = answers.find((a) => a.questionId === "trato")?.optionId;
    return id === "femenino" || id === "masculino" ? id : "neutro";
}

/** An option's label in the reader's trato. */
export function optionLabel(
    label: string | Readonly<Record<Trato, string>>,
    trato: Trato,
): string {
    return typeof label === "string" ? label : label[trato];
}

/** Label of an answered option, for prompts. `undefined` if it isn't in the quiz. */
export function describeAnswer(
    questionId: string,
    optionId: string,
    trato: Trato = "neutro",
): { question: string; answer: string } | undefined {
    const question = LOVE_QUIZ.find((q) => q.id === questionId);
    const option = question?.options.find((o) => o.id === optionId);
    return question && option
        ? {
              question: question.question,
              answer: optionLabel(option.label, trato),
          }
        : undefined;
}
