import type { QuizAnswer } from "./types";

export type Trato = "femenino" | "masculino" | "neutro";

export interface QuizOption {
    id: string;
    /** One text, or one per trato when it describes the reader. */
    label: string | Readonly<Record<Trato, string>>;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: readonly QuizOption[];
    /** A follow-up: asked only right after this answer. */
    after?: { questionId: string; optionId: string };
}

/** A follow-up on "where's your heart": what that answer leaves open. */
const followUp = (
    optionId: string,
    question: Omit<QuizQuestion, "after">,
): QuizQuestion => ({
    ...question,
    after: { questionId: "situacion", optionId },
});

/**
 * The love-reading questionnaire. Fixed options keep it one-tap on a phone
 * and give the model clean signals. `OFFER.questions` counts what each
 * reader is asked.
 *
 * `trato` comes first: Spanish needs a grammatical gender, and without it
 * the model defaults to one and gets it wrong for many readers. Options that
 * describe the reader come in each trato, so the rest of the quiz already
 * speaks to them the way they asked.
 *
 * What a reader tells about themselves is the reading's real signal, so
 * the quiz asks for facts and behaviours over wishes: one follow-up pins
 * down where their heart is, and "what do you do when they're slow to
 * answer" replaced "what do you need most", whose options all sounded
 * equally good and told little.
 */
export const LOVE_QUIZ: readonly QuizQuestion[] = [
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
    followUp("soltera", {
        id: "ultimo_amor",
        question: "¿Cuándo fue la última vez que te enamoraste?",
        options: [
            { id: "hace_poco", label: "Hace poco" },
            { id: "mas_de_un_ano", label: "Hace más de un año" },
            { id: "anos", label: "Hace años" },
            { id: "nunca", label: "Creo que nunca de verdad" },
        ],
    }),
    followUp("alguien", {
        id: "sabe",
        question: "¿Esa persona sabe que te gusta?",
        options: [
            { id: "mutuo", label: "Sí, y creo que también le gusto" },
            { id: "no_se_que_siente", label: "Sí, pero no sé qué siente" },
            { id: "sospecha", label: "Creo que lo sospecha" },
            { id: "no_sabe", label: "No, no lo sabe" },
        ],
    }),
    followUp("relacion", {
        id: "como_estan",
        question: "¿Cómo están hoy?",
        options: [
            { id: "muy_bien", label: "Muy bien, y quiero cuidarlo" },
            { id: "algo_falta", label: "Bien, pero algo falta" },
            { id: "rutina", label: "En piloto automático" },
            { id: "peleas", label: "Peleamos seguido" },
            { id: "dudas", label: "Con dudas de seguir" },
        ],
    }),
    followUp("ruptura", {
        id: "termino",
        question: "¿Cuándo terminó?",
        options: [
            { id: "reciente_hablan", label: "Hace poco, y seguimos hablando" },
            { id: "reciente_sin", label: "Hace poco, y ya no hablamos" },
            { id: "meses", label: "Hace meses, y todavía pienso en eso" },
            { id: "mas_de_un_ano", label: "Hace más de un año" },
        ],
    }),
    followUp("complicado", {
        id: "complica",
        question: "¿Qué lo hace complicado?",
        options: [
            { id: "sin_nombre", label: "No sabemos qué somos" },
            { id: "otra_persona", label: "Hay otra persona" },
            { id: "idas_y_vueltas", label: "Volvemos y terminamos" },
            { id: "distancia", label: "La distancia" },
            { id: "entorno", label: "La familia o los amigos" },
        ],
    }),
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
        id: "espera",
        question: "Cuando alguien que te gusta tarda en responder, tú…",
        options: [
            { id: "reviso", label: "Reviso si se conectó" },
            { id: "escribo", label: "Le escribo otra vez" },
            { id: "como_si_nada", label: "Hago como si nada" },
            { id: "que_hice", label: "Pienso qué hice mal" },
            { id: "sigo", label: "Sigo en lo mío" },
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
];

/**
 * No longer asked, still described: readings made before keep their
 * answers, and their chat still reads them.
 */
const RETIRED: readonly QuizQuestion[] = [
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
];

/** The questions these answers lead to, in order: follow-ups only after theirs. */
export function questionsFor(
    answers: readonly QuizAnswer[],
    quiz: readonly QuizQuestion[] = LOVE_QUIZ,
): QuizQuestion[] {
    return quiz.filter(
        (q) =>
            !q.after ||
            answers.some(
                (a) =>
                    a.questionId === q.after?.questionId &&
                    a.optionId === q.after.optionId,
            ),
    );
}

/**
 * How many questions each reader answers, whatever their path: all those
 * asked of everyone, and one follow-up.
 */
export function quizLength(quiz: readonly QuizQuestion[] = LOVE_QUIZ): number {
    return (
        quiz.filter((q) => !q.after).length +
        (quiz.some((q) => q.after) ? 1 : 0)
    );
}

export const QUIZ_LENGTH = quizLength();

/**
 * Exactly the questions these answers lead to, each with one of its own
 * options: nothing missing, nothing left from a path they turned back on.
 */
export function isCompleteQuiz(answers: readonly QuizAnswer[]): boolean {
    const asked = questionsFor(answers);
    return (
        answers.length === asked.length &&
        asked.every((q) =>
            answers.some(
                (a) =>
                    a.questionId === q.id &&
                    q.options.some((o) => o.id === a.optionId),
            ),
        )
    );
}

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
    const question = [...LOVE_QUIZ, ...RETIRED].find(
        (q) => q.id === questionId,
    );
    const option = question?.options.find((o) => o.id === optionId);
    return question && option
        ? {
              question: question.question,
              answer: optionLabel(option.label, trato),
          }
        : undefined;
}
