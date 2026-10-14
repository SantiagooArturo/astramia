import type { PropsWithChildren } from "react";
import { LegalShell } from "@/core/legal/client/legal-shell";

export default function LegalLayout({ children }: PropsWithChildren) {
    return <LegalShell>{children}</LegalShell>;
}
