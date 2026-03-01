import { Gauge, Text, VStack, ZStack } from "@expo/ui/swift-ui";
import {
  aspectRatio,
  background,
  containerRelativeFrame,
  controlSize,
  font,
  foregroundStyle,
  gaugeStyle,
  ignoreSafeArea,
  scaleEffect,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { WidgetBase, createWidget } from "expo-widgets";

type DailyProgressProps = {
  percentage: number; // 0 to 1
  day: number;
  weekday: string;
  isDark?: boolean;
};

const DailyProgressWidget = (props: WidgetBase<DailyProgressProps>) => {
  "widget";

  const progress = Math.max(0, Math.min(1, props.percentage ?? 0));
  const isDark = props.isDark ?? false;

  return (
    <ZStack
      alignment="center"
      modifiers={[
        containerRelativeFrame({ axes: "both", alignment: "center" }),
        ignoreSafeArea({ edges: "all" }),
        background(isDark ? "#000000" : "#FFFFFF"),
      ]}
    >
      <Gauge
        value={progress}
        min={0}
        max={1}
        modifiers={[
          containerRelativeFrame({ axes: "both", alignment: "center" }),
          aspectRatio({ ratio: 1, contentMode: "fit" }),
          controlSize("large"),
          scaleEffect(2.2),
          gaugeStyle("circularCapacity"),
          tint("label"),
        ]}
      />

      <VStack alignment="center" spacing={2}>
        <Text
          modifiers={[
            font({ family: "Geist-Bold", size: 44 }),
            foregroundStyle("label"),
          ]}
        >
          {String(props.day)}
        </Text>
        <Text
          modifiers={[
            font({ family: "Geist-SemiBold", size: 16 }),
            foregroundStyle("secondaryLabel"),
          ]}
        >
          {props.weekday}
        </Text>
      </VStack>
    </ZStack>
  );
};

export default createWidget("DailyProgressWidget", DailyProgressWidget);
