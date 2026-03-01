"use no memo";

import { FlexWidget, TextWidget } from "react-native-android-widget";

type HeatmapDay = {
  label: string;
  date: number;
  percentage: number;
};

type HeatmapAndroidWidgetProps = {
  days: HeatmapDay[];
  isDark: boolean;
};

const getHeatmapColor = (percentage: number, isDark: boolean) => {
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

export function HeatmapAndroidWidget({
  days,
  isDark,
}: HeatmapAndroidWidgetProps) {
  const widgetDays = days.slice(-7);

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: isDark ? "#000000" : "#FFFFFF",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexGap: 0,
        }}
      >
        {widgetDays.map((day) => (
          <FlexWidget
            key={`${day.label}-${day.date}`}
            style={{
              width: 24,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TextWidget
              text={day.label.toUpperCase()}
              style={{
                color: "#98A1AF",
                fontFamily: "Geist-Medium",
                fontSize: 10,
                textAlign: "center",
                marginBottom: 2,
              }}
            />
            <TextWidget
              text={String(day.date)}
              style={{
                color: isDark ? "#FFFFFF" : "#111827",
                fontFamily: "Geist-SemiBold",
                fontSize: 16,
                textAlign: "center",
                marginBottom: 3,
              }}
            />
            <FlexWidget
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                backgroundColor: getHeatmapColor(day.percentage, isDark),
              }}
            />
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
