import type { QuizAnswer } from "./types";

/**
 * What usually comes with each answer, one step beyond what it says: a
 * behaviour or a feeling most people who pick it would recognize but
 * didn't write. A reading that names those, instead of echoing the
 * answer back, is the one that feels like it saw them (self-reported data
 * is the real signal; an echo of it, a minute later, reads as a trick).
 *
 * Written as notes, not sentences, so the model has to write its own:
 * pasted, the same line would show up for everyone who gave that answer.
 * Only the reader's own answers' clues go in its prompt. High base rate on
 * purpose (nothing a reader of that answer would deny), and nothing about
 * the other person's gender, nor events they didn't tell.
 */
const CLUES: Record<string, Record<string, readonly string[]>> = {
    situacion: {
        soltera: [
            "planes con amigos que llenan el fin de semana; algunas noches, alguien que aún no existe",
            "en una presentación, sabe en minutos si vale la pena",
        ],
        alguien: [
            "mensajes escritos, borrados, reescritos más cortos",
            "conversaciones enteras imaginadas que aún no pasaron",
        ],
        relacion: [
            "lo que de verdad siente, a veces más fácil de contar a amigos que a su pareja",
            "recuerda cómo empezó y a ratos lo compara con hoy",
        ],
        ruptura: [
            "revisa su perfil aunque se prometió no hacerlo",
            "cosas que dejó de hacer porque las hacían juntos",
        ],
        complicado: [
            "amigos con opinión; no siempre les cuenta todo",
            "un gesto bonito alcanza para esperar un poco más",
        ],
    },
    patron: {
        indisponibles: [
            "las historias que más recuerda nunca terminaron de empezar",
            "se aburre de quien escribe todos los días",
        ],
        doy_demasiado: [
            "organiza los planes; escribe primero tras una pelea",
            "recibir un favor le incomoda: siente que debe devolverlo",
        ],
        me_alejo: [
            "planes a largo plazo → de pronto, muchos pendientes",
            "amistades de años: el problema no es querer sino quedarse",
        ],
        celos: [
            "atiende al tono de un mensaje más que a sus palabras",
            "preguntas de pasada para confirmar una sospecha",
        ],
        no_se: [
            "historias que empiezan distinto y terminan parecido",
            "amigos que ya le señalaron algo que se repite",
        ],
    },
    necesidad: {
        seguridad: [
            "un plan cumplido le calma más que una frase bonita",
            "se fija en la puntualidad del otro",
        ],
        pasion: [
            "sabe en la primera cita si hay química",
            "no sabe disimular cuando algo le gusta",
        ],
        libertad: [
            "planes propios que no negocia",
            "un «¿dónde estás?» le pesa más que una pelea",
        ],
        admiracion: [
            "se enamora oyendo a alguien hablar de lo que le apasiona",
            "el interés se va cuando el otro deja de sorprenderle",
        ],
        complicidad: [
            "sus mejores recuerdos en pareja: reírse por tonterías",
            "poder escribir cualquier cosa a cualquier hora sin explicar",
        ],
    },
    herida: {
        abandono: [
            "una demora en responder → imagina lo peor primero",
            "cuando termina algo, lo dice claro: sabe lo que duele lo otro",
        ],
        engano: [
            "nota cuando una historia no encaja, aunque calle",
            "cree menos en los elogios que en las críticas",
        ],
        indiferencia: [
            "registra quién pregunta cómo le fue y quién no",
            "prefiere una charla difícil a un día de silencio",
        ],
        control: [
            "defiende sus horarios y sus amistades más de lo que parece",
            "desconfía de lo que va demasiado rápido",
        ],
        perder_me: [
            "volvió a algo que había dejado: un deporte, una amistad, una música",
            "en una cita se pregunta si podría seguir siendo quien es",
        ],
    },
    pregunta: {
        volvera: ["además de si vuelve: si lo vivido fue real"],
        cuando: ["teme que algo en su forma de querer cierre la puerta"],
        por_que: [
            "quiere entenderlo para no repetirlo; teme que la causa sea suya",
        ],
        quedarme: ["ya intuye la respuesta; busca claridad para decidir"],
        quien: ["dejar de elegir lo que luego le hace daño"],
    },
};

/** The clues for these answers, in the quiz's order. */
export function cluesFor(answers: readonly QuizAnswer[]): string[] {
    return answers.flatMap((a) => CLUES[a.questionId]?.[a.optionId] ?? []);
}
