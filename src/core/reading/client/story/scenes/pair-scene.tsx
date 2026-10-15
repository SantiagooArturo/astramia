"use client";

import { motion, useReducedMotion } from "motion/react";
import { MoonDisc } from "@/core/landing/client/effects";
import { ZODIAC_SIGNS } from "@/core/landing/domain/zodiac";
import type { StoryBody } from "@/core/reading/domain/story";
import type { AspectName, NatalChart } from "@/core/reading/domain/types";
import { ASPECT_COLOR } from "../../components/natal-wheel";
import { Globe } from "../globe";
import { phaseAt, phaseFraction } from "./moon-phase-scene";

/** What an aspect does, in words anyone reads (never its technical name). */
const ASPECT_WORDS: Record<AspectName, string> = {
    conjunción: "van juntos",
    sextil: "se dan una mano",
    trígono: "se entienden",
    cuadratura: "tiran para lados distintos",
    oposición: "se miran de frente",
};

/** The Sun's canvas leaves room for its corona: same visible size, bigger box. */
const SIZE: Record<StoryBody, string> = {
    Sol: "size-[min(52vw,230px)] lg:size-[340px] -m-[11vw] lg:-m-[80px]",
    Luna: "size-[min(28vw,130px)] lg:size-[180px]",
    Venus: "size-[min(30vw,140px)] lg:size-[200px]",
    Marte: "size-[min(30vw,140px)] lg:size-[200px]",
};

function Body({ body, chart }: { body: StoryBody; chart: NatalChart }) {
    const placement = chart.placements.find((p) => p.body === body);
    const glyph = ZODIAC_SIGNS.find((s) => s.name === placement?.sign)?.glyph;
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center">
                <Globe
                    body={body}
                    phase={
                        body === "Luna"
                            ? phaseFraction(chart.moonPhase)
                            : undefined
                    }
                    className={SIZE[body]}
                    fallback={
                        body === "Luna" ? (
                            <MoonDisc
                                phase={phaseAt(phaseFraction(chart.moonPhase))}
                                className={SIZE.Luna}
                            />
                        ) : (
                            <div
                                className={`rounded-full bg-astral-gold/70 ${SIZE.Venus}`}
                            />
                        )
                    }
                />
            </div>
            <p className="font-mono text-[11px] text-astral-gold uppercase tracking-[0.2em] max-lg:hidden">
                {body} · {glyph} {placement?.sign}
            </p>
        </div>
    );
}

/**
 * Two bodies side by side, for the text about what they do together. If
 * the chart has an aspect between them, a line joins them with what it
 * means in plain words.
 */
export function PairScene({
    bodies,
    chart,
    born,
}: {
    bodies: readonly [StoryBody, StoryBody];
    chart: NatalChart;
    born: string;
}) {
    const reducedMotion = useReducedMotion();
    const aspect = chart.aspects.find(
        (a) =>
            (a.a === bodies[0] && a.b === bodies[1]) ||
            (a.a === bodies[1] && a.b === bodies[0]),
    );
    const color = aspect ? ASPECT_COLOR[aspect.name] : "var(--astral-ink)";

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6">
            <div className="relative flex items-center justify-center gap-[14vw] lg:gap-28">
                <motion.div
                    aria-hidden
                    className="absolute top-[calc(50%-14px)] right-[22%] left-[22%] h-px origin-left"
                    style={{
                        background: color,
                        boxShadow: aspect ? `0 0 12px ${color}` : undefined,
                        opacity: aspect ? 0.9 : 0.5,
                    }}
                    initial={{ scaleX: reducedMotion ? 1 : 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                        duration: reducedMotion ? 0 : 1.2,
                        delay: reducedMotion ? 0 : 0.8,
                        ease: "easeInOut",
                    }}
                />
                {bodies.map((body, i) => (
                    <motion.div
                        key={body}
                        initial={{
                            opacity: 0,
                            x: reducedMotion ? 0 : i === 0 ? -40 : 40,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: reducedMotion ? 0 : 1,
                            ease: [0.2, 0.8, 0.2, 1],
                        }}
                    >
                        <Body body={body} chart={chart} />
                    </motion.div>
                ))}
            </div>
            <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em] max-lg:hidden">
                {aspect
                    ? `${born} · ${ASPECT_WORDS[aspect.name]}`
                    : `${born} · tu carta`}
            </p>
        </div>
    );
}
