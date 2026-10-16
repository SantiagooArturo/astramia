/**
 * Who sees the panel. Hardcoded on purpose: no setting to leak or forget.
 * Each one signs in with an e-mail code or Google, which prove the address.
 */
export const PANEL_EMAILS: readonly string[] = [
    "hectorzerrillo85@gmail.com",
    "sfrancobaanante@gmail.com",
    "santiago@workin2.com",
];

export const isPanelEmail = (email: string | null | undefined): boolean =>
    Boolean(email) && PANEL_EMAILS.includes((email ?? "").trim().toLowerCase());
