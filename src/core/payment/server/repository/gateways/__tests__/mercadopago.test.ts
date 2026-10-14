import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
    mapMercadoPagoStatus,
    mercadoPagoGateway,
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
});
