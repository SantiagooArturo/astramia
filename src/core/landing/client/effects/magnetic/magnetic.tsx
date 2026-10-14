"use client";

import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
} from "motion/react";
import type { PointerEvent, PropsWithChildren } from "react";
import { cn } from "@/frontend/lib/utils";
import styles from "./magnetic.module.css";

interface MagneticProps extends PropsWithChildren {
    className?: string;
    /** How far the child follows the pointer, 0–1. */
    strength?: number;
}

/** Pulls its child gently toward the pointer while hovered. */
export function Magnetic({
    children,
    className,
    strength = 0.35,
}: MagneticProps) {
    const reducedMotion = useReducedMotion();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const spring = { stiffness: 180, damping: 16, mass: 0.4 };
    const sx = useSpring(x, spring);
    const sy = useSpring(y, spring);

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (reducedMotion || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - rect.left - rect.width / 2) * strength);
        y.set((event.clientY - rect.top - rect.height / 2) * strength);
    };

    const onPointerLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            className={cn(styles.root, className)}
            style={{ x: sx, y: sy }}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
        >
            {children}
        </motion.div>
    );
}
