import { PAYMENT_PROCESSOR } from "@/core/legal/domain/business";
import { REFUND_POLICY } from "@/core/legal/domain/policies";
import { formatPrice, PRODUCTS } from "@/core/payment/domain/catalog";
import { LOVE_QUIZ } from "@/core/reading/domain/quiz";
import { CHAT_LIMITS } from "@/core/reading/domain/schemas";

/**
 * Landing copy + product facts. Single source so pricing/session length
 * never drift between sections.
 */

const UNLOCK_PRICE = PRODUCTS.reading_unlock.price;

export const OFFER = {
    price: formatPrice(UNLOCK_PRICE),
    priceAmount: UNLOCK_PRICE.amountCents / 100,
    currency: UNLOCK_PRICE.currency,
    chatHours: CHAT_LIMITS.hours,
    questions: LOVE_QUIZ.length,
} as const;

/** Entry point of the purchase flow (cuestionario → pago → lectura). */
export const START_READING_HREF = "/lectura/amor";

/** Same entry point, pre-filled with the sun sign the visitor found. */
export function startReadingHref(signId?: string): string {
    return signId
        ? `${START_READING_HREF}?signo=${encodeURIComponent(signId)}`
        : START_READING_HREF;
}

export const NAV_LINKS = [
    { href: "/#experiencias", label: "Lecturas" },
    { href: "/#como-funciona", label: "Cómo funciona" },
    { href: "/#conversacion", label: "El chat" },
    { href: "/#precio", label: "Precio" },
    { href: "/#preguntas", label: "Preguntas" },
] as const;

export const HERO = {
    kicker: "Lectura de amor · hecha con tus respuestas",
    headline: ["Tu carta astral,", "ahora conversa", "contigo."],
    lede: `Responde ${OFFER.questions} preguntas. En minutos tienes una lectura de amor escrita para ti, no para tu signo. Y ${OFFER.chatHours} horas para seguir preguntando a una IA que la leyó antes que tú.`,
    birthPrompt: "¿Cuándo naciste?",
    birthHint: "Solo el día y el mes. No se guarda en ningún lado.",
    ctaDefault: `Empezar mi lectura · ${OFFER.price}`,
    ctaForSign: (signName: string) =>
        `Ver mi lectura de ${signName} · ${OFFER.price}`,
} as const;

export interface Experience {
    id: string;
    numeral: string;
    title: string;
    description: string;
    /** Astro detail that anchors the reading, shown as marginalia. */
    anchor: string;
    available: boolean;
}

export const EXPERIENCES: Experience[] = [
    {
        id: "amor",
        numeral: "I",
        title: "Amor y relaciones",
        description:
            "Qué buscas cuando dices que no buscas nada. El patrón que repites desde la segunda relación. Y hacia dónde se mueve Venus en los próximos meses para ti.",
        anchor: "Venus · casa VII · Luna",
        available: true,
    },
    {
        id: "compatibilidad",
        numeral: "II",
        title: "Compatibilidad",
        description:
            "Dos cartas, una sobre la otra. Dónde encajan sin esfuerzo y dónde van a chocar.",
        anchor: "Sinastría",
        available: false,
    },
    {
        id: "personalidad",
        numeral: "III",
        title: "Personalidad",
        description:
            "Sol, Luna y Ascendente: cómo te ven, cómo te sientes y cómo te presentas.",
        anchor: "Sol · Luna · ASC",
        available: false,
    },
    {
        id: "camino",
        numeral: "IV",
        title: "Camino personal",
        description:
            "Los tránsitos que estás atravesando y qué capítulo te están abriendo.",
        anchor: "Tránsitos",
        available: false,
    },
];

export interface Step {
    numeral: string;
    title: string;
    description: string;
    /** Small mono note beside the step, almanac style. */
    note: string;
}

export const STEPS: Step[] = [
    {
        numeral: "01",
        title: "Elige tu lectura",
        description:
            "Por ahora, amor y relaciones. Es la pregunta que más nos llega y la que mejor sabemos leer.",
        note: "1 min",
    },
    {
        numeral: "02",
        title: `Responde ${OFFER.questions} preguntas`,
        description:
            "Qué está pasando, qué te preocupa y, si la sabes, tu hora y lugar de nacimiento para calcular tu Ascendente.",
        note: "3 min",
    },
    {
        numeral: "03",
        title: "Paga una sola vez",
        description: `${OFFER.price} con tarjeta de crédito o débito. Ves el precio antes, no después. Sin suscripción.`,
        note: OFFER.price,
    },
    {
        numeral: "04",
        title: "Recibe tu lectura",
        description:
            "Escrita con tus respuestas y tu carta: Venus, la Luna, la casa VII. No un horóscopo de signo.",
        note: "minutos",
    },
    {
        numeral: "05",
        title: `Conversa ${OFFER.chatHours} horas`,
        description:
            "Pregunta lo que la lectura te dejó pensando. La IA ya sabe lo que respondiste y lo que te escribió.",
        note: `${OFFER.chatHours} h`,
    },
];

export interface ChatMessage {
    from: "user" | "astramia";
    text: string;
}

