"use client";

import {
    motion,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
} from "motion/react";
import { useRef } from "react";
import { cn } from "@/frontend/lib/utils";
import styles from "./scroll-path.module.css";

interface ScrollPathProps {
    /** SVG path data, in `viewBox` units. */
    d: string;
    viewBox: string;
    className?: string;
    /** Set to "none" when the SVG is stretched over a layout column. */
    preserveAspectRatio?: string;
}

/**
 * An SVG path that draws itself as the viewer scrolls past it, with a small
 * gold comet riding the drawn tip. Position the SVG over the content whose
 * scroll should drive it; its own bounds define the scroll window.
 */
export function ScrollPath({
    d,
    viewBox,
    className,
    preserveAspectRatio = "none",
}: ScrollPathProps) {
    const ref = useRef<HTMLDivElement>(null);
    const reducedMotion = useReducedMotion();
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 80%", "end 60%"],
    });
    const smooth = useSpring(scrollYProgress, {
        stiffness: 70,
        damping: 22,
        restDelta: 0.001,
    });
    const pathLength = useTransform(smooth, (v) => (reducedMotion ? 1 : v));
    const offsetDistance = useTransform(
        smooth,
        (v) => `${(reducedMotion ? 1 : v) * 100}%`,
    );

    return (
        <div
            ref={ref}
            aria-hidden="true"
            className={cn(styles.root, className)}
        >
            <svg
                aria-hidden="true"
                viewBox={viewBox}
                preserveAspectRatio={preserveAspectRatio}
                className={styles.svg}
            >
                <path
                    d={d}
                    className={styles.track}
                    vectorEffect="non-scaling-stroke"
                />
                <motion.path
                    d={d}
                    className={styles.ink}
                    vectorEffect="non-scaling-stroke"
                    style={{ pathLength }}
                />
                <motion.circle
                    r="3"
                    className={styles.comet}
                    style={{ offsetPath: `path("${d}")`, offsetDistance }}
                />
            </svg>
        </div>
    );
}
