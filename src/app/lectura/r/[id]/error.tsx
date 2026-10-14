"use client";

import { ReadingShell } from "@/core/reading/client/screens/reading-shell";
import { Button } from "@/frontend/components/ui/button";

export default function ReadingError({ reset }: { reset: () => void }) {
    return (
        <ReadingShell>
            <h1 className="font-display text-3xl">
                Algo falló al preparar tu lectura
            </h1>
            <p className="text-muted-foreground">
                Tu pago y tu lectura están a salvo. Vuelve a intentarlo en un
                momento.
            </p>
            <Button onClick={reset} className="w-fit">
                Reintentar
            </Button>
        </ReadingShell>
    );
}
