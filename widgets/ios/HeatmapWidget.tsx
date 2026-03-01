import { HStack, Text, VStack } from "@expo/ui/swift-ui";
import {
  background,
  containerRelativeFrame,
  font,
  foregroundStyle,
  frame,
  ignoreSafeArea,
  padding,
  shapes,
} from "@expo/ui/swift-ui/modifiers";
import { WidgetBase, createWidget } from "expo-widgets";

type HeatmapProps = {
  days: { label: string; date?: number; percentage: number }[];
  isDark?: boolean;
};

const HeatmapWidget = (props: WidgetBase<HeatmapProps>) => {
  "widget";

  const days = props.days ?? [];
  const isDark = props.isDark ?? false;
  const resolvedDays = days.map((day, index) => {
    if (day.date !== undefined) return day;

    const fallbackDate = new Date();
    fallbackDate.setHours(0, 0, 0, 0);
    const offset = days.length - 1 - index;
    fallbackDate.setDate(fallbackDate.getDate() - offset);

    return { ...day, date: fallbackDate.getDate() };
  });

  const getHeatmapColor = (percentage: number) => {
    if (isDark) {
      if (percentage === 0) return "#1F2937";
      if (percentage <= 25) return "#374151";
      if (percentage <= 50) return "#4B5563";
      if (percentage <= 75) return "#9CA3AF";
      return "#FFFFFF";
    }

    if (percentage === 0) return "#E5E7EB";
    if (percentage <= 25) return "#D1D5DB";
    if (percentage <= 50) return "#9CA3AF";
    if (percentage <= 75) return "#4B5563";
    return "#111827";
  };

  return (
    <VStack
      alignment="center"
      spacing={0}
      modifiers={[
        containerRelativeFrame({
          axes: "both",
          alignment: "center",
        }),
        ignoreSafeArea({ edges: "all" }),
        background(isDark ? "#000000" : "#FFFFFF"),
      ]}
    >
      <HStack
        spacing={10}
        alignment="bottom"
        modifiers={[padding({ horizontal: 22, vertical: 8 })]}
      >
        {resolvedDays.map((day) => (
          <VStack
            key={`${day.label}-${day.date}`}
            spacing={8}
            alignment="center"
          >
            <Text
              modifiers={[
                font({ family: "Geist-Medium", size: 12 }),
                frame({ width: 38 }),
                foregroundStyle("#98A1AF"),
              ]}
            >
              {day.label.toUpperCase()}
            </Text>
            <Text
              modifiers={[
                font({ family: "Geist-SemiBold", size: 22 }),
                frame({ width: 38 }),
                foregroundStyle("label"),
              ]}
            >
              {String(day.date)}
            </Text>
            <Text
              modifiers={[
                frame({ width: 38, height: 38 }),
                background(
                  getHeatmapColor(day.percentage),
                  shapes.roundedRectangle({ cornerRadius: 7 }),
                ),
              ]}
            >
              {" "}
            </Text>
          </VStack>
        ))}
      </HStack>
    </VStack>
  );
};

export default createWidget("HeatmapWidget", HeatmapWidget);
