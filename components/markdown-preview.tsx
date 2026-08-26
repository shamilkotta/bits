import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useMemo } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { toggleCheckboxLine } from "@/lib/markdown";

type PreviewColors = {
  background: string;
  text: string;
  muted: string;
  border: string;
  toolbarActive: string;
};

type MarkdownPreviewProps = {
  value: string;
  colors: PreviewColors;
  bottomInset?: number;
  onToggleCheckbox?: (nextText: string) => void;
};

const INLINE_RE =
  /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`|\[[^\]\n]+\]\([^)\s\n]+\))/g;

type Span = { text: string; kind: "plain" | "bold" | "italic" | "strike" | "code" | "link"; url?: string };

function parseInlineSpans(line: string): Span[] {
  const spans: Span[] = [];
  let last = 0;
  for (const match of line.matchAll(INLINE_RE)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > last) spans.push({ text: line.slice(last, start), kind: "plain" });
    if (token.startsWith("*")) spans.push({ text: token.slice(1, -1), kind: "bold" });
    else if (token.startsWith("_")) spans.push({ text: token.slice(1, -1), kind: "italic" });
    else if (token.startsWith("~")) spans.push({ text: token.slice(1, -1), kind: "strike" });
    else if (token.startsWith("`")) spans.push({ text: token.slice(1, -1), kind: "code" });
    else {
      const sep = token.indexOf("](");
      spans.push({
        text: token.slice(1, sep),
        kind: "link",
        url: token.slice(sep + 2, -1),
      });
    }
    last = start + token.length;
  }
  if (last < line.length) spans.push({ text: line.slice(last), kind: "plain" });
  return spans;
}

type Block =
  | { type: "paragraph"; lines: string[] }
  | { type: "heading"; level: number; text: string }
  | { type: "quote"; lines: string[] }
  | { type: "bullet"; text: string }
  | { type: "task"; checked: boolean; text: string; lineIndex: number };

function parseBlocks(value: string): Block[] {
  const blocks: Block[] = [];
  const lines = value.split("\n");
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", lines: paragraph });
      paragraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const taskMatch = trimmed.match(/^- \[( |x|X)\] ?([\s\S]*)$/);
    if (taskMatch) {
      flushParagraph();
      blocks.push({
        type: "task",
        checked: taskMatch[1].toLowerCase() === "x",
        text: taskMatch[2],
        lineIndex: i,
      });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3}) (.+)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2] });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const lastBlock = blocks[blocks.length - 1];
      const quoteLine = trimmed.replace(/^>\s?/, "");
      if (lastBlock?.type === "quote") lastBlock.lines.push(quoteLine);
      else blocks.push({ type: "quote", lines: [quoteLine] });
      continue;
    }

    const bulletMatch = trimmed.match(/^- (.+)$/);
    if (bulletMatch) {
      flushParagraph();
      blocks.push({ type: "bullet", text: bulletMatch[1] });
      continue;
    }

    if (trimmed.length === 0) {
      flushParagraph();
      continue;
    }

    paragraph.push(trimmed);
  }
  flushParagraph();
  return blocks;
}

