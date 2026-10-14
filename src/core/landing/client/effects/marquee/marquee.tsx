import type { PropsWithChildren } from "react";
import { cn } from "@/frontend/lib/utils";
import styles from "./marquee.module.css";

interface MarqueeProps extends PropsWithChildren {
    className?: string;
}

/**
 * Endless horizontal ticker. Children are rendered twice; the copy is
 * aria-hidden. Pauses on hover and stops under reduced motion.
 */
export function Marquee({ children, className }: MarqueeProps) {
    return (
        <div className={cn(styles.root, className)}>
            <div className={styles.track}>
                <div className={styles.group}>{children}</div>
                <div className={styles.group} aria-hidden>
                    {children}
                </div>
            </div>
        </div>
    );
}
