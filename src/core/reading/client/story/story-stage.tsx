"use client";

import { AnimatePresence, motion } from "motion/react";
import { type StoryVisual, visualKey } from "@/core/reading/domain/story";
import type { NatalChart } from "@/core/reading/domain/types";
import { MoonPhaseScene } from "./scenes/moon-phase-scene";
import { PlanetScene } from "./scenes/planet-scene";
import { DawnScene, SkyScene, StarScene } from "./scenes/sky-scenes";
import { VenusPathScene } from "./scenes/venus-path-scene";

function Scene({
    visual,
    chart,
    born,
}: {
    visual: StoryVisual;
    chart: NatalChart;
    born: string;
}) {
    switch (visual.kind) {
        case "sky":
            return <SkyScene chart={chart} caption={`Tu cielo · ${born}`} />;
        case "wheel":
            return (
                <SkyScene
                    chart={chart}
                    litAspects
                    caption={`Tu cielo · ${born}`}
                />
            );
        case "planet":
            return (
                <PlanetScene
                    body={visual.body}
                    sign={visual.sign}
                    signs={visual.signs}
                    moonPhase={chart.moonPhase}
                    born={born}
                />
            );
        case "moonPhase":
            return <MoonPhaseScene phase={visual.phase} born={born} />;
        case "venusPath":
            return <VenusPathScene events={visual.events} />;
        case "star":
            return <StarScene />;
        case "dawn":
            return <DawnScene />;
        case "night":
            return null;
    }
}

/**
 * What's on screen behind the text. Scenes crossfade; a step that keeps the
 * same visual keeps the scene as it is instead of replaying it.
 */
export function StoryStage({
    visual,
    chart,
    born,
}: {
    visual: StoryVisual;
    chart: NatalChart;
    /** "19 feb 2001": every birth-sky scene says which day it shows. */
    born: string;
}) {
    return (
        <AnimatePresence initial={false}>
            <motion.div
                key={visualKey(visual)}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
            >
                <Scene visual={visual} chart={chart} born={born} />
            </motion.div>
        </AnimatePresence>
    );
}
