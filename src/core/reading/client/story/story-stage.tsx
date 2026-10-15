"use client";

import { AnimatePresence, motion } from "motion/react";
import { type StoryVisual, visualKey } from "@/core/reading/domain/story";
import type { NatalChart } from "@/core/reading/domain/types";
import { PairScene } from "./scenes/pair-scene";
import { SkyScene, StarScene } from "./scenes/sky-scenes";
import { SolarSystemScene } from "./scenes/solar-system-scene";
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
        case "system":
            return <SolarSystemScene chart={chart} born={born} focus={null} />;
        case "planet":
            return (
                <SolarSystemScene chart={chart} born={born} focus={visual} />
            );
        case "wheel":
            return (
                <SkyScene
                    chart={chart}
                    litAspects
                    caption={`Tu cielo · ${born}`}
                />
            );
        case "moonPhase":
            // The camera flies to the Moon; its phase is what it finds there.
            return (
                <SolarSystemScene
                    chart={chart}
                    born={born}
                    focus={{ body: "Luna", phase: visual.phase }}
                />
            );
        case "venusPath":
            return (
                <VenusPathScene events={visual.events} focus={visual.focus} />
            );
        case "star":
            return <StarScene />;
        case "pair": {
            const pair = (
                <PairScene bodies={visual.bodies} chart={chart} born={born} />
            );
            // Not bought yet: there, but out of focus.
            return visual.locked ? (
                <div aria-hidden className="h-full w-full opacity-70 blur-md">
                    {pair}
                </div>
            ) : (
                pair
            );
        }
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
