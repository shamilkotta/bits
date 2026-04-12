import { db } from "@/db/client";
import {
  habitCompletions,
  habits,
  type Habit,
  type NewHabit,
} from "@/db/schema";
import { habitAppliesOnDate } from "@/lib/date";
import { and, desc, eq, gte } from "drizzle-orm";
import { useCallback, useEffect, useState } from "react";

// Fetch stats for a single habit (streak and total logged)
export function useHabitStats(id: number) {
  const [stats, setStats] = useState({ streak: 0, totalLogged: 0 });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const habitRows = await db
        .select({ startDate: habits.startDate })
        .from(habits)
        .where(eq(habits.id, id))
        .limit(1);
      const startDate = habitRows[0]?.startDate;

      const completionWhere = startDate
        ? and(
            eq(habitCompletions.habitId, id),
            gte(habitCompletions.date, startDate),
          )
        : eq(habitCompletions.habitId, id);

      const result = await db
        .select()
        .from(habitCompletions)
        .where(completionWhere)
        .orderBy(desc(habitCompletions.date));

      const totalLogged = result.length;
      let streak = 0;

      if (totalLogged > 0) {
        const formatDate = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = formatDate(today);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDate(yesterday);

        const completionDates = result.map((c) => c.date);

        // A streak is valid if completed today OR completed yesterday
        // (If not completed today yet, the streak from yesterday is still alive)
        const hasCompletedToday = completionDates.includes(todayStr);
        const hasCompletedYesterday = completionDates.includes(yesterdayStr);

        if (hasCompletedToday || hasCompletedYesterday) {
          let checkDate = hasCompletedToday ? today : yesterday;
          streak = 0;

          while (true) {
            const checkDateStr = formatDate(checkDate);
            if (completionDates.includes(checkDateStr)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }

      setStats({ streak, totalLogged });
    } catch (e) {
      console.error("Failed to fetch habit stats:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...stats, loading, refetch };
}

// Fetch all habits
export function useHabits() {
  const [data, setData] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const result = await db.select().from(habits);
      setData(result);
    } catch (e) {
      console.error("Failed to fetch habits:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { habits: data, loading, refetch };
}

// Fetch a single habit
export function useHabit(id: number) {
  const [data, setData] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const result = await db
        .select()
        .from(habits)
        .where(eq(habits.id, id))
        .limit(1);
      setData(result[0] || null);
    } catch (e) {
      console.error("Failed to fetch habit:", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { habit: data, loading, refetch };
}

// Delete a habit
export function useDeleteHabit() {
  const deleteHabit = useCallback(async (id: number) => {
    try {
      await db.delete(habits).where(eq(habits.id, id));
      // Completions are deleted via cascade in schema
    } catch (e) {
      console.error("Failed to delete habit:", e);
      throw e;
    }
  }, []);

  return { deleteHabit };
}

// Update a habit
export function useUpdateHabit() {
  const updateHabit = useCallback(
    async (id: number, habit: Partial<Omit<NewHabit, "id" | "createdAt">>) => {
      try {
        await db.update(habits).set(habit).where(eq(habits.id, id));
      } catch (e) {
        console.error("Failed to update habit:", e);
        throw e;
      }
    },
    [],
  );

  return { updateHabit };
}

// Create a new habit
export function useCreateHabit() {
  const createHabit = useCallback(
    async (habit: Omit<NewHabit, "id" | "createdAt">) => {
      try {
        const result = await db.insert(habits).values({
          ...habit,
          createdAt: new Date().toISOString(),
        });
        return result;
      } catch (e) {
        console.error("Failed to create habit:", e);
        throw e;
      }
    },
    [],
  );

  return { createHabit };
}

// Fetch completions for a specific date, keyed by habitId
export function useHabitCompletions(date: string) {
  const [completions, setCompletions] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const result = await db
        .select()
        .from(habitCompletions)
        .where(eq(habitCompletions.date, date));

      const map: Record<number, boolean> = {};
      result.forEach((row) => {
        map[row.habitId] = row.completed === 1;
      });
      setCompletions(map);
    } catch (e) {
      console.error("Failed to fetch completions:", e);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { completions, loading, refetch };
}

// Toggle a habit completion for a given date
export function useToggleCompletion() {
  const toggle = useCallback(
    async (habitId: number, date: string, currentlyCompleted: boolean) => {
      try {
        if (currentlyCompleted) {
          // Remove completion
          await db
            .delete(habitCompletions)
            .where(
              and(
                eq(habitCompletions.habitId, habitId),
                eq(habitCompletions.date, date),
              ),
            );
        } else {
          // Insert or update completion
          await db
            .insert(habitCompletions)
            .values({ habitId, date, completed: 1 })
            .onConflictDoUpdate({
              target: [habitCompletions.habitId, habitCompletions.date],
              set: { completed: 1 },
            });
        }
      } catch (e) {
        console.error("Failed to toggle completion:", e);
        throw e;
      }
    },
    [],
  );

  return { toggle };
}

// Get completion counts for a range of dates (for heatmap)
export function useCompletionCounts(dates: string[], habitList: Habit[]) {
  const [percentages, setPercentages] = useState<Record<string, number>>({});

  const refetch = useCallback(async () => {
    if (dates.length === 0) return;

    try {
      const habitById = new Map(habitList.map((h) => [h.id, h]));

      const result = await db
        .select()
        .from(habitCompletions)
        .where(eq(habitCompletions.completed, 1));

      const countByDate: Record<string, number> = {};
      result.forEach((row) => {
        if (!dates.includes(row.date)) return;
        const h = habitById.get(row.habitId);
        if (!h || !habitAppliesOnDate(h, row.date)) return;
        countByDate[row.date] = (countByDate[row.date] || 0) + 1;
      });

      const pctMap: Record<string, number> = {};
      dates.forEach((d) => {
        const active = habitList.filter((habit) =>
          habitAppliesOnDate(habit, d),
        ).length;
        const count = countByDate[d] || 0;
        pctMap[d] = active === 0 ? 0 : (count / active) * 100;
      });
      setPercentages(pctMap);
    } catch (e) {
      console.error("Failed to fetch completion counts:", e);
    }
  }, [dates, habitList]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { percentages, refetch };
}
