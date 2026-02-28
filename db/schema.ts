import { int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const habits = sqliteTable("habits", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  icon: text().notNull().default("water"),
  frequency: text().notNull().default("Daily"),
  customDays: text().default("[]"), // JSON array of day abbreviations e.g. ["Mon","Wed"]
  goal: int().notNull().default(1),
  times: text().default('["Morning"]'), // JSON array of time strings
  createdAt: text()
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const habitCompletions = sqliteTable(
  "habit_completions",
  {
    id: int().primaryKey({ autoIncrement: true }),
    habitId: int()
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    date: text().notNull(), // YYYY-MM-DD
    completed: int().notNull().default(0), // 0 = false, 1 = true
  },
  (table) => [uniqueIndex("habit_date_idx").on(table.habitId, table.date)],
);

export const userSettings = sqliteTable("user_settings", {
  id: int().primaryKey({ autoIncrement: true }),
  theme: text().notNull().default("system"), // light, dark, system
  hasSeenOnboarding: int().notNull().default(0), // 0 = false, 1 = true
});

// Type exports
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
