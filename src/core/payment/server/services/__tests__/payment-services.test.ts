import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GatewayPayment } from "@/core/payment/domain/types";
import type { PaymentGateway } from "../../repository/gateways/payment-gateway";

/**
 * Services run against an in-memory gateway: if they work with this fake,
 * a real gateway is just another adapter behind the same interface.
 */
const fakeGateway = {
    provider: "mercadopago",
    createCheckout: vi.fn(),
    parseWebhook: vi.fn(),
    parseReturn: vi.fn(),
    fetchPayment: vi.fn(),
} satisfies PaymentGateway;

vi.mock("../../repository/gateways", () => ({
    getPaymentGateway: () => fakeGateway,
    getActivePaymentGateway: () => fakeGateway,
}));
vi.mock("../../repository/orders", () => ({
    createOrder: vi.fn(),
    findOrderById: vi.fn(),
    setOrderProviderRef: vi.fn(),
    transitionOrder: vi.fn(),
    recordPaymentEvent: vi.fn(),
}));
vi.mock("../fulfill-order", () => ({ fulfillOrder: vi.fn() }));

import {
    createOrder,
    findOrderById,
    recordPaymentEvent,
    setOrderProviderRef,
    transitionOrder,
} from "../../repository/orders";
import { createCheckoutService } from "../create-checkout-service";
import { fulfillOrder } from "../fulfill-order";
import { handleWebhookService } from "../handle-webhook-service";
import { syncCheckoutReturnService } from "../sync-checkout-return-service";
import { syncPaymentService } from "../sync-payment-service";

const order = {
    id: "o1",
    userId: "u1",
    provider: "mercadopago",
    productId: "reading_unlock",
    referenceId: "r1",
    amountCents: 599,
    currency: "USD",
    status: "pending" as const,
    providerRef: "pref-1",
    providerPaymentId: null,
    payerEmail: null,
    paidAt: null,
    createdAt: new Date("2026-10-14T00:00:00Z"),
    updatedAt: new Date("2026-10-14T00:00:00Z"),
};

const approved: GatewayPayment = {
    providerPaymentId: "pay-1",
    orderId: "o1",
    status: "approved",
    price: { amountCents: 599, currency: "USD" },
    payerEmail: "a@b.co",
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(recordPaymentEvent).mockResolvedValue(true);
});

describe("createCheckoutService", () => {
    it("creates the order at catalog price and returns the checkout url", async () => {
        vi.mocked(createOrder).mockResolvedValue(order);
        fakeGateway.createCheckout.mockResolvedValue({
            providerRef: "pref-1",
            checkoutUrl: "https://pay.example/checkout",
        });

        const r = await createCheckoutService({
            userId: "u1",
            productId: "reading_unlock",
            referenceId: "r1",
            returnPath: "/lectura/r/r1",
        });

        expect(r).toEqual({
            ok: true,
            data: { checkoutUrl: "https://pay.example/checkout" },
        });
        expect(createOrder).toHaveBeenCalledWith(
            expect.objectContaining({ amountCents: 599, currency: "USD" }),
        );
        const request = fakeGateway.createCheckout.mock.calls[0][0];
        expect(request.successUrl).toBe(
            "http://localhost:3000/lectura/r/r1?checkout=mercadopago",
        );
        // Not reachable from the gateway over plain http.
        expect(request.notificationUrl).toBeUndefined();
        expect(setOrderProviderRef).toHaveBeenCalledWith("o1", "pref-1");
    });
});

