import { describe, expect, it } from "vitest";
import {
    getSkySnapshot,
    julianDay,
    marsLongitude,
    moonLongitude,
    moonPhase,
    sunLongitude,
    venusLongitude,
} from "../ephemeris";

const jd = (iso: string) => julianDay(new Date(iso));
const angularDistance = (a: number, b: number) => {
    const d = Math.abs(((a - b) % 360) + 360) % 360;
    return Math.min(d, 360 - d);
};

describe("julianDay", () => {
    it("matches J2000.0", () => {
        expect(jd("2000-01-01T12:00:00Z")).toBeCloseTo(2451545, 5);
    });
});

describe("sunLongitude", () => {
    it("is 0° at the March equinox", () => {
        // 2024-03-20 03:06 UTC
        expect(
            angularDistance(sunLongitude(jd("2024-03-20T03:06:00Z")), 0),
        ).toBeLessThan(0.05);
    });

    it("is 90° at the June solstice", () => {
        // 2024-06-20 20:51 UTC
        expect(
            angularDistance(sunLongitude(jd("2024-06-20T20:51:00Z")), 90),
        ).toBeLessThan(0.05);
    });

    it("is 270° at the December solstice", () => {
        // 2023-12-22 03:27 UTC
        expect(
            angularDistance(sunLongitude(jd("2023-12-22T03:27:00Z")), 270),
        ).toBeLessThan(0.05);
    });
});

describe("moon", () => {
    it("is conjunct the Sun at a new moon", () => {
        // New moon 2024-01-11 11:57 UTC
        const t = jd("2024-01-11T11:57:00Z");
        expect(angularDistance(moonLongitude(t), sunLongitude(t))).toBeLessThan(
            1,
        );
        const phase = moonPhase(t);
        expect(phase.name).toBe("Luna nueva");
        expect(phase.illumination).toBeLessThan(0.01);
    });

    it("opposes the Sun at a full moon", () => {
        // Full moon 2024-01-25 17:54 UTC
        const t = jd("2024-01-25T17:54:00Z");
        expect(
            angularDistance(moonLongitude(t) - 180, sunLongitude(t)),
        ).toBeLessThan(1);
        const phase = moonPhase(t);
        expect(phase.name).toBe("Luna llena");
        expect(phase.illumination).toBeGreaterThan(0.99);
    });

    it("reports a waxing quarter between new and full", () => {
        // First quarter 2024-01-18 03:53 UTC
        const phase = moonPhase(jd("2024-01-18T03:53:00Z"));
        expect(phase.name).toBe("Cuarto creciente");
        expect(phase.waxing).toBe(true);
        expect(phase.illumination).toBeCloseTo(0.5, 1);
    });
});

describe("planets", () => {
    it("keeps Venus within its maximum elongation from the Sun", () => {
        for (let year = 2020; year <= 2030; year++) {
            for (const month of ["01", "04", "07", "10"]) {
                const t = jd(`${year}-${month}-15T00:00:00Z`);
                expect(
                    angularDistance(venusLongitude(t), sunLongitude(t)),
                ).toBeLessThan(48);
            }
        }
    });

    it("puts Venus at superior conjunction on 2024-06-04", () => {
        const t = jd("2024-06-04T16:00:00Z");
        expect(
            angularDistance(venusLongitude(t), sunLongitude(t)),
        ).toBeLessThan(1.5);
    });

    it("puts Mars at opposition on 2025-01-16", () => {
        const t = jd("2025-01-16T02:00:00Z");
        expect(
            angularDistance(marsLongitude(t) - 180, sunLongitude(t)),
        ).toBeLessThan(1.5);
    });
});

describe("getSkySnapshot", () => {
    it("bundles every body with a sign position", () => {
        const snapshot = getSkySnapshot(new Date("2024-10-31T00:00:00Z"));
        expect(snapshot.sun.position.sign.id).toBe("escorpio");
        expect(snapshot.moon.phase.name).toBe("Luna nueva");
        expect(snapshot.venus.glyph).toBe("♀");
        expect(snapshot.mars.position.degree).toBeGreaterThanOrEqual(0);
        expect(snapshot.mars.position.degree).toBeLessThan(30);
    });
});
