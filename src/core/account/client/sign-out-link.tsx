"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/frontend/auth/auth";
import { Button } from "@/frontend/components/ui/button";

export function SignOutLink() {
    const router = useRouter();
    return (
        <Button
            variant="link"
            className="h-auto px-0 text-muted-foreground"
            onClick={async () => {
                await authClient.signOut();
                router.refresh();
            }}
        >
            Cerrar sesión
        </Button>
    );
}
