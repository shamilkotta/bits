import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { DailyProgressAndroidWidget } from "@/widgets/android/DailyProgressAndroidWidget";
import { HeatmapAndroidWidget } from "@/widgets/android/HeatmapAndroidWidget";
import { getDailyProgressData, getHeatmapData } from "@/widgets/widget-data";

const renderWidgetByName = async (widgetName: string) => {
  switch (widgetName) {
    case "HeatmapWidget": {
      const heatmapData = await getHeatmapData();
      return {
        light: <HeatmapAndroidWidget days={heatmapData.days} isDark={false} />,
        dark: <HeatmapAndroidWidget days={heatmapData.days} isDark />,
      };
    }
    case "DailyProgressWidget": {
      const dailyProgressData = await getDailyProgressData();
      return {
        light: (
          <DailyProgressAndroidWidget
            percentage={dailyProgressData.percentage}
            day={dailyProgressData.day}
            weekday={dailyProgressData.weekday}
            isDark={false}
          />
        ),
        dark: (
          <DailyProgressAndroidWidget
            percentage={dailyProgressData.percentage}
            day={dailyProgressData.day}
            weekday={dailyProgressData.weekday}
            isDark
          />
        ),
      };
    }
    default:
      return null;
  }
};

export async function widgetTaskHandler({
  widgetInfo,
  widgetAction,
  renderWidget,
}: WidgetTaskHandlerProps) {
  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const representation = await renderWidgetByName(widgetInfo.widgetName);
      if (representation) {
        renderWidget(representation);
      }
      break;
    }
    case "WIDGET_CLICK":
    case "WIDGET_DELETED":
    default:
      break;
  }
}
