import { timestamp } from "@laxdb/core/drizzle/drizzle.type";
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { Role } from "./auth.schema";

const ts = (col: string) =>
  timestamp(col)
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull();

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: ts("created_at"),
  updatedAt: ts("updated_at").$onUpdate(() => new Date()),
});

export const sessions = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at").$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_user_idx").on(table.userId)],
);

export const accounts = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("account_user_idx").on(table.userId)],
);

export const verifications = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organizations = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  createdAt: ts("created_at"),
});

export const members = sqliteTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<Role>().notNull().default("member"),
    createdAt: ts("created_at"),
  },
  (table) => [
    index("member_org_idx").on(table.organizationId),
    index("member_user_idx").on(table.userId),
  ],
);

export const invitations = sqliteTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at").notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_org_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
