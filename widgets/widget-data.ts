import { db } from "@/db/client";
import { dayNotes, habitCompletions, habits } from "@/db/schema";
import { formatYmd, habitAppliesOnDate } from "@/lib/date";
import { parseNoteLines } from "@/widgets/parse-note-lines";
import { and, eq, gte } from "drizzle-orm";

export async function getHeatmapData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(formatYmd(d));
    }

    const allHabits = await db.select().from(habits);

    if (allHabits.length === 0) {
      return {
        days: dates.map((d) => ({
          label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][
            new Date(d).getDay()
          ],
          date: new Date(d).getDate(),
          percentage: 0,
        })),
      };
    }

    // Fetch completions for the last 7 days
    const completions = await db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.completed, 1),
          gte(habitCompletions.date, dates[0]),
        ),
      );

    const habitById = new Map(allHabits.map((h) => [h.id, h]));
    const countByDate: Record<string, number> = {};
    completions.forEach((row) => {
      const h = habitById.get(row.habitId);
      if (!h || !habitAppliesOnDate(h, row.date)) return;
      countByDate[row.date] = (countByDate[row.date] || 0) + 1;
    });

    return {
      days: dates.map((d) => {
        const active = allHabits.filter((habit) =>
          habitAppliesOnDate(habit, d),
        ).length;
        const pct =
          active === 0 ? 0 : ((countByDate[d] || 0) / active) * 100;
        return {
          label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][
            new Date(d).getDay()
          ],
          date: new Date(d).getDate(),
          percentage: pct,
        };
      }),
    };
  } catch (error) {
    console.error("Failed to fetch heatmap data:", error);
    return { days: [] };
  }
}

export async function getDailyProgressData() {
  try {
    const todayStr = formatYmd(new Date());
    const today = new Date();
    const weekday = today
      .toLocaleString("default", { weekday: "short" })
      .toUpperCase();

    const allHabits = await db.select().from(habits);
    const activeHabits = allHabits.filter((h) =>
      habitAppliesOnDate(h, todayStr),
    );

    if (activeHabits.length === 0) {
      return {
        percentage: 0,
        day: today.getDate(),
        weekday,
      };
    }

    const completions = await db
      .select()
      .from(habitCompletions)
      .where(
        and(
          eq(habitCompletions.date, todayStr),
          eq(habitCompletions.completed, 1),
        ),
      );

    const activeIds = new Set(activeHabits.map((h) => h.id));
    const relevant = completions.filter((c) => activeIds.has(c.habitId));

    return {
      percentage: relevant.length / activeHabits.length,
      day: today.getDate(),
      weekday,
    };
  } catch (error) {
    console.error("Failed to fetch daily progress data:", error);
    return { percentage: 0, day: 1, weekday: "SUN" };
  }
}

export async function getTodayNoteData() {
  try {
    const todayStr = formatYmd(new Date());
    const today = new Date();
    const weekday = today
      .toLocaleString("default", { weekday: "short" })
      .toUpperCase();

    const rows = await db
      .select()
      .from(dayNotes)
      .where(eq(dayNotes.date, todayStr))
      .limit(1);

    const content = rows[0]?.content ?? "";
    return {
      content,
      lines: parseNoteLines(content).map((line) => ({
        kind: line.kind,
        text: line.text,
      })),
      date: todayStr,
      day: today.getDate(),
      weekday,
    };
  } catch (error) {
    console.error("Failed to fetch today's note:", error);
    return {
      content: "",
      lines: [],
      date: formatYmd(new Date()),
      day: new Date().getDate(),
      weekday: "",
    };
  }
}
