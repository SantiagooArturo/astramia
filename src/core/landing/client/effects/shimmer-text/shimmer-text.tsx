import type { ComponentProps } from "react";
import { cn } from "@/frontend/lib/utils";
import styles from "./shimmer-text.module.css";

/** Gold-to-violet gradient text with a slow light sweep. */
export function ShimmerText({ className, ...props }: ComponentProps<"span">) {
    return <span className={cn(styles.shimmer, className)} {...props} />;
}
