import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// --- BetterAuth tables (generated via `npx @better-auth/cli generate`) ---

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  notebooks: many(notebooks),
  notes: many(notes),
  projects: many(projects),
  backlogs: many(backlogs),
  cycles: many(cycles),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// --- App tables ---

export const notebooks = sqliteTable(
  "notebooks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("notebooks_userId_idx").on(table.userId)],
);

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    notebookId: text("notebook_id")
      .notNull()
      .references(() => notebooks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    content: text("content", { mode: "json" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("notes_notebookId_idx").on(table.notebookId),
    index("notes_userId_idx").on(table.userId),
  ],
);

export const attachments = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    minioKey: text("minio_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("attachments_noteId_idx").on(table.noteId)],
);

export const BACKLOG_STATUSES = [
  "created",
  "in_progress",
  "implemented",
  "on_testing",
  "done",
] as const;

export const BACKLOG_LABELS = ["task", "issue"] as const;

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("projects_userId_idx").on(table.userId)],
);

export const backlogs = sqliteTable(
  "backlogs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    content: text("content", { mode: "json" }).notNull(),
    status: text("status", { enum: BACKLOG_STATUSES }).notNull().default("created"),
    label: text("label", { enum: BACKLOG_LABELS }).notNull().default("task"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("backlogs_projectId_idx").on(table.projectId),
    index("backlogs_userId_idx").on(table.userId),
  ],
);

export const CYCLE_STATUSES = ["planned", "active", "completed"] as const;

export const cycles = sqliteTable(
  "cycles",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    description: text("description").notNull().default(""),
    status: text("status", { enum: CYCLE_STATUSES }).notNull().default("planned"),
    plannedStartDate: integer("planned_start_date", { mode: "timestamp_ms" }),
    plannedEndDate: integer("planned_end_date", { mode: "timestamp_ms" }),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    endedAt: integer("ended_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("cycles_projectId_idx").on(table.projectId),
    index("cycles_userId_idx").on(table.userId),
  ],
);

export const cycleBacklogs = sqliteTable(
  "cycle_backlogs",
  {
    id: text("id").primaryKey(),
    cycleId: text("cycle_id")
      .notNull()
      .references(() => cycles.id, { onDelete: "cascade" }),
    backlogId: text("backlog_id")
      .notNull()
      .references(() => backlogs.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("cycle_backlogs_cycleId_idx").on(table.cycleId),
    index("cycle_backlogs_backlogId_idx").on(table.backlogId),
  ],
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(user, {
    fields: [projects.userId],
    references: [user.id],
  }),
  backlogs: many(backlogs),
  cycles: many(cycles),
}));

export const backlogsRelations = relations(backlogs, ({ one, many }) => ({
  project: one(projects, {
    fields: [backlogs.projectId],
    references: [projects.id],
  }),
  user: one(user, {
    fields: [backlogs.userId],
    references: [user.id],
  }),
  cycleItems: many(cycleBacklogs),
}));

export const cyclesRelations = relations(cycles, ({ one, many }) => ({
  project: one(projects, {
    fields: [cycles.projectId],
    references: [projects.id],
  }),
  user: one(user, {
    fields: [cycles.userId],
    references: [user.id],
  }),
  items: many(cycleBacklogs),
}));

export const cycleBacklogsRelations = relations(cycleBacklogs, ({ one }) => ({
  cycle: one(cycles, {
    fields: [cycleBacklogs.cycleId],
    references: [cycles.id],
  }),
  backlog: one(backlogs, {
    fields: [cycleBacklogs.backlogId],
    references: [backlogs.id],
  }),
}));

export const notebooksRelations = relations(notebooks, ({ one, many }) => ({
  user: one(user, {
    fields: [notebooks.userId],
    references: [user.id],
  }),
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  notebook: one(notebooks, {
    fields: [notes.notebookId],
    references: [notebooks.id],
  }),
  user: one(user, {
    fields: [notes.userId],
    references: [user.id],
  }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  note: one(notes, {
    fields: [attachments.noteId],
    references: [notes.id],
  }),
}));