/** What the assistant "remembers" from the demo user's questionnaire. */
export const DEMO_CONTEXT = {
    sun: "Sol en Escorpio",
    venus: "Venus 14°32′ ♏",
    answer: "«terminó hace dos meses y no sé si cerré»",
} as const;

export const DEMO_CHAT: ChatMessage[] = [
    {
        from: "user",
        text: "En mi lectura dice que Venus en Escorpio me hace intensa. ¿Eso explica por qué me cuesta tanto soltar?",
    },
    {
        from: "astramia",
        text: "En parte. Venus en Escorpio no ama a medias: cuando se abre, lo hace entero, y por eso cerrar le cuesta el doble. En el cuestionario me contaste que terminó hace dos meses y que no sabes si cerraste. ¿Quieres que veamos qué dice tu casa VIII sobre los finales?",
    },
    {
        from: "user",
        text: "Sí. Y también qué me trae este mes.",
    },
    {
        from: "astramia",
        text: "Vamos por partes. Este mes Venus transita tu casa IV: menos ganas de salir, más de ordenar lo de adentro. No es un mes para forzar un cierre, es para entender qué parte de ti sigue esperando una llamada.",
    },
];

export const PRICING_INCLUDES = [
    { item: "Lectura de amor y relaciones", detail: "escrita para ti" },
    { item: "Tu carta natal interpretada", detail: "Sol, Luna, Venus, ASC" },
    {
        item: `${OFFER.chatHours} horas de chat con tu asistente`,
        detail: "sabe lo que respondiste",
    },
    { item: "Acceso a tu lectura", detail: "para siempre" },
    { item: "Suscripción", detail: "ninguna" },
] as const;

export interface FinePrintPoint {
    numeral: string;
    title: string;
    description: string;
}

/** Trust points written as "letra clara" rather than a feature grid. */
export const FINE_PRINT: FinePrintPoint[] = [
    {
        numeral: "§1",
        title: "El precio es ese",
        description: `${OFFER.price}, una vez. Lo ves antes de responder la primera pregunta y no hay un segundo cobro escondido en las ${OFFER.chatHours} horas de chat.`,
    },
    {
        numeral: "§2",
        title: "Tu tarjeta no pasa por nosotros",
        description:
            "El pago lo procesa una pasarela certificada. Astramia nunca ve ni guarda el número de tu tarjeta.",
    },
    {
        numeral: "§3",
        title: "Tus respuestas son tuyas",
        description:
            "Las usamos para escribir tu lectura y para que el chat te entienda. No las vendemos, no las compartimos, no entrenan nada.",
    },
    {
        numeral: "§4",
        title: "Es entretenimiento, y lo decimos",
        description:
            "Astramia es astrología para conocerte y pasarla bien. No reemplaza a un psicólogo, a un médico ni a un abogado, y no toma decisiones por ti.",
    },
];

export interface Faq {
    question: string;
    answer: string;
}

export const FAQS: Faq[] = [
    {
        question: `¿Qué recibo exactamente por ${OFFER.price}?`,
        answer: `Una lectura de amor y relaciones escrita a partir de tu carta y tus respuestas, más ${OFFER.chatHours} horas de conversación con un asistente de IA que ya la leyó. La lectura queda guardada para siempre; el chat se cierra cuando se acaban las ${OFFER.chatHours} horas.`,
    },
    {
        question: "¿Necesito saber mi hora exacta de nacimiento?",
        answer: "No. Con fecha, hora y lugar podemos calcular tu Ascendente y las casas, y la lectura gana precisión. Sin la hora, trabajamos con tu Sol, tu Luna aproximada y Venus, que es lo que más pesa en una lectura de amor.",
    },
    {
        question: `¿Qué pasa cuando terminan las ${OFFER.chatHours} horas?`,
        answer: "El chat se cierra y no se puede extender. Tu lectura completa sigue disponible para volver a leerla cuando quieras.",
    },
    {
        question: "¿Es una suscripción?",
        answer: "No. Es un pago único. No guardamos tu tarjeta y no hay cobros futuros.",
    },
    {
        question: "¿Y si no me convence?",
        answer: `Si es tu primera compra, tienes ${REFUND_POLICY.firstPurchaseDays} días para pedir el reembolso completo, sin explicar por qué. Si tu lectura no llegó o hubo una falla técnica, tienes ${REFUND_POLICY.technicalIssueDays} días. El pago lo procesa ${PAYMENT_PROCESSOR} y el dinero vuelve a tu misma tarjeta.`,
    },
    {
        question: "¿La lectura la escribe una persona o una IA?",
        answer: "Una IA, con reglas de interpretación astrológica y lo que tú nos cuentas. Por eso llega en minutos y por eso después puedes conversar con ella sobre lo que escribió.",
    },
    {
        question: "¿Funciona desde el celular?",
        answer: "Sí. Está pensado para hacerse desde el teléfono, del cuestionario al chat.",
    },
];

export const FINAL_CTA = {
    headline: "Venus ya está en algún lugar de tu carta.",
    sub: `Descubre dónde. Tu lectura de amor y ${OFFER.chatHours} horas de conversación por ${OFFER.price}.`,
} as const;
