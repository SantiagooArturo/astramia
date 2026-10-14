import { cn } from "@/frontend/lib/utils";
import type { MoonPhase } from "../../../domain/ephemeris";
import styles from "./moon-disc.module.css";

const R = 48;

interface MoonDiscProps {
    phase: MoonPhase;
    className?: string;
    /**
     * Which limb is lit while waxing. Peru and most of LatAm see the waxing
     * Moon lit on the left, so "south" is the default.
     */
    hemisphere?: "north" | "south";
}

/** Draws the lit portion of the Moon for a given phase. */
export function MoonDisc({
    phase,
    className,
    hemisphere = "south",
}: MoonDiscProps) {
    const { fraction, illumination, waxing } = phase;
    // +1 lights the right limb, -1 the left.
    const litSide = (waxing ? 1 : -1) * (hemisphere === "north" ? 1 : -1);
    const gibbous = illumination > 0.5;
    const rx = Math.abs(Math.cos(fraction * Math.PI * 2)) * R;

    // Outer limb (half circle) on the lit side, then the terminator ellipse
    // back to the top. Sweep flags choose which side each arc bulges toward.
    const limbSweep = litSide > 0 ? 1 : 0;
    const terminatorSweep = litSide > 0 ? (gibbous ? 1 : 0) : gibbous ? 0 : 1;
    const lit = `M 0 ${-R} A ${R} ${R} 0 0 ${limbSweep} 0 ${R} A ${rx} ${R} 0 0 ${terminatorSweep} 0 ${-R}`;

    return (
        <svg
            viewBox="-60 -60 120 120"
            aria-hidden="true"
            className={cn(styles.svg, className)}
        >
            <circle r={R} className={styles.dark} />
            <path d={lit} className={styles.lit} />
            {/* A few maria so the disc reads as the Moon */}
            <g className={styles.maria}>
                <circle cx="-14" cy="-10" r="9" />
                <circle cx="10" cy="-20" r="5" />
                <circle cx="12" cy="12" r="11" />
                <circle cx="-22" cy="18" r="6" />
            </g>
            <circle r={R} className={styles.rim} />
        </svg>
    );
}
