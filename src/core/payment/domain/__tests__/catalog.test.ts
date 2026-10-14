import { describe, expect, it } from "vitest";
import { formatPrice, priceParts } from "../catalog";

describe("formatPrice", () => {
    it("uses the local symbol for soles and dollars", () => {
        expect(formatPrice({ amountCents: 1990, currency: "PEN" })).toBe(
            "S/ 19.90",
        );
        expect(formatPrice({ amountCents: 599, currency: "USD" })).toBe(
            "US$5.99",
        );
    });

    it("falls back to the ISO code", () => {
        expect(formatPrice({ amountCents: 1000, currency: "EUR" })).toBe(
            "EUR 10.00",
        );
    });
});

describe("priceParts", () => {
    it("splits symbol, whole units and cents", () => {
        expect(priceParts({ amountCents: 1990, currency: "PEN" })).toEqual({
            symbol: "S/",
            whole: "19",
            cents: "90",
        });
        expect(priceParts({ amountCents: 605, currency: "USD" })).toEqual({
            symbol: "US$",
            whole: "6",
            cents: "05",
        });
    });
});
