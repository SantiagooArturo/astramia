import { describe, expect, it } from "vitest";
import { longitudeToSign } from "@/core/landing/domain/zodiac";
import { natalChart } from "../chart";
import { SAMPLE_READING } from "../sample-reading";
import { BAND, type Point, sightOn, solarSystemView } from "../solar-system";
import type { StoryBody } from "../story";

const chart = natalChart(
    SAMPLE_READING.birthDate,
    SAMPLE_READING.birthTime,
    SAMPLE_READING.birthTimeZone,
);
const view = solarSystemView(chart);

/** The longitude of the direction from `a` to `b`, on screen (y down). */
const angle = (a: Point, b: Point) =>
    ((((Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI) % 360) + 360) %
    360;

describe("the solar system of their birthday", () => {
    it("meets the band in the direction it was asked for", () => {
        const from = { x: 0.2, y: -0.25 };
        const hit = sightOn(from, 75, BAND.inner);
        expect(Math.hypot(hit.x, hit.y)).toBeCloseTo(BAND.inner, 9);
        expect(angle(from, hit)).toBeCloseTo(75, 9);
    });

    it.each<StoryBody>([
        "Venus",
        "Marte",
        "Sol",
        "Luna",
    ])("draws the line from the Earth through %s onto its sign", (body) => {
        const { from, to } = view.sight(body);
        const at = view.bodies[body];
        // The body sits on the line, between the Earth and the band.
        const cross =
            (at.x - from.x) * (to.y - from.y) -
            (at.y - from.y) * (to.x - from.x);
        expect(cross).toBeCloseTo(0, 2);
        expect(Math.hypot(at.x - from.x, at.y - from.y)).toBeLessThan(
            Math.hypot(to.x - from.x, to.y - from.y),
        );
        // And the band there is the chart's sign.
        const sign = chart.placements.find((p) => p.body === body)?.sign;
        expect(longitudeToSign(angle(from, to)).sign.name).toBe(sign);
    });

    it("starts each sign on the band where the Earth sees it start", () => {
        const earth = view.bodies.Tierra;
        view.signs.forEach((sign, i) => {
            expect(angle(earth, sign.inner)).toBeCloseTo(i * 30, 2);
            expect(angle(earth, sign.outer)).toBeCloseTo(i * 30, 2);
        });
    });
});
