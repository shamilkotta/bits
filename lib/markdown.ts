const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

function decodeEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m);
}

function convertTaskListItems(html: string): string {
  return html
    .replace(
      /<li([^>]*)>([\s\S]*?)<\/li>/gi,
      (_m, attrs: string, inner: string) => {
        const checked = /data-checked=["']true["']/i.test(attrs);
        const text = inner
          .replace(/<label[\s\S]*?<\/label>/gi, "")
          .trim();
        return `\n${checked ? "- [x] " : "- [ ] "}${text}`;
      },
    )
    .replace(/<ul[^>]*data-type=["']taskList["'][^>]*>([\s\S]*?)<\/ul>/gi, "$1\n");
}

export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  let md = html;

  // Task lists (TenTap structure) before generic list handling
  md = convertTaskListItems(md);

  md = md
    // Headings
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    // Blockquotes: prefix each inner line
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner: string) =>
      inner
        .split(/\n+/)
        .map((line) => `> ${line.trim()}`)
        .filter((line) => line.trim() !== ">")
        .join("\n"),
    )
    // Code blocks
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n")
    // Inline styles
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, "*$2*")
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, "_$2_")
    .replace(/<(del|s|strike)[^>]*>([\s\S]*?)<\/\1>/gi, "~$2~")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    // Links
    .replace(/<a[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi, "[$3]($2)")
    // Lists (non-task)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1")
    .replace(/<\/(ul|ol)>/gi, "\n");

  // Block-level closers become paragraph breaks
  md = md.replace(/<\/(p|div)>/gi, "\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");

  // Strip any remaining tags and decode entities
  md = md.replace(/<[^>]+>/g, "");
  md = decodeEntities(md);

  return md
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const CHECKBOX_LINE_RE = /^(\s*)- \[( |x|X)\]/;

export function toggleCheckboxLine(
  line: string,
): { line: string; checked: boolean } | null {
  const match = line.match(/^(\s*)- \[([ xX])\] ?([\s\S]*)$/);
  if (!match) return null;
  const [, indent, mark, rawText] = match;
  const checked = mark.toLowerCase() === "x";
  const text = rawText.trim();

  if (!checked) {
    if (text.length === 0) {
      return { line: `${indent}- [x]`, checked: true };
    }
    return { line: `${indent}- [x] ~${text}~`, checked: true };
  }

  // Uncheck: strip the strikethrough tildes
  const bare =
    text.startsWith("~") && text.endsWith("~") ? text.slice(1, -1) : text;
  return { line: `${indent}- [ ] ${bare}`, checked: false };
}

export function looksLikeHtml(value: string | null | undefined): boolean {
  return !!value && /<[a-z][^>]*>/i.test(value);
}