describe("syncPaymentService", () => {
    it("marks the order paid and fulfills it", async () => {
        fakeGateway.fetchPayment.mockResolvedValue(approved);
        vi.mocked(findOrderById).mockResolvedValue(order);
        vi.mocked(transitionOrder).mockResolvedValue({
            ...order,
            status: "paid",
            paidAt: new Date(),
        });

        const r = await syncPaymentService("mercadopago", "pay-1");

        expect(r.ok && r.data.order?.status).toBe("paid");
        expect(fulfillOrder).toHaveBeenCalledOnce();
    });

    it("refuses to fulfill when the amount paid differs", async () => {
        fakeGateway.fetchPayment.mockResolvedValue({
            ...approved,
            price: { amountCents: 1, currency: "USD" },
        });
        vi.mocked(findOrderById).mockResolvedValue(order);

        const r = await syncPaymentService("mercadopago", "pay-1");

        expect(!r.ok && r.error.code).toBe("CONFLICT");
        expect(transitionOrder).not.toHaveBeenCalled();
        expect(fulfillOrder).not.toHaveBeenCalled();
    });

    it("never downgrades a paid order on a late pending report", async () => {
        fakeGateway.fetchPayment.mockResolvedValue({
            ...approved,
            status: "pending",
        });
        vi.mocked(findOrderById).mockResolvedValue({
            ...order,
            status: "paid",
        });

        const r = await syncPaymentService("mercadopago", "pay-1");

        expect(r.ok && r.data.order?.status).toBe("paid");
        expect(transitionOrder).not.toHaveBeenCalled();
    });

    it("re-runs the idempotent fulfillment on a repeated approval", async () => {
        fakeGateway.fetchPayment.mockResolvedValue(approved);
        vi.mocked(findOrderById).mockResolvedValue({
            ...order,
            status: "paid",
        });

        await syncPaymentService("mercadopago", "pay-1");

        expect(transitionOrder).not.toHaveBeenCalled();
        expect(fulfillOrder).toHaveBeenCalledOnce();
    });

    it("ignores payments that match no order", async () => {
        fakeGateway.fetchPayment.mockResolvedValue({
            ...approved,
            orderId: null,
        });

        const r = await syncPaymentService("mercadopago", "pay-1");

        expect(r).toEqual({ ok: true, data: { order: null } });
        expect(fulfillOrder).not.toHaveBeenCalled();
    });
});

describe("handleWebhookService", () => {
    const delivery = { headers: new Headers(), query: {}, rawBody: "" };

    it("rejects unauthenticated deliveries", async () => {
        fakeGateway.parseWebhook.mockResolvedValue({ kind: "invalid" });
        const r = await handleWebhookService("mercadopago", delivery);
        expect(!r.ok && r.error.status).toBe(401);
    });

    it("acknowledges topics it doesn't handle", async () => {
        fakeGateway.parseWebhook.mockResolvedValue({ kind: "ignored" });
        const r = await handleWebhookService("mercadopago", delivery);
        expect(r).toEqual({ ok: true, data: { handled: false } });
        expect(fakeGateway.fetchPayment).not.toHaveBeenCalled();
    });

    it("syncs the payment a verified delivery points at", async () => {
        fakeGateway.parseWebhook.mockResolvedValue({
            kind: "payment",
            providerPaymentId: "pay-1",
        });
        fakeGateway.fetchPayment.mockResolvedValue(approved);
        vi.mocked(findOrderById).mockResolvedValue(order);
        vi.mocked(transitionOrder).mockResolvedValue({
            ...order,
            status: "paid",
        });

        const r = await handleWebhookService("mercadopago", delivery);

        expect(r).toEqual({ ok: true, data: { handled: true } });
        expect(fakeGateway.fetchPayment).toHaveBeenCalledWith("pay-1");
    });
});

describe("syncCheckoutReturnService", () => {
    it("does nothing without a checkout marker", async () => {
        const r = await syncCheckoutReturnService({ payment_id: "pay-1" });
        expect(r).toEqual({ ok: true, data: null });
    });

    it("syncs the payment from the return url", async () => {
        fakeGateway.parseReturn.mockReturnValue("pay-1");
        fakeGateway.fetchPayment.mockResolvedValue(approved);
        vi.mocked(findOrderById).mockResolvedValue(order);
        vi.mocked(transitionOrder).mockResolvedValue({
            ...order,
            status: "paid",
        });

        const r = await syncCheckoutReturnService({
            checkout: "mercadopago",
            payment_id: "pay-1",
        });

        expect(r.ok && r.data?.order?.status).toBe("paid");
    });
});
