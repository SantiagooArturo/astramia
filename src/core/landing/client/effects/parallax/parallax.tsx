"use client";

import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from "motion/react";
import type { PropsWithChildren } from "react";

interface ParallaxLayerProps extends PropsWithChildren {
    className?: string;
    /** Fraction of the scroll distance the layer moves against. 0.2 ≈ far. */
    speed?: number;
}

/** Scroll-linked layer that drifts slower than the page. */
export function ParallaxLayer({
    children,
    className,
    speed = 0.2,
}: ParallaxLayerProps) {
    const reducedMotion = useReducedMotion();
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, (v) => (reducedMotion ? 0 : v * -speed));

    return (
        <motion.div className={className} style={{ y }}>
            {children}
        </motion.div>
    );
}
