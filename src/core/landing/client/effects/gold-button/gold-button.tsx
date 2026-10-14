import type { ComponentProps } from "react";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/lib/utils";
import styles from "./gold-button.module.css";

/**
 * shadcn `Button` with a liquid-gold surface: the gradient pools toward the
 * hover and a sheen sweeps across. Server-renderable (pure CSS).
 */
export function GoldButton({
    className,
    ...props
}: ComponentProps<typeof Button>) {
    return <Button className={cn(styles.gold, className)} {...props} />;
}
