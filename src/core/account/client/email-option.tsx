"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/frontend/components/ui/button";

/** The e-mail way in, folded behind a quiet link when Google is offered. */
export function EmailOption({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    if (open) return children;
    return (
        <Button
            type="button"
            variant="link"
            className="h-auto w-fit px-0 text-muted-foreground"
            onClick={() => setOpen(true)}
        >
            Prefiero usar mi correo
        </Button>
    );
}
