import { Elysia } from "elysia";
import { paymentWebhookRoute } from "./routes/payment-webhook.route";

export const paymentRouter = new Elysia({ prefix: "/payments" }).use(
    paymentWebhookRoute,
);
