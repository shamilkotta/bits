import { HStack, Text, VStack } from "@expo/ui/swift-ui";
import {
  background,
  containerRelativeFrame,
  font,
  foregroundStyle,
  frame,
  ignoreSafeArea,
  lineLimit,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { WidgetBase, createWidget } from "expo-widgets";

type DayNotesProps = {
  lines?: { kind: string; text: string }[];
  day?: number;
  weekday?: string;
  isDark?: boolean;
};

const DayNotesWidget = (props: WidgetBase<DayNotesProps>) => {
  "widget";

  const isDark = props.isDark ?? false;
  const muted = "#98A1AF";
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const maxLines = props.family === "systemLarge" ? 11 : 5;
  const lines = (props.lines ?? []).slice(0, maxLines);

  return (
    <VStack
      alignment="leading"
      spacing={0}
      modifiers={[
        containerRelativeFrame({ axes: "both", alignment: "topLeading" }),
        ignoreSafeArea({ edges: "all" }),
        background(isDark ? "#000000" : "#FFFFFF"),
      ]}
    >
      <VStack
        alignment="leading"
        spacing={6}
        modifiers={[
          padding({ horizontal: 16, vertical: 12 }),
          frame({ maxWidth: 400, alignment: "topLeading" }),
        ]}
      >
        <HStack spacing={5} alignment="center">
          <Text
            modifiers={[
              font({ weight: "semibold", size: 11 }),
              foregroundStyle(muted),
            ]}
          >
            {(props.weekday ?? "").toUpperCase()}
          </Text>
          <Text
            modifiers={[
              font({ weight: "bold", size: 13 }),
              foregroundStyle(textColor),
            ]}
          >
            {String(props.day ?? "")}
          </Text>
        </HStack>

        <VStack alignment="leading" spacing={4}>
          {lines.length === 0 ? (
            <Text
              modifiers={[
                font({ weight: "medium", size: 14 }),
                foregroundStyle(muted),
              ]}
            >
              Nothing written today yet.
            </Text>
          ) : (
            lines.map((line, i) => {
              let prefix = "";
              if (line.kind === "task") prefix = "○ ";
              else if (line.kind === "taskDone") prefix = "✓ ";
              else if (line.kind === "bullet") prefix = "• ";
              else if (line.kind === "quote") prefix = "❝ ";

              const mutedLine = line.kind === "taskDone" || line.kind === "quote";
              const heading = line.kind === "heading";

              return (
                <Text
                  key={i}
                  modifiers={[
                    font({
                      weight: heading ? "bold" : "medium",
                      size: heading ? 17 : 14,
                    }),
                    foregroundStyle(mutedLine ? muted : textColor),
                    padding({ leading: line.kind === "quote" ? 8 : 0 }),
                    lineLimit(2),
                  ]}
                >
                  {prefix + line.text}
                </Text>
              );
            })
          )}
        </VStack>
      </VStack>
    </VStack>
  );
};

export default createWidget("DayNotesWidget", DayNotesWidget);
