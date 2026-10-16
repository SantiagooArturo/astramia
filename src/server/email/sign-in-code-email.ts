import type { Email } from "./send-email";

export const SIGN_IN_CODE_MINUTES = 10;

/** The 6-digit code that signs in (or creates) an account. */
export function signInCodeEmail(to: string, code: string): Email {
    const text = `Escribe este código en Astramia para entrar: ${code}

Vence en ${SIGN_IN_CODE_MINUTES} minutos. Si no lo pediste, ignora este correo: nadie puede entrar sin él.`;
    const html = `<div style="font-family:Georgia,serif;max-width:420px;margin:0 auto;padding:32px 24px;background:#0b0a1a;color:#f3efe6;border-radius:16px">
<p style="margin:0 0 8px;font:11px/1.4 monospace;letter-spacing:.2em;text-transform:uppercase;color:#d8b46a">Astramia</p>
<p style="margin:0 0 24px;font-size:18px">Escribe este código en Astramia para entrar:</p>
<p style="margin:0 0 24px;font:600 36px/1 monospace;letter-spacing:.3em;color:#d8b46a">${code}</p>
<p style="margin:0;font-size:14px;color:#b9b3c9">Vence en ${SIGN_IN_CODE_MINUTES} minutos. Si no lo pediste, ignora este correo: nadie puede entrar sin él.</p>
</div>`;
    return {
        to,
        subject: `${code} es tu código para entrar a Astramia`,
        text,
        html,
    };
}
