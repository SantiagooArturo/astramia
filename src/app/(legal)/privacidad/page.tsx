import type { Metadata } from "next";
import { PrivacyDocument } from "@/core/legal/client/privacy-document";

export const metadata: Metadata = {
    title: "Política de Privacidad — Astramia",
    description:
        "Qué datos recopila Astramia, para qué los usa, cuánto tiempo los guarda y cómo ejercer tus derechos.",
};

export default function PrivacyPage() {
    return <PrivacyDocument />;
}
