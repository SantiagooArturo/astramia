/**
 * Browsers embedded in social apps. Google refuses to sign in inside them
 * ("disallowed_useragent"), so the Google button would only lead to an error:
 * there, e-mail codes are the way in.
 */
const IN_APP_BROWSER =
    /Instagram|FBAN|FBAV|FB_IAB|FBIOS|musical_ly|TikTok|Bytedance|Snapchat|Pinterest|\bLine\/|; wv\)/i;

export function isInAppBrowser(userAgent: string): boolean {
    return IN_APP_BROWSER.test(userAgent);
}
