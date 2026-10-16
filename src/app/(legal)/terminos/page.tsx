import type { Metadata } from "next";
import { TermsDocument } from "@/core/legal/client/terms-document";

export const metadata: Metadata = {
    title: "Términos y Condiciones — Astramia",
    description:
        "Condiciones de uso, pago único, política de reembolsos y uso aceptable de Astramia.",
};

export default function TermsPage() {
    return <TermsDocument />;
}