function MarkdownPreviewImpl({
  value,
  colors,
  bottomInset = 0,
  onToggleCheckbox,
}: MarkdownPreviewProps) {
  const blocks = useMemo(() => parseBlocks(value), [value]);

  const openLink = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  const toggleTask = useCallback(
    (lineIndex: number) => {
      if (!onToggleCheckbox) return;
      const lines = value.split("\n");
      const result = toggleCheckboxLine(lines[lineIndex]);
      if (!result) return;
      lines[lineIndex] = result.line;
      onToggleCheckbox(lines.join("\n"));
    },
    [onToggleCheckbox, value],
  );

  if (value.trim().length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.paragraph, { color: colors.muted }]}>
          Nothing written yet.
        </Text>
      </View>
    );
  }

  const baseStyle = { color: colors.text };

  const renderSpans = (text: string) => (
    <Text style={[styles.paragraph, baseStyle]}>
      {parseInlineSpans(text).map((span, i) => {
        switch (span.kind) {
          case "bold":
            return <Text key={i} style={styles.bold}>{span.text}</Text>;
          case "italic":
            return <Text key={i} style={styles.italic}>{span.text}</Text>;
          case "strike":
            return <Text key={i} style={styles.strike}>{span.text}</Text>;
          case "code":
            return <Text key={i} style={[styles.code, { color: colors.text, backgroundColor: colors.toolbarActive }]}>{span.text}</Text>;
          case "link":
            return (
              <Text
                key={i}
                style={[styles.link, { color: colors.toolbarActive === "#1F2937" ? "#60A5FA" : "#2563EB" }]}
                onPress={() => span.url && openLink(span.url)}
              >
                {span.text}
              </Text>
            );
          default:
            return <Text key={i}>{span.text}</Text>;
        }
      })}
    </Text>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, bottomInset > 0 && { paddingBottom: bottomInset + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading": {
            const headingStyles = [styles.h1, styles.h2, styles.h3];
            return (
              <View key={index} style={index > 0 ? styles.blockGap : undefined}>
                <Text style={[headingStyles[block.level - 1], baseStyle]}>{block.text}</Text>
              </View>
            );
          }
          case "quote":
            return (
              <View
                key={index}
                style={[styles.quote, styles.blockGap, { borderLeftColor: colors.border }]}
              >
                {block.lines.map((l, i) => (
                  <Text key={i} style={[styles.paragraph, styles.quoteText, { color: colors.muted }]}>
                    {parseInlineSpans(l).map((s, j) => <Text key={j}>{s.text}</Text>)}
                  </Text>
                ))}
              </View>
            );
          case "bullet":
            return (
              <View key={index} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: colors.muted }]}>•</Text>
                {renderSpans(block.text)}
              </View>
            );
          case "task": {
            const checkColor = block.checked
              ? colors.text
              : colors.border;
            return (
              <TouchableOpacity
                key={index}
                style={styles.taskRow}
                activeOpacity={0.6}
                disabled={!onToggleCheckbox}
                onPress={() => toggleTask(block.lineIndex)}
              >
                <View style={[styles.checkbox, { borderColor: checkColor }]}>
                  {block.checked && (
                    <Ionicons name="checkmark" size={14} color={colors.text} />
                  )}
                </View>
                {block.checked ? (
                  <Text style={[styles.paragraph, styles.strike, { color: colors.muted }]}>
                    {parseInlineSpans(block.text.replace(/^~|~$/g, "")).map((s, j) => <Text key={j}>{s.text}</Text>)}
                  </Text>
                ) : (
                  renderSpans(block.text)
                )}
              </TouchableOpacity>
            );
          }
          case "paragraph":
          default:
            return (
              <View key={index} style={index > 0 ? styles.blockGap : undefined}>
                {block.lines.map((l, i) => (
                  <View key={i}>{renderSpans(l)}</View>
                ))}
              </View>
            );
        }
      })}
    </ScrollView>
  );
}

export const MarkdownPreview = memo(MarkdownPreviewImpl);

const FONT_MONO = Platform.select({
  ios: "Courier",
  default: "monospace",
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  empty: {
    flex: 1,
    paddingTop: 40,
    alignItems: "center",
  },
  blockGap: {
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Geist-Medium",
  },
  h1: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: "Geist-Bold",
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: "Geist-Bold",
  },
  h3: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: "Geist-SemiBold",
  },
  bold: {
    fontFamily: "Geist-Bold",
  },
  italic: {
    fontStyle: "italic",
  },
  strike: {
    textDecorationLine: "line-through",
  },
  code: {
    fontFamily: FONT_MONO,
    fontSize: 14,
  },
  link: {
    textDecorationLine: "underline",
  },
  quote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  quoteText: {
    fontStyle: "italic",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 24,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
