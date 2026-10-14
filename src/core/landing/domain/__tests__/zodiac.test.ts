import { describe, expect, it } from "vitest";
import {
    daysInMonth,
    formatDegree,
    getSignById,
    getSunSign,
    isValidMonthDay,
    longitudeToSign,
    ZODIAC_SIGNS,
} from "../zodiac";

describe("getSunSign", () => {
    it("returns the sign for a date inside its range", () => {
        expect(getSunSign(11, 5)?.id).toBe("escorpio");
        expect(getSunSign(8, 1)?.id).toBe("leo");
    });

    it("handles cusp boundaries", () => {
        expect(getSunSign(3, 20)?.id).toBe("piscis");
        expect(getSunSign(3, 21)?.id).toBe("aries");
        expect(getSunSign(10, 22)?.id).toBe("libra");
        expect(getSunSign(10, 23)?.id).toBe("escorpio");
    });

    it("wraps Capricorn across the new year", () => {
        expect(getSunSign(12, 31)?.id).toBe("capricornio");
        expect(getSunSign(1, 1)?.id).toBe("capricornio");
        expect(getSunSign(1, 19)?.id).toBe("capricornio");
        expect(getSunSign(1, 20)?.id).toBe("acuario");
    });

    it("rejects impossible dates", () => {
        expect(getSunSign(2, 30)).toBeUndefined();
        expect(getSunSign(13, 1)).toBeUndefined();
        expect(getSunSign(4, 31)).toBeUndefined();
        expect(getSunSign(0, 10)).toBeUndefined();
    });

    it("covers every day of the year with exactly one sign", () => {
        for (let month = 1; month <= 12; month++) {
            for (let day = 1; day <= daysInMonth(month); day++) {
                expect(getSunSign(month, day)).toBeDefined();
            }
        }
    });
});

describe("isValidMonthDay", () => {
    it("allows February 29 because the year is unknown", () => {
        expect(isValidMonthDay(2, 29)).toBe(true);
        expect(isValidMonthDay(2, 30)).toBe(false);
    });
});

describe("longitudeToSign", () => {
    it("splits a longitude into sign, degree and minute", () => {
        const position = longitudeToSign(224.54);
        expect(position.sign.id).toBe("escorpio");
        expect(position.degree).toBe(14);
        expect(position.minute).toBe(32);
        expect(formatDegree(position)).toBe("14°32′");
    });

    it("normalizes negative and overflowing longitudes", () => {
        expect(longitudeToSign(-10).sign.id).toBe("piscis");
        expect(longitudeToSign(370).sign.id).toBe("aries");
    });
});

describe("ZODIAC_SIGNS", () => {
    it("is the twelve signs in wheel order", () => {
        expect(ZODIAC_SIGNS).toHaveLength(12);
        expect(ZODIAC_SIGNS[0].id).toBe("aries");
        expect(ZODIAC_SIGNS[11].id).toBe("piscis");
    });

    it("resolves a sign by slug", () => {
        expect(getSignById("libra")?.name).toBe("Libra");
        expect(getSignById("ofiuco")).toBeUndefined();
    });
});
