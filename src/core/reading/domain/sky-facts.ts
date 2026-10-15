import type { MoonPhaseName } from "@/core/landing/domain/ephemeris";
import type { StoryBody, StoryVisual } from "./story";
import type { NatalChart } from "./types";

/**
 * What the chart says, ready for the story: titles anyone reads ("Venus
 * estaba en Aries") and what to show. Shared by every reading's plan.
 */

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

/** What the chart says, as the story titles it ("Venus estaba en Aries"). */
export function skyFacts(chart: NatalChart) {
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

export type SkyFacts = ReturnType<typeof skyFacts>;
