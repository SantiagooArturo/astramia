"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/frontend/lib/utils";
import styles from "./scramble-text.module.css";

// Each glyph carries U+FE0E so platforms never swap in an emoji.
const GLYPHS = Array.from("♈♉♊♋♌♍♎♏♐♑♒♓☉☾☿♀♂♃♄·").map(
    (g) => `${g}\uFE0E`,
);

interface ScrambleTextProps {
    text: string;
    className?: string;
    /** Seconds before the decode starts once in view. */
    delay?: number;
    /** Total decode time in seconds. */
    duration?: number;
}

/**
 * Decodes a headline out of zodiac and planet glyphs once it scrolls into
 * view. Screen readers get the plain text; the animated copy is aria-hidden.
 */
export function ScrambleText({
    text,
    className,
    delay = 0,
    duration = 1.4,
}: ScrambleTextProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-10% 0px" });
    const reducedMotion = useReducedMotion();
    const [display, setDisplay] = useState(text);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        if (!inView || reducedMotion) return;
        let frame = 0;
        let start = 0;
        const chars = Array.from(text);
        const total = chars.length;
        const randomGlyph = () =>
            GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

        const tick = (now: number) => {
            if (!start) start = now + delay * 1000;
            const elapsed = (now - start) / 1000;
            if (elapsed < 0) {
                setDisplay(chars.map((c) => (c === " " ? " " : "·")).join(""));
                frame = requestAnimationFrame(tick);
                return;
            }
            setRunning(true);
            const progress = Math.min(elapsed / duration, 1);
            const next = chars
                .map((char, i) => {
                    if (char === " ") return " ";
                    // Characters resolve left to right, with a little jitter.
                    const threshold = (i / total) * 0.85;
                    return progress >= threshold ? char : randomGlyph();
                })
                .join("");
            setDisplay(next);
            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            } else {
                setRunning(false);
            }
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [inView, reducedMotion, text, delay, duration]);

    return (
        <span ref={ref} className={cn(styles.root, className)}>
            <span className="sr-only">{text}</span>
            <span
                aria-hidden
                className={cn(styles.glyphs, running && styles.running)}
            >
                {display}
            </span>
        </span>
    );
}
