import { db } from "@/db/client";
import { dayNotes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useCallback, useEffect, useMemo, useState } from "react";

type DayNoteState = {
  content: string;
};

type LoadedDayNoteState = DayNoteState & {
  date: string;
};

const emptyNote: DayNoteState = {
  content: "<p></p>",
};

function legacyChecklistToHtml(value: string): string {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) return "";

    const items = parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const checked = item.checked === true ? ' data-checked="true"' : "";
        const text = typeof item.text === "string" ? item.text : "";
        return `<li${checked}>${text}</li>`;
      })
      .join("");

    return items.length > 0 ? `<ul data-type="taskList">${items}</ul>` : "";
  } catch {
    return "";
  }
}

function getInitialContent(
  content: string | null | undefined,
  body: string,
  checklist: string,
): string {
  if (content && content !== "[]") return content;

  const bodyHtml = body
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => `<p>${line}</p>`)
    .join("");
  const checklistHtml = legacyChecklistToHtml(checklist);

  return bodyHtml || checklistHtml ? `${bodyHtml}${checklistHtml}` : emptyNote.content;
}

export function useDayNote(date: string) {
  const [note, setNote] = useState<LoadedDayNoteState>({
    ...emptyNote,
    date,
  });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await db
        .select()
        .from(dayNotes)
        .where(eq(dayNotes.date, date))
        .limit(1);

      const row = rows[0];
      setNote(
        row
          ? {
              content: getInitialContent(row.content, row.body, row.checklist),
              date,
            }
          : { ...emptyNote, date },
      );
    } catch (e) {
      console.error("Failed to fetch day note:", e);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const saveNote = useCallback(
    async (nextNote: DayNoteState) => {
      setNote({ ...nextNote, date });
      try {
        await db
          .insert(dayNotes)
          .values({
            date,
            body: "",
            checklist: "[]",
            content: nextNote.content,
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: dayNotes.date,
            set: {
              body: "",
              checklist: "[]",
              content: nextNote.content,
              updatedAt: new Date().toISOString(),
            },
          });
      } catch (e) {
        console.error("Failed to save day note:", e);
        throw e;
      }
    },
    [date],
  );

  return useMemo(
    () => ({ note, loading, saveNote, refetch }),
    [note, loading, saveNote, refetch],
  );
}
