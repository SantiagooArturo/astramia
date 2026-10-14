/**
 * Legal identity of the seller. Waffo Pancake's account review rejects
 * brand-only names and unmonitored inboxes, so every value here must be
 * real before submitting the store for review.
 */

export const BUSINESS = {
    brand: "Astramia AI",
    /**
     * Individual: full legal name. Company: razón social.
     * TODO(legal): required by Waffo's store review — set before submitting.
     * While `null`, the legal pages identify the seller by brand only.
     */
    legalName: null as string | null,
    /** "individual" omits the registered address, per Waffo's template. */
    entityType: "individual" as "individual" | "company",
    country: "Perú",
    /** Optional: Waffo accepts individuals without RUC. `null` hides it. */
    taxId: null as string | null,
    /** Only shown for companies; individuals publish no address. */
    registeredAddress: null as string | null,
    websiteUrl: "https://astramia.app",
    /** Must match the contact email submitted to Waffo and on receipts. */
    supportEmail: "help@astramia.app",
    businessHours: "lunes a viernes, 9:00–18:00 (hora de Lima, UTC−5)",
    /** Third-party model providers — Waffo requires declaring them. */
    aiProviders: ["Google (Gemini)"],
    /** Where servers and vendors process data (international transfers). */
    processingRegions: ["Estados Unidos"],
    /** Name customers see on their card statement. */
    billingDescriptor: "ASTRAMIA.APP",
} as const;

export const PAYMENT_PROCESSOR = "Waffo Pancake";

export function formatList(items: readonly string[]): string {
    if (items.length <= 1) return items[0] ?? "";
    return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

/** Who answers for the Service: legal name when set, otherwise the brand. */
export function sellerName(): string {
    return BUSINESS.legalName ?? BUSINESS.brand;
}

/** "Nombre · RUC 123", without the RUC part when there is none. */
export function sellerLine(): string {
    return BUSINESS.taxId
        ? `${sellerName()} · RUC ${BUSINESS.taxId}`
        : sellerName();
}
