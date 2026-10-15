import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { CheckoutRequest } from "@/core/payment/domain/types";
import {
    mapMercadoPagoStatus,
    mercadoPagoGateway,
    toMercadoPagoPreference,
    verifyMercadoPagoSignature,
} from "../mercadopago";

const secret = "test-secret";

function sign(dataId: string, requestId: string, ts: string) {
    const v1 = createHmac("sha256", secret)
        .update(`id:${dataId};request-id:${requestId};ts:${ts};`)
        .digest("hex");
    return `ts=${ts},v1=${v1}`;
}

describe("verifyMercadoPagoSignature", () => {
    it("accepts a correctly signed delivery", () => {
        expect(
            verifyMercadoPagoSignature({
                secret,
                signature: sign("123", "req-1", "1700000000"),
                requestId: "req-1",
                dataId: "123",
            }),
        ).toBe(true);
    });

    it("rejects a tampered payment id", () => {
        expect(
            verifyMercadoPagoSignature({
                secret,
                signature: sign("123", "req-1", "1700000000"),
                requestId: "req-1",
                dataId: "999",
            }),
        ).toBe(false);
    });

    it("rejects a missing or malformed header", () => {
        const base = { secret, requestId: "r", dataId: "1" };
        expect(verifyMercadoPagoSignature({ ...base, signature: null })).toBe(
            false,
        );
        expect(
            verifyMercadoPagoSignature({ ...base, signature: "ts=1,v1=zz" }),
        ).toBe(false);
    });
});

describe("mapMercadoPagoStatus", () => {
    it.each([
        ["approved", "approved"],
        ["in_process", "pending"],
        ["rejected", "rejected"],
        ["cancelled", "rejected"],
        ["refunded", "refunded"],
        ["charged_back", "refunded"],
    ])("%s → %s", (input, expected) => {
        expect(mapMercadoPagoStatus(input)).toBe(expected);
    });
});

describe("mercadoPagoGateway.parseReturn", () => {
    it("reads the payment id Mercado Pago appends", () => {
        expect(mercadoPagoGateway.parseReturn({ payment_id: "42" })).toBe("42");
        expect(mercadoPagoGateway.parseReturn({ collection_id: "7" })).toBe(
            "7",
        );
        expect(mercadoPagoGateway.parseReturn({})).toBeNull();
    });

    it("finds none when the buyer came back without paying", () => {
        expect(
            mercadoPagoGateway.parseReturn({
                checkout: "mercadopago",
                collection_id: "null",
                collection_status: "null",
                payment_id: "null",
                status: "null",
            }),
        ).toBeNull();
    });
});

describe("toMercadoPagoPreference", () => {
    const request = (base: string): CheckoutRequest => ({
        orderId: "o1",
        productId: "reading_unlock",
        title: "Lectura",
        price: { amountCents: 1990, currency: "PEN" },
        successUrl: `${base}/lectura/r/r1?checkout=mercadopago`,
        failureUrl: `${base}/lectura/r/r1?checkout=mercadopago`,
        pendingUrl: `${base}/lectura/r/r1?checkout=mercadopago`,
    });

    it("sends the price in major units and our order id", () => {
        const body = toMercadoPagoPreference(request("https://astramia.ai"));
        expect(body.items[0]).toMatchObject({
            unit_price: 19.9,
            currency_id: "PEN",
        });
        expect(body.external_reference).toBe("o1");
    });

    it("auto-returns only to https (Mercado Pago rejects it otherwise)", () => {
        expect(
            toMercadoPagoPreference(request("https://astramia.ai")).auto_return,
        ).toBe("approved");
        expect(
            toMercadoPagoPreference(request("http://localhost:3000"))
                .auto_return,
        ).toBeUndefined();
    });
});
