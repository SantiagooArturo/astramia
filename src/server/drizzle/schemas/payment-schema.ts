import {
    index,
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const orderStatus = pgEnum("order_status", [
    "pending",
    "paid",
    "failed",
    "refunded",
]);

/**
 * One purchase attempt. Gateway-neutral on purpose: `provider` +
 * `provider_ref`/`provider_payment_id` are the only gateway-specific bits, so
 * switching gateways never needs a migration.
 */
export const orders = pgTable(
    "orders",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        provider: text("provider").notNull(),
        productId: text("product_id").notNull(),
        /** The thing sold, e.g. the reading id for `reading_unlock`. */
        referenceId: text("reference_id").notNull(),
        amountCents: integer("amount_cents").notNull(),
        currency: text("currency").notNull(),
        status: orderStatus("status").default("pending").notNull(),
        providerRef: text("provider_ref"),
        providerPaymentId: text("provider_payment_id"),
        payerEmail: text("payer_email"),
        paidAt: timestamp("paid_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("orders_user_id_idx").on(table.userId),
        index("orders_reference_id_idx").on(table.referenceId),
    ],
);

/**
 * Append-only log of every payment state a gateway reported. The unique
 * `event_key` makes webhook retries and the browser return no-ops.
 */
export const paymentEvents = pgTable(
    "payment_events",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        eventKey: text("event_key").notNull(),
        provider: text("provider").notNull(),
        providerPaymentId: text("provider_payment_id").notNull(),
        orderId: text("order_id").references(() => orders.id, {
            onDelete: "set null",
        }),
        status: text("status").notNull(),
        amountCents: integer("amount_cents").notNull(),
        currency: text("currency").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [uniqueIndex("payment_events_event_key_idx").on(table.eventKey)],
);

export type OrderRow = typeof orders.$inferSelect;
export type NewOrderRow = typeof orders.$inferInsert;
export type NewPaymentEventRow = typeof paymentEvents.$inferInsert;
