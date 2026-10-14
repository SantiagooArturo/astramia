"use client";

import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
} from "motion/react";
import type { ComponentProps, PointerEvent } from "react";
import { cn } from "@/frontend/lib/utils";
import { SpotlightCard } from "../spotlight-card/spotlight-card";
import styles from "./tilt-card.module.css";

interface TiltCardProps extends ComponentProps<typeof SpotlightCard> {
    /** Maximum tilt in degrees. */
    maxTilt?: number;
}

/** `SpotlightCard` that tilts in 3D toward the pointer. */
export function TiltCard({ className, maxTilt = 7, ...props }: TiltCardProps) {
    const reducedMotion = useReducedMotion();
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const spring = { stiffness: 140, damping: 18, mass: 0.6 };
    const sx = useSpring(rotateX, spring);
    const sy = useSpring(rotateY, spring);

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (reducedMotion || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        rotateY.set(px * maxTilt * 2);
        rotateX.set(-py * maxTilt * 2);
    };

    const onPointerLeave = () => {
        rotateX.set(0);
        rotateY.set(0);
    };

    return (
        <motion.div
            className={styles.scene}
            style={{ rotateX: sx, rotateY: sy, transformPerspective: 1100 }}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
        >
            <SpotlightCard className={cn(styles.card, className)} {...props} />
        </motion.div>
    );
}
