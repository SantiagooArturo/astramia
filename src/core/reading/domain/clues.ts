import type { QuizAnswer } from "./types";

/**
 * What usually comes with each answer, one step beyond what it says: a
 * feeling or a way of seeing things most people who pick it would
 * recognize but didn't write. Inner states, not deeds: "it weighs on
 * them" is almost always true; "they don't tell their friends" is a fact
 * one reader in three will deny. A reading that names those, instead of echoing the
 * answer back, is the one that feels like it saw them (self-reported data
 * is the real signal; an echo of it, a minute later, reads as a trick).
 *
 * Written as notes, not sentences, so the model has to write its own:
 * pasted, the same line would show up for everyone who gave that answer.
 * Only the reader's own answers' clues go in its prompt. High base rate on
 * purpose (nothing a reader of that answer would deny), and nothing about
 * the other person's gender, nor events they didn't tell. Where an answer
 * can mean several things, the note says the range, never picks one: a
 * reader who chose "perderme a mí" over clashing life plans was told it
 * was about leaving their friends.
 */
const CLUES: Record<string, Record<string, readonly string[]>> = {
    situacion: {
        soltera: [
            "disfruta su espacio y a ratos imagina a alguien que aún no existe",
            "no le basta cualquiera: busca a alguien que de verdad le entienda",
        ],
        alguien: [
            "ensaya en su cabeza lo que diría y cómo sonaría",
            "una respuesta tibia le deja pensando más de lo que admite",
        ],
        relacion: [
            "hay algo que siente y todavía no encuentra cómo decir",
            "a ratos compara cómo empezó todo con cómo está hoy",
        ],
        ruptura: [
            "repasa lo que pasó buscando el momento en que cambió",
            "hay días buenos, y de pronto algo pequeño le regresa al inicio",
        ],
        complicado: [
            "le cansa no saber bien a qué atenerse",
            "le cuesta explicar la historia completa, incluso a sí",
        ],
    },
    ultimo_amor: {
        hace_poco: ["lo reciente todavía marca lo que busca y lo que evita"],
        mas_de_un_ano: ["sabe estar sin nadie; ya no se conforma con poco"],
        anos: ["hace tiempo que nadie le mueve por dentro: pide más que antes"],
        nunca: ["ha querido, pero no así: espera algo que aún no conoce"],
    },
    sabe: {
        mutuo: ["las señales dicen que sí, y aun así le cuesta creerlo"],
        no_se_que_siente: ["no saber qué siente la otra persona le inquieta"],
        sospecha: ["le gusta que se note sin tener que decirlo del todo"],
        no_sabe: ["guarda lo que siente; imagina cómo sería decirlo"],
    },
    como_estan: {
        muy_bien: ["quiere cuidar lo que tiene; teme que la rutina lo gaste"],
        algo_falta: ["sabe que quiere algo más y no sabe cómo pedirlo"],
        rutina: ["extraña cómo se sentía al principio"],
        peleas: ["siente que las peleas pequeñas esconden algo más grande"],
        caminos: [
            "el cariño no está en duda, el rumbo sí: qué cedería y qué no",
        ],
        dudas: ["un día piensa en irse y al siguiente en quedarse"],
    },
    termino: {
        reciente_hablan: ["cada conversación le abre y le cierra la herida"],
        reciente_sin: ["el silencio le pesa más de lo que esperaba"],
        meses: ["ya sigue su vida, pero algo sigue sin cerrar"],
        mas_de_un_ano: ["lo superó en lo grande; queda una pregunta pequeña"],
    },
    complica: {
        sin_nombre: ["le pesa no poder ponerle nombre a lo que tienen"],
        otra_persona: [
            "hay una tercera persona en la historia; de quién es, no lo sabes: no lo elijas",
        ],
        idas_y_vueltas: ["cada regreso le ilusiona y le cansa a la vez"],
        distancia: ["extraña lo que la distancia no deja tener"],
        entorno: [
            "lo que siente y lo que le dicen no coinciden; quién tiene razón, no lo sabes: no lo elijas",
        ],
    },
    espera: {
        reviso: ["la espera le inquieta más de lo que muestra"],
        escribo: ["prefiere preguntar a quedarse con la duda"],
        como_si_nada: ["esconde cuánto le importa"],
        que_hice: ["tiende a buscar la falla en sí"],
        sigo: ["no deja que una respuesta le marque el día"],
    },
    patron: {
        indisponibles: [
            "lo difícil le atrae más que lo seguro",
            "cuando alguien sí está, algo en esta persona se aburre o desconfía",
        ],
        doy_demasiado: [
            "da sin que se lo pidan y le cuesta pedir",
            "espera que alguien note lo que da sin tener que decirlo",
        ],
        me_alejo: [
            "cuando algo se vuelve serio, siente que pierde aire",
            "sabe querer; lo difícil es quedarse cuando se vuelve serio",
        ],
        celos: [
            "nota los cambios pequeños antes que nadie",
            "le cuesta creer lo bueno cuando llega",
        ],
        no_se: [
            "siente que algo se repite y aún no le pone nombre",
            "desde adentro le cuesta ver su parte",
        ],
    },
    // No longer asked: readings made before still carry it.
    necesidad: {
        seguridad: [
            "le calma más un hecho que una promesa",
            "la duda le quita más paz de lo que admite",
        ],
        pasion: [
            "lo tibio le aburre rápido",
            "no sabe disimular cuando algo le gusta",
        ],
        libertad: [
            "necesita sentir que puede irse para querer quedarse",
            "le pesa tener que dar explicaciones",
        ],
        admiracion: [
            "se enamora de cómo piensa alguien antes que de cómo se ve",
            "el interés se apaga cuando deja de admirar",
        ],
        complicidad: [
            "quiere a alguien con quien reírse de lo mismo",
            "extraña la confianza de poder contarlo todo",
        ],
    },
    herida: {
        abandono: [
            "cuando alguien tarda en responder, imagina lo peor primero",
            "le importa cerrar bien las cosas: sabe lo que duele lo contrario",
        ],
        engano: [
            "quiere volver a confiar, pero le cuesta soltar la guardia",
            "cree menos en los elogios que en las críticas",
        ],
        indiferencia: [
            "el silencio le duele más que una pelea",
            "nota enseguida cuando alguien deja de poner interés",
        ],
        control: [
            "cuida su espacio más de lo que parece",
            "desconfía de lo que va demasiado rápido",
        ],
        perder_me: [
            "en una relación sintió que dejaba de ser quien es; qué cedió (tiempo, gente, planes, sueños), no lo sabes: no lo elijas",
            "quiere que querer a alguien no le cueste lo que quiere para su vida",
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

/**
 * For a ranking: what its first place says weighs on them, and what its
 * last rules out. The bottom is the safer signal: whatever they put last is
 * almost never what their other answers are about, so no scene goes there.
 */
const RANKED: Record<
    string,
    {
        first: Record<string, readonly string[]>;
        last: Record<string, readonly string[]>;
    }
> = {
    prioridades: {
        first: {
            amor: ["hoy lo que pase en el amor le mueve todo lo demás"],
            familia: [
                "su familia es su base: lo que elija en el amor tiene que poder convivir con ella",
            ],
            amigos: [
                "su gente es su lugar seguro: no quiere un amor que le aleje de ella",
            ],
            dinero: [
                "hoy sus planes y su estabilidad pesan mucho: quiere un amor que sume a eso, no que lo frene",
            ],
        },
        last: {
            amor: [
                "hoy pone otras cosas antes que el amor: no le pintes una vida que gira alrededor de alguien",
            ],
            familia: [
                "su familia va al final de lo que hoy le importa: si ninguna otra respuesta la nombra, no la pongas en escena",
            ],
            amigos: [
                "sus amigos van al final de lo que hoy le importa: si ninguna otra respuesta los nombra, no los pongas en escena",
            ],
            dinero: [
                "el dinero y el trabajo van al final de lo que hoy le importa: no los pongas en escena",
            ],
        },
    },
};

/** The clues for these answers, in the quiz's order. */
export function cluesFor(answers: readonly QuizAnswer[]): string[] {
    return answers.flatMap((a) => {
        if ("optionId" in a) return CLUES[a.questionId]?.[a.optionId] ?? [];
        const ranked = RANKED[a.questionId];
        const first = a.ranking[0];
        const last = a.ranking[a.ranking.length - 1];
        return [...(ranked?.first[first] ?? []), ...(ranked?.last[last] ?? [])];
    });
}
