/** Better Auth error → what the buyer can do about it. */
export function authErrorMessage(error: {
    code?: string;
    status?: number;
}): string {
    if (error.status === 429)
        return "Demasiados intentos. Espera un minuto y vuelve a probar.";
    switch (error.code) {
        case "INVALID_EMAIL_OR_PASSWORD":
            return "El correo o la contraseña no coinciden.";
        case "INVALID_EMAIL":
            return "Revisa que tu correo esté bien escrito.";
        case "PASSWORD_TOO_SHORT":
            return "Usa al menos 8 caracteres.";
        case "INVALID_OTP":
            return "Ese código no es correcto. Revísalo o pide otro.";
        case "OTP_EXPIRED":
            return "El código venció. Pide uno nuevo.";
        case "TOO_MANY_ATTEMPTS":
            return "Demasiados intentos con ese código. Pide uno nuevo.";
        default:
            return "No pudimos completar esto ahora. Inténtalo otra vez.";
    }
}
