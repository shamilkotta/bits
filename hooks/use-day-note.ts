import { db } from "@/db/client";
import { dayNotes } from "@/db/schema";
import { htmlToMarkdown, looksLikeHtml } from "@/lib/markdown";
import { eq } from "drizzle-orm";
import { useCallback, useEffect, useMemo, useState } from "react";

type DayNoteState = {
  content: string;
};

type LoadedDayNoteState = DayNoteState & {
  date: string;
};

const emptyNote: DayNoteState = {
  content: "",
};

function legacyChecklistToMarkdown(value: string): string {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) return "";

    const items = parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const checked = item.checked === true ? "x" : " ";
        const text = typeof item.text === "string" ? item.text : "";
        return `- [${checked}] ${text}`;
      });

    return items.join("\n");
  } catch {
    return "";
  }
}

function getInitialContent(
  content: string | null | undefined,
  body: string,
  checklist: string,
): string {
  let stored = (content ?? "").trim();
  if (stored === "[]") stored = "";

  // Legacy TenTap notes were stored as HTML - convert once on read
  if (looksLikeHtml(stored)) stored = htmlToMarkdown(stored);

  if (stored && stored !== "<p></p>") return stored;

  const bodyMarkdown = body
    .split("\n")
    .filter((line) => line.length > 0)
    .join("\n");
  const checklistMarkdown = legacyChecklistToMarkdown(checklist);

  return [bodyMarkdown, checklistMarkdown].filter(Boolean).join("\n");
}

async function upsertDayNoteRow(date: string, content: string) {
  await db
    .insert(dayNotes)
    .values({
      date,
      body: "",
      checklist: "[]",
      content,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: dayNotes.date,
      set: {
        body: "",
        checklist: "[]",
        content,
        updatedAt: new Date().toISOString(),
      },
    });
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
        await upsertDayNoteRow(date, nextNote.content);
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

export { upsertDayNoteRow as upsertDayNote };
