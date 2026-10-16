/**
 * Legal identity of the seller. Payment gateways' account reviews reject
 * brand-only names and unmonitored inboxes, so every value here must be
 * real before submitting for review.
 */

export const BUSINESS = {
    brand: "Astramia",
    /**
     * Individual: full legal name. Company: razón social.
     * TODO(legal): required by the gateway's account review — set before submitting.
     * While `null`, the legal pages identify the seller by brand only.
     */
    legalName: null as string | null,
    /** "individual" omits the registered address. */
    entityType: "individual" as "individual" | "company",
    country: "Perú",
    /** Optional for individuals without RUC. `null` hides it. */
    taxId: null as string | null,
    /** Only shown for companies; individuals publish no address. */
    registeredAddress: null as string | null,
    websiteUrl: "https://astramia.app",
    /** Must match the contact email submitted to the gateway and on receipts. */
    supportEmail: "help@astramia.app",
    businessHours: "lunes a viernes, 9:00–18:00 (hora de Lima, UTC−5)",
    /** Third-party model providers — gateways' reviews ask to declare them. */
    aiProviders: ["Google (Gemini)"],
    /** Where servers and vendors process data (international transfers). */
    processingRegions: ["Estados Unidos"],
    /** Name customers see on their card statement. */
    billingDescriptor: "ASTRAMIA.APP",
} as const;

/**
 * How the legal copy describes each gateway. Keep in sync with
 * `PAYMENT_PROVIDER`: switching gateways is switching `ACTIVE_PROCESSOR`.
 */
const PAYMENT_PROCESSORS = {
    mercadopago: { name: "Mercado Pago", merchantOfRecord: false },
    waffo: { name: "Waffo Pancake", merchantOfRecord: true },
} as const;

const ACTIVE_PROCESSOR = PAYMENT_PROCESSORS.mercadopago;

export const PAYMENT_PROCESSOR: string = ACTIVE_PROCESSOR.name;

/** Whether the processor is the legal seller (MoR) or just processes the card. */
export const PROCESSOR_IS_MERCHANT_OF_RECORD: boolean =
    ACTIVE_PROCESSOR.merchantOfRecord;

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
