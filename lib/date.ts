import type { Habit } from "@/db/schema";

export function formatYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function habitAppliesOnDate(
  habit: Pick<Habit, "startDate">,
  calendarDate: string,
): boolean {
  const start = habit.startDate;
  if (start == null || start === "") return true;
  return calendarDate >= start;
}
