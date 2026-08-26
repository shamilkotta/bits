export type NoteLine = {
  kind: "heading" | "task" | "taskDone" | "bullet" | "quote" | "text";
  text: string;
  lineIndex: number;
};

export function parseNoteLines(content: string): NoteLine[] {
  const result: NoteLine[] = [];
  const rawLines = (content ?? "").split("\n");

  rawLines.forEach((raw, lineIndex) => {
    const line = raw.trim();
    if (line.length === 0) return;

    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      result.push({ kind: "heading", text: heading[1], lineIndex });
      return;
    }

    const task = line.match(/^- \[( |x|X)\]\s?(.*)$/);
    if (task) {
      const text = task[2].replace(/^~+/, "").replace(/~+$/, "");
      result.push({
        kind: task[1].toLowerCase() === "x" ? "taskDone" : "task",
        text,
        lineIndex,
      });
      return;
    }

    if (/^-\s+/.test(line)) {
      result.push({
        kind: "bullet",
        text: line.replace(/^-\s+/, ""),
        lineIndex,
      });
      return;
    }

    if (line.startsWith(">")) {
      result.push({
        kind: "quote",
        text: line.replace(/^>\s?/, ""),
        lineIndex,
      });
      return;
    }

    result.push({ kind: "text", text: line, lineIndex });
  });

  return result;
}
