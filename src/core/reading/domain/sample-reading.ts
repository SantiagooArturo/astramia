import { LOVE_PLAN, type SceneTexts } from "./plan";
import { keptFree } from "./reading-content";
import type { QuizAnswer } from "./types";

/**
 * A complete paid reading, written the way READING_PROMPT asks, for the
 * story's tests and the /lectura/ejemplo preview: the paid experience can
 * be seen (and checked in a browser) without paying.
 *
 * Chart: 19 Feb 2001, 21:30 in Lima → Sun in Pisces, Moon in Capricorn,
 * Venus in Aries, Mars in Sagittarius, waning crescent Moon, Sun square Mars.
 */
export const SAMPLE_READING = {
    id: "ejemplo",
    birthDate: "2001-02-19",
    birthTime: "21:30",
    birthTimeZone: "America/Lima",
    birthPlace: "Lima",
    /** When its text was written: its "Lo que viene" starts here. */
    writtenAt: "2026-10-15T12:00:00.000Z",
    answers: [
        { questionId: "trato", optionId: "femenino" },
        { questionId: "situacion", optionId: "ruptura" },
        { questionId: "patron", optionId: "doy_demasiado" },
        { questionId: "necesidad", optionId: "complicidad" },
        { questionId: "herida", optionId: "indiferencia" },
        { questionId: "pregunta", optionId: "cuando" },
    ] satisfies QuizAnswer[],
    teaser: "Guardas los audios largos de esa persona aunque ya no los escuches, y cuando alguien nuevo te escribe, contestas rápido y con todo. Tu Venus, el planeta que marca cómo te enamoras, está en Aries: entras de frente. Pero tu Luna pide otra cosa, y ahí empieza lo que se repite. Cuándo llega alguien depende de cuál de las dos escuches primero.",
    content: `Hoy manda la que se apura. Venus en Aries te hace decir que sí antes de terminar de leer el mensaje, y tu Luna en Capricornio, que es lo que necesitas para sentirte en paz, llega tarde a esa conversación: cuando por fin pregunta si esa persona es de fiar, ya entregaste más de lo que pensabas. Por eso, después de cada ruptura, lo que queda no es solo tristeza. Es el cansancio de haber hecho el trabajo de dos.

## Entras corriendo, sales caminando

Con Venus en Aries, el amor se te nota en la velocidad. Respondes en minutos, propones el plan, eres quien escribe "¿y si vamos hoy?". No sabes interesarte a medias: o te importa o no existe. Esa franqueza es lo mejor que tienes, y también la razón por la que a veces la otra persona se relaja demasiado pronto: siente que el esfuerzo ya lo pusiste tú.

Marte, que marca cómo deseas y cómo vas por lo que quieres, está en Sagitario. Te atrae quien te hace reír y te abre una puerta a algo nuevo: un viaje, un tema, otra forma de ver las cosas. Cuando la relación se vuelve una fila de "buenos días" sin nada detrás, tu deseo se apaga en silencio y empiezas a dar más para no notarlo. Eso es lo que se repite: compensas con entrega lo que ya no te enciende.

## Lo que tu calma necesita

Tu Luna en Capricornio necesita pruebas, no promesas. Te sientes en casa con alguien cuando cumple lo que dice un martes cualquiera, no cuando te escribe algo bonito a la una de la mañana. Por eso la indiferencia te dolió tanto: que te ignoren es justo la prueba que nunca quisiste tener.

Tu Sol en Piscis completa el cuadro: sientes lo que la otra persona siente antes de que lo diga, y eso te lleva a cuidar de más. Además, tu Sol y tu Marte tiran hacia lados distintos: una parte de ti quiere fundirse con alguien y otra quiere salir a explorar sola. Cuando no le das espacio a la segunda, la primera termina pagando la cuenta.

## Lo que tu carta sí puede decirte

Tu carta no da una fecha para que llegue alguien, y desconfía de quien te la dé. Lo que sí muestra es el tipo de encuentro que tiene futuro contigo: alguien que te siga el ritmo al principio y que después demuestre, en lo pequeño, que se queda. Esa persona no suele aparecer en el chat de siempre, sino donde estás aprendiendo algo: una clase, un grupo nuevo, un viaje corto.

La señal para reconocerla es simple: a su lado no vas a sentir que tienes que esforzarte el doble. Si a las tres semanas ya estás haciendo todos los planes, no es mala suerte: es el patrón de siempre con otra cara.

## Lo que viene

A finales de octubre Venus entra en Libra y te pide equilibrio: buen momento para notar quién te devuelve lo que das. A mediados de noviembre Venus deja de parecer que va hacia atrás, y lo que estaba en pausa puede moverse, sobre todo si tiene que ver con alguien que ya conoces. A principios de enero entra en Sagitario, el signo de tu Marte: ahí el deseo despierta y es más fácil que alguien nuevo te sorprenda fuera de tu rutina.

## Para este martes

Esta semana, cuando sientas el impulso de contestar al instante o de proponer el plan, espera una hora. No para hacerte la difícil: para escuchar a tu Luna, que necesita ver primero qué hace la otra persona con el espacio que le dejas. Anota en el celular lo que hizo. Esa lista corta te va a decir más que cualquier mensaje bonito.

**Lo que es para ti no necesita que corras: necesita que lo veas venir.**`,
} as const;

