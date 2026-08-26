import {
  MarkdownTextInput,
  parseExpensiMark,
} from "@expensify/react-native-live-markdown";
import type { MarkdownRange } from "@expensify/react-native-live-markdown";
import { memo } from "react";
import { Platform, StyleSheet } from "react-native";

type EditorColors = {
  background: string;
  text: string;
  muted: string;
  border: string;
  toolbarActive: string;
};

type DayMarkdownEditorProps = {
  value: string;
  onChangeText: (text: string) => void;
  colors: EditorColors;
  placeholder?: string;
  bottomInset?: number;
};

const FONT_MONO = Platform.select({
  ios: "Courier",
  default: "monospace",
});

const getMarkdownStyle = (colors: EditorColors) => ({
  syntax: { color: colors.muted },
  link: { color: colors.text },
  code: { fontFamily: FONT_MONO, color: colors.text },
  quote: {
    borderColor: colors.border,
    borderWidth: 2,
    marginLeft: 8,
    paddingLeft: 8,
  },
  h1: { fontSize: 24 },
});

// Wraps ExpensiMark so checkbox markers are dimmed like other syntax.
const checkboxParser = (input: string): MarkdownRange[] => {
  'worklet';
  const ranges = parseExpensiMark(input);
  const re = /^[^\S\n]*- \[( |x|X)\]/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(input)) !== null) {
    ranges.push({
      start: match.index + match[0].indexOf('['),
      length: 3,
      type: 'syntax',
    });
  }
  return ranges;
};

function DayMarkdownEditorImpl({
  value,
  onChangeText,
  colors,
  placeholder = "write anything...",
  bottomInset = 0,
}: DayMarkdownEditorProps) {
  return (
    <MarkdownTextInput
      value={value}
      onChangeText={onChangeText}
      parser={checkboxParser}
      markdownStyle={getMarkdownStyle(colors)}
      multiline
      textAlignVertical="top"
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      selectionColor={colors.toolbarActive}
      style={[
        styles.input,
        { color: colors.text },
        bottomInset > 0 && { paddingBottom: bottomInset + 40 },
      ]}
    />
  );
}

export const DayMarkdownEditor = memo(DayMarkdownEditorImpl);

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Geist-Medium",
    padding: 0,
    textAlignVertical: "top",
  },
});
