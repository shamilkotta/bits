import { db } from "@/db/client";
import { habitCompletions, habits } from "@/db/schema";
import { and, eq, gte } from "drizzle-orm";

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export async function getHeatmapData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(formatDate(d));
    }

    const allHabits = await db.select().from(habits);
    const totalHabits = allHabits.length;

    if (totalHabits === 0) {
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

    const countByDate: Record<string, number> = {};
    completions.forEach((row) => {
      countByDate[row.date] = (countByDate[row.date] || 0) + 1;
    });

    return {
      days: dates.map((d) => ({
        label: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][new Date(d).getDay()],
        date: new Date(d).getDate(),
        percentage: ((countByDate[d] || 0) / totalHabits) * 100,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch heatmap data:", error);
    return { days: [] };
  }
}

export async function getDailyProgressData() {
  try {
    const todayStr = formatDate(new Date());
    const today = new Date();
    const weekday = today
      .toLocaleString("default", { weekday: "short" })
      .toUpperCase();

    const allHabits = await db.select().from(habits);
    const totalHabits = allHabits.length;

    if (totalHabits === 0) {
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

    return {
      percentage: completions.length / totalHabits,
      day: today.getDate(),
      weekday,
    };
  } catch (error) {
    console.error("Failed to fetch daily progress data:", error);
    return { percentage: 0, day: 1, weekday: "SUN" };
  }
}
