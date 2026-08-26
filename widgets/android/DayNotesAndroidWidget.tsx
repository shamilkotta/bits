"use no memo";

import { FlexWidget, TextWidget } from "react-native-android-widget";
import { parseNoteLines, type NoteLine } from "@/widgets/parse-note-lines";

type DayNotesAndroidWidgetProps = {
  content?: string;
  day?: number;
  weekday?: string;
  isDark: boolean;
  widgetWidthDp?: number;
  widgetHeightDp?: number;
};

export function DayNotesAndroidWidget({
  content,
  day,
  weekday,
  isDark,
  widgetHeightDp = 180,
}: DayNotesAndroidWidgetProps) {
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const mutedColor = "#98A1AF";
  const cardRadius = 16;

  // Roughly how many body lines fit based on widget height (header + padding)
  const maxLines = Math.max(2, Math.floor((widgetHeightDp - 52) / 22));
  const lines = parseNoteLines(content ?? "").slice(0, maxLines);

  const renderLine = (line: NoteLine, key: number) => {
    switch (line.kind) {
      case "heading":
        return (
          <TextWidget
            key={key}
            text={line.text}
            style={{
              color: textColor,
              fontFamily: "Geist-Bold",
              fontSize: 17,
            }}
          />
        );
      case "task":
      case "taskDone":
        return (
          <FlexWidget
            key={key}
            clickAction="TOGGLE_TASK"
            clickActionData={{ lineIndex: line.lineIndex }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 1,
            }}
          >
            <TextWidget
              text={line.kind === "task" ? "○ " : "✓ "}
              style={{
                color: line.kind === "task" ? textColor : mutedColor,
                fontFamily: "Geist-Medium",
                fontSize: 14,
              }}
            />
            <TextWidget
              text={line.text}
              style={{
                color: line.kind === "task" ? textColor : mutedColor,
                fontFamily: "Geist-Medium",
                fontSize: 14,
              }}
            />
          </FlexWidget>
        );
      case "bullet":
        return (
          <TextWidget
            key={key}
            text={`• ${line.text}`}
            style={{
              color: textColor,
              fontFamily: "Geist-Medium",
              fontSize: 14,
            }}
          />
        );
      case "quote":
        return (
          <TextWidget
            key={key}
            text={`❝ ${line.text}`}
            style={{
              color: mutedColor,
              fontFamily: "Geist-Medium",
              fontSize: 14,
              marginLeft: 8,
            }}
          />
        );
      case "text":
      default:
        return (
          <TextWidget
            key={key}
            text={line.text}
            style={{
              color: textColor,
              fontFamily: "Geist-Medium",
              fontSize: 14,
            }}
          />
        );
    }
  };

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: "bits:///app-blocks" }}
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: isDark ? "#000000" : "#FFFFFF",
        borderRadius: cardRadius,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <TextWidget
          text={(weekday ?? "").toUpperCase()}
          style={{
            color: mutedColor,
            fontFamily: "Geist-SemiBold",
            fontSize: 11,
            marginRight: 5,
          }}
        />
        <TextWidget
          text={day != null ? String(day) : ""}
          style={{
            color: textColor,
            fontFamily: "Geist-Bold",
            fontSize: 13,
          }}
        />
      </FlexWidget>

      {lines.length === 0 ? (
        <TextWidget
          text="Nothing written today yet."
          style={{
            color: mutedColor,
            fontFamily: "Geist-Medium",
            fontSize: 14,
          }}
        />
      ) : (
        lines.map((line, i) => renderLine(line, i))
      )}
    </FlexWidget>
  );
}
