"use no memo";

import {
  FlexWidget,
  OverlapWidget,
  SvgWidget,
  TextWidget,
} from "react-native-android-widget";

type DailyProgressAndroidWidgetProps = {
  percentage: number;
  day: number;
  weekday: string;
  isDark: boolean;
  widgetWidthDp?: number;
  widgetHeightDp?: number;
};

const buildProgressRingSvg = (
  progress: number,
  isDark: boolean,
  circleSize: number,
  strokeWidth: number,
) => {
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const progressLength = circumference * clampedProgress;
  const remainingLength = circumference - progressLength;
  const trackColor = isDark ? "#1F2937" : "#C7C7C7";
  const progressColor = isDark ? "#FFFFFF" : "#000000";

  return `<svg width="${circleSize}" height="${circleSize}" viewBox="0 0 ${circleSize} ${circleSize}" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(-90 ${circleSize / 2} ${circleSize / 2})">
    <circle cx="${circleSize / 2}" cy="${circleSize / 2}" r="${radius}" fill="none" stroke="${trackColor}" stroke-width="${strokeWidth}" />
    <circle cx="${circleSize / 2}" cy="${circleSize / 2}" r="${radius}" fill="none" stroke="${progressColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-dasharray="${progressLength} ${remainingLength}" />
  </g>
</svg>`;
};

export function DailyProgressAndroidWidget({
  percentage,
  day,
  weekday,
  isDark,
  widgetWidthDp = 96,
  widgetHeightDp = 96,
}: DailyProgressAndroidWidgetProps) {
  const baseSize = Math.max(64, Math.min(widgetWidthDp, widgetHeightDp));
  const containerPadding = Math.max(3, Math.floor(baseSize * 0.06));
  const circleSize = Math.max(56, baseSize - containerPadding * 2 - 2);
  const strokeWidth = Math.max(7, Math.min(10, Math.floor(circleSize * 0.12)));
  const dayFontSize = Math.max(24, Math.floor(circleSize * 0.4));
  const weekdayFontSize = Math.max(11, Math.floor(circleSize * 0.16));
  const cardRadius = Math.max(10, Math.floor(baseSize * 0.12));
  const ringSvg = buildProgressRingSvg(
    percentage,
    isDark,
    circleSize,
    strokeWidth,
  );

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: isDark ? "#000000" : "#FFFFFF",
        borderRadius: cardRadius,
        padding: containerPadding,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <OverlapWidget
        style={{
          width: circleSize,
          height: circleSize,
        }}
      >
        <SvgWidget
          svg={ringSvg}
          style={{ width: circleSize, height: circleSize }}
        />

        <FlexWidget
          style={{
            width: "match_parent",
            height: "match_parent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TextWidget
            text={String(day)}
            style={{
              color: isDark ? "#FFFFFF" : "#000000",
              fontFamily: "Geist-Bold",
              fontSize: dayFontSize,
              textAlign: "center",
            }}
          />
          <TextWidget
            text={weekday.toUpperCase()}
            style={{
              color: "#6B7280",
              fontFamily: "Geist-SemiBold",
              fontSize: weekdayFontSize,
              textAlign: "center",
              marginTop: -1,
            }}
          />
        </FlexWidget>
      </OverlapWidget>
    </FlexWidget>
  );
}
