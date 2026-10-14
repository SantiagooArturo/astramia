import { getSkySnapshot } from "@/core/landing/domain/ephemeris";
import { formatDegree, getSunSign } from "@/core/landing/domain/zodiac";

/** Lima is UTC−5 all year; the launch market. Unknown birth time → noon. */
const DEFAULT_UTC_OFFSET_HOURS = -5;

export interface NatalPlacement {
    body: string;
    sign: string;
    degree: string;
}

/** Sun, Moon, Venus and Mars at birth, low precision but enough for signs. */
export function natalPlacements(
    birthDate: string,
    birthTime?: string | null,
): NatalPlacement[] {
    const [hours, minutes] = (birthTime ?? "12:00").split(":").map(Number);
    const [y, m, d] = birthDate.split("-").map(Number);
    const instant = new Date(
        Date.UTC(y, m - 1, d, hours - DEFAULT_UTC_OFFSET_HOURS, minutes),
    );
    const sky = getSkySnapshot(instant);
    return [sky.sun, sky.moon, sky.venus, sky.mars].map((body) => ({
        body: body.name,
        sign: body.position.sign.name,
        degree: formatDegree(body.position),
    }));
}

export function sunSignOf(birthDate: string): string {
    const [, m, d] = birthDate.split("-").map(Number);
    return getSunSign(m, d)?.name ?? "desconocido";
}
