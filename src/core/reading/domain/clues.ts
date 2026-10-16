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
 * the other person's gender, nor events they didn't tell. Where an answer
 * can mean several things, the note says the range, never picks one: a
 * reader who chose "perderme a mí" over clashing life plans was told it
 * was about leaving their friends.
 */
const CLUES: Record<string, Record<string, readonly string[]>> = {
    situacion: {
        soltera: [
            "su tiempo es suyo y lo cuida; algunas noches imagina a alguien que aún no existe",
            "conociendo a alguien, sabe pronto si vale la pena",
        ],
        alguien: [
            "mensajes escritos, borrados, reescritos más cortos",
            "conversaciones enteras imaginadas que aún no pasaron",
        ],
        relacion: [
            "hay algo que todavía no le ha dicho a su pareja",
            "recuerda cómo empezó y a ratos lo compara con hoy",
        ],
        ruptura: [
            "revisa su perfil aunque se prometió no hacerlo",
            "cosas que dejó de hacer porque las hacían juntos",
        ],
        complicado: [
            "no siempre cuenta toda la historia a quien le pregunta",
            "un gesto bonito alcanza para esperar un poco más",
        ],
    },
    ultimo_amor: {
        hace_poco: ["lo reciente todavía marca lo que busca y lo que evita"],
        mas_de_un_ano: ["sabe estar sin nadie; ya no se conforma con poco"],
        anos: ["hace tiempo que nadie le mueve por dentro: pide más que antes"],
        nunca: ["ha querido, pero no así: espera algo que todavía no conoce"],
    },
    sabe: {
        mutuo: ["las señales dicen que sí, y aun así duda"],
        no_se_que_siente: ["lee cada respuesta buscando qué siente"],
        sospecha: ["deja que se note sin decirlo del todo"],
        no_sabe: ["guarda el secreto; ensaya cómo sería decirlo"],
    },
    como_estan: {
        muy_bien: ["cuida lo que tiene; teme que la rutina lo gaste"],
        algo_falta: ["quiere algo concreto y no sabe cómo pedirlo"],
        rutina: ["días iguales; extraña cómo era al principio"],
        peleas: ["peleas por cosas pequeñas que esconden otra más grande"],
        caminos: [
            "el cariño no está en duda, el rumbo sí: qué cedería y qué no",
        ],
        dudas: ["piensa en irse y en quedarse el mismo día"],
    },
    termino: {
        reciente_hablan: ["cada mensaje vuelve a abrir la puerta"],
        reciente_sin: ["el silencio pesa más de noche"],
        meses: ["ya hace su vida, pero algo sigue sin cerrar"],
        mas_de_un_ano: ["lo superó en lo grande; queda una pregunta pequeña"],
    },
    complica: {
        sin_nombre: ["vive lo que hay hoy, sin ponerle nombre"],
        otra_persona: [
            "hay más de una historia en juego; no todo depende de sí",
        ],
        idas_y_vueltas: ["cada regreso parece distinto y termina igual"],
        distancia: ["la pantalla sostiene lo que la distancia pone a prueba"],
        entorno: [
            "a veces le toca elegir entre lo que siente y lo que le dicen",
        ],
    },
    espera: {
        reviso: ["mira la última conexión; la espera le inquieta"],
        escribo: ["prefiere preguntar a quedarse con la duda"],
        como_si_nada: ["esconde cuánto le importa"],
        que_hice: ["busca la falla en sí antes que en la otra persona"],
        sigo: ["no deja que una respuesta le marque el día"],
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
            "sabe querer; lo difícil es quedarse cuando se vuelve serio",
        ],
        celos: [
            "atiende al tono de un mensaje más que a sus palabras",
            "preguntas de pasada para confirmar una sospecha",
        ],
        no_se: [
            "historias que empiezan distinto y terminan parecido",
            "desde adentro le cuesta ver lo que se repite",
        ],
    },
    // No longer asked: readings made before still carry it.
    necesidad: {
        seguridad: [
            "un plan cumplido le calma más que una frase bonita",
            "se fija en si la otra persona llega a la hora",
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
            "el interés se va cuando la otra persona deja de sorprenderle",
        ],
        complicidad: [
            "sus mejores recuerdos en pareja: reírse por tonterías",
            "poder escribir cualquier cosa a cualquier hora sin explicar",
        ],
    },
    herida: {
        abandono: [
            "una demora en responder → imagina lo peor primero",
            "le importa cerrar bien las cosas: sabe lo que duele lo contrario",
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
            "cuida su espacio y su gente más de lo que parece",
            "desconfía de lo que va demasiado rápido",
        ],
        perder_me: [
            "alguna vez cedió algo suyo para que una relación funcionara (tiempo, gente, planes, sueños): cuál, lo sabe su vida; no lo elijas",
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

/** The clues for these answers, in the quiz's order. */
export function cluesFor(answers: readonly QuizAnswer[]): string[] {
    return answers.flatMap((a) => CLUES[a.questionId]?.[a.optionId] ?? []);
}