/**
 * The same chart's reading written per scene, as READING_PROMPT writes it
 * now (generated with it; one typo fixed): what /lectura/ejemplo shows.
 */
export const SAMPLE_SCENES: SceneTexts = {
    opening:
        "Entras a todo o nada porque confundes la prisa con el interés real. Ahora mismo, mientras dejas atrás a tu ex, sigues con el teléfono en la mano esperando una señal que llene ese vacío rápido.",
    venus: "Con Venus, que marca qué te atrae, en Aries, te enamoras en cinco minutos. No sabes esperar ni fingir desinterés. Si alguien te gusta, propones el plan, mandas el primer mensaje y pones toda la carne en el asador desde el día uno.",
    mars: "Marte, el planeta que enciende tu deseo y tus ganas de actuar, está en Sagitario. Te conquista la risa fácil, los planes improvisados un martes a medianoche y sentir que esa persona es, antes que nada, tu mejor par para reírte del mundo.",
    venusMars:
        "Cuando tu forma de enamorarte y tu deseo se juntan, eres puro impulso. Tomas la iniciativa, resuelves los silencios y sostienes la conversación. El problema es que haces todo el trabajo al principio: dejas a la otra persona tan cómoda recibiendo que después te quedas cansada, llevando la cuenta secreta de todo lo que diste sin que te lo pidieran.",
    moonPhase:
        "Naciste bajo un cielo que ya sabía soltar. Por eso intuyes cuándo algo se terminó mucho antes de decirlo en voz alta, aunque te quedes intentando un poco más.",
    moon: "Tu Luna, que habla de lo que necesitas para sentirte segura y en casa, está en Capricornio. Por dentro eres seria y leal. No te sirven las promesas en el aire: necesitas hechos, constancia y saber que cuentan contigo cuando el día pesa.",
    sun: "Eres Piscis, y en el amor eso significa que escuchas lo que nadie dice. Captas el cambio de tono en un saludo de dos palabras y te entregas con una ternura sin defensas.",
    moonSun:
        "Aquí nace tu dolor más grande. Como Piscis, absorbes todo; con la Luna en Capricornio, te callas para parecer fuerte. Cuando la otra persona se vuelve fría o mira hacia otro lado como si no existieras, no haces un escándalo: te tragas el nudo en la garganta, sigues cumpliendo y te rompes a solas.",
    question:
        "Quieres saber cuándo llega alguien nuevo, pero tu carta muestra que tu Sol y tu Marte tiran para lados opuestos: una parte de ti aún duele lo que terminó, mientras la otra ya quiere salir corriendo a buscar una historia que la distraiga. Hoy Venus parece ir hacia atrás en el cielo, y eso pide limpiar la casa emocional antes de abrir la puerta. Alguien afín a ti se acerca cuando dejes de apurar los tiempos; mira hacia el verano.",
    moments: [
        {
            event: 1,
            text: "A finales de octubre, Venus entra en Libra, justo enfrente de tu Venus en Aries: notarás con claridad quién hace el esfuerzo de buscarte y quién solo espera que tú resuelvas todo.",
        },
        {
            event: 2,
            text: "A mediados de noviembre, Venus deja de ir hacia atrás en Libra y el aire se limpia: lo que seguía doliendo de tu ruptura pierde peso y vuelves a sentir curiosidad real por conocer gente.",
        },
        {
            event: 4,
            text: "A principios de enero, Venus entra en Sagitario y toca a tu Marte: es tu ventana más clara para cruzarte con alguien que traiga risa, complicidad y ganas de compartir planes sin que tengas que empujar.",
        },
    ],
    gesture:
        "Esta semana, cuando sientas el impulso de escribirle a alguien para llenar un rato de silencio, deja el celular boca abajo en otra mesa durante veinte minutos. Deja que la otra persona tenga el espacio de buscarte a ti.",
    closing: "Quien es para ti no necesita que corras para alcanzarlo.",
};

/**
 * The free scenes for the same chart, as the free prompt writes them now
 * and the server keeps them (the hook whole, and where it's cut while the
 * reading is locked): what /lectura/ejemplo opens with, before and after
 * paying.
 */
export const SAMPLE_FREE: SceneTexts = keptFree(
    {
        venus: "Venus habla de cómo te enamoras. La tuya está en Aries: te enamoras rápido y de frente. Si alguien te gusta, escribes tú primero. Propones el plan y no sabes fingir que no te importa.",
        mars: "Marte es cómo deseas. El tuyo está en Sagitario: te enciende reír, moverte y descubrir algo nuevo. Te apaga la rutina sin chispa.",
        venusMars:
            "Juntos, tu Venus y tu Marte hacen que llegues primero a todo. Propones, escribes, organizas, y al principio es emocionante. Pero un día [corte] miras atrás y ves que siempre fuiste tú. No es mala suerte. Tu Venus corre tan rápido que nunca le das a la otra persona el espacio de buscarte.",
    },
    LOVE_PLAN,
);
