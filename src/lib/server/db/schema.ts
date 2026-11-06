import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestampDefaults = {
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
};

// AUTHENTICATION TABLES
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	image: text("image"),
	...timestampDefaults,
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
	token: text("token").notNull().unique(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	...timestampDefaults,
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
	scope: text("scope"),
	password: text("password"),
	...timestampDefaults,
}, (table) => [
	uniqueIndex("account_central_identity_subject").on(table.accountId).where(sql`${table.providerId} = 'central-identity'`),
	uniqueIndex("account_central_identity_user").on(table.userId).where(sql`${table.providerId} = 'central-identity'`),
]);

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
	...timestampDefaults,
});

// BOOKS TABLE
export const books = sqliteTable("books", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	author: text("author").notNull(), // Book author
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	description: text("description"),
	fileKey: text("file_key").notNull(),
	currentBid: integer("current_bid").notNull().default(0),
	startingPrice: integer("starting_price").notNull().default(0),
	bidInterval: integer("bid_interval").notNull().default(100),
	endDate: integer("end_date", { mode: "timestamp_ms" }).notNull(),
	condition: text("condition").notNull(),
	yearPublished: integer("year_published").notNull(),
	pages: integer("pages").notNull(),

	...timestampDefaults,
});

export const bids = sqliteTable("bids", {
	id: text("id").primaryKey(),
	itemId: text("item_id")
		.notNull()
		.references(() => books.id, { onDelete: "cascade" }),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	amount: integer("amount").notNull(),
	...timestampDefaults,
});

export const payments = sqliteTable("payments", {
	id: text("id").primaryKey(),
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	itemId: text("item_id").notNull().references(() => books.id, { onDelete: "cascade" }),
	stripeSessionId: text("stripe_session_id").notNull(),
	paymentIntentId: text("payment_intent_id"),
	invoiceId: text("invoice_id"),
	amount: integer("amount").notNull(),
	currency: text("currency").notNull(),
	status: text("status").notNull(),
	receiptUrl: text("receipt_url"),
	hostedInvoiceUrl: text("hosted_invoice_url"),
	...timestampDefaults,
});

// RELATIONS
export const bidRelations = relations(bids, ({ one }) => ({
	item: one(books, {
		fields: [bids.itemId],
		references: [books.id],
	}),
	user: one(user, {
		fields: [bids.userId],
		references: [user.id],
	}),
}));

export const bookRelations = relations(books, ({ one, many }) => ({
	user: one(user, {
		fields: [books.userId],
		references: [user.id],
	}),
	bids: many(bids),
}));

export const userRelations = relations(user, ({ many }) => ({
	books: many(books),
	bids: many(bids),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
	user: one(user, {
		fields: [payments.userId],
		references: [user.id],
	}),
	item: one(books, {
		fields: [payments.itemId],
		references: [books.id],
	}),
}));
