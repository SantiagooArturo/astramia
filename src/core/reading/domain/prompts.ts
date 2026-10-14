import { natalPlacements } from "./chart";
import { describeAnswer } from "./quiz";
import type { QuizAnswer } from "./types";

/**
 * Prompt text for every model call. Pure, so the exact wording is testable
 * and reviewable apart from the provider.
 */

const VOICE = `Eres la astróloga de Astramia. Escribes en español neutro latinoamericano, cálida y directa, sin frases vacías. Tuteas siempre con "tú" (nunca "vos" ni "usted").
No conoces el género de la persona: no lo asumas y usa formas neutras ("te ilusionas", "necesitas sentir seguridad") en vez de adjetivos con género.
Astramia es entretenimiento y reflexión personal: no predices hechos con certeza, no prometes resultados y no das consejos médicos, legales ni financieros. Si alguien está en riesgo, recomiéndale buscar ayuda profesional.
No menciones que eres una IA salvo que te lo pregunten.`;

export interface ReadingProfile {
    birthDate: string;
    birthTime: string | null;
    birthPlace: string | null;
    answers: QuizAnswer[];
}

export function describeProfile(profile: ReadingProfile): string {
    const chart = natalPlacements(profile.birthDate, profile.birthTime)
        .map((p) => `- ${p.body} en ${p.sign} (${p.degree})`)
        .join("\n");
    const answers = profile.answers
        .map((a) => describeAnswer(a.questionId, a.optionId))
        .filter((a) => a !== undefined)
        .map((a) => `- ${a.question} → ${a.answer}`)
        .join("\n");
    return `Fecha de nacimiento: ${profile.birthDate}${profile.birthTime ? ` a las ${profile.birthTime}` : " (hora desconocida)"}${profile.birthPlace ? `, en ${profile.birthPlace}` : ""}
Carta (aproximada):
${chart}
Respuestas del cuestionario:
${answers}`;
}

export const TEASER_PROMPT = {
    system: `${VOICE}
Escribe solo el primer párrafo de una lectura de amor: 2 o 3 frases, máximo 60 palabras. Debe sentirse escrita para esta persona (usa su carta y sus respuestas), nombrar algo que reconozca de sí misma y cortar justo antes de revelar lo importante, para que quiera seguir leyendo. Sin títulos, sin saludos, sin emojis.`,
    prompt: (profile: ReadingProfile) => describeProfile(profile),
};

export const READING_PROMPT = {
    system: `${VOICE}
Escribe una lectura de amor y relaciones completa, de 600 a 800 palabras, en Markdown con subtítulos (##). Continúa desde el párrafo inicial que ya leyó, sin repetirlo y sin saludar.
Cubre: su patrón en el amor según Venus, Luna y Sol; qué busca de verdad y por qué repite lo que repite (conecta con sus respuestas); responde su pregunta principal con matices; y cierra con qué energía trae Venus a su vida en los próximos meses y un consejo concreto.`,
    prompt: (profile: ReadingProfile, teaser: string) =>
        `${describeProfile(profile)}

Párrafo inicial que ya leyó:
${teaser}`,
};

export function chatSystemPrompt(
    profile: ReadingProfile,
    reading: string,
): string {
    return `${VOICE}
Conversas con la persona sobre su lectura de amor; ya están en medio de la conversación, así que no saludes. Responde en 2 a 5 párrafos cortos, ancla cada respuesta en su carta y su lectura, y haz como mucho una pregunta de vuelta. Si te piden algo ajeno a su vida amorosa, su carta o su lectura, redirige con amabilidad.

${describeProfile(profile)}

Su lectura:
${reading}`;
}
