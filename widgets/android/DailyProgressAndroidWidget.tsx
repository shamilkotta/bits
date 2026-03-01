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
};

const CIRCLE_SIZE = 180;
const STROKE_WIDTH = 16;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const buildProgressRingSvg = (progress: number, isDark: boolean) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const progressLength = CIRCUMFERENCE * clampedProgress;
  const remainingLength = CIRCUMFERENCE - progressLength;
  const trackColor = isDark ? "#A3A3A3" : "#C7C7C7";

  return `<svg width="${CIRCLE_SIZE}" height="${CIRCLE_SIZE}" viewBox="0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})">
    <circle cx="${CIRCLE_SIZE / 2}" cy="${CIRCLE_SIZE / 2}" r="${RADIUS}" fill="none" stroke="${trackColor}" stroke-width="${STROKE_WIDTH}" />
    <circle cx="${CIRCLE_SIZE / 2}" cy="${CIRCLE_SIZE / 2}" r="${RADIUS}" fill="none" stroke="#000000" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-dasharray="${progressLength} ${remainingLength}" />
  </g>
</svg>`;
};

export function DailyProgressAndroidWidget({
  percentage,
  day,
  weekday,
  isDark,
}: DailyProgressAndroidWidgetProps) {
  const ringSvg = buildProgressRingSvg(percentage, isDark);

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: isDark ? "#000000" : "#FFFFFF",
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <OverlapWidget
        style={{
          width: CIRCLE_SIZE,
          height: CIRCLE_SIZE,
        }}
      >
        <SvgWidget
          svg={ringSvg}
          style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
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
              fontSize: 52,
              textAlign: "center",
            }}
          />
          <TextWidget
            text={weekday.toUpperCase()}
            style={{
              color: "#6B7280",
              fontFamily: "Geist-SemiBold",
              fontSize: 20,
              textAlign: "center",
              marginTop: -4,
            }}
          />
        </FlexWidget>
      </OverlapWidget>
    </FlexWidget>
  );
}
