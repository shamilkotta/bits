import { createElement } from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { DailyProgressAndroidWidget } from "./android/DailyProgressAndroidWidget";
import { HeatmapAndroidWidget } from "./android/HeatmapAndroidWidget";
import { getDailyProgressData, getHeatmapData } from "./widget-data";

export async function updateAllWidgets(isDark: boolean) {
  try {
    const [heatmapData, dailyProgressData] = await Promise.all([
      getHeatmapData(),
      getDailyProgressData(),
    ]);

    await Promise.all([
      requestWidgetUpdate({
        widgetName: "HeatmapWidget",
        renderWidget: () =>
          createElement(HeatmapAndroidWidget, {
            days: heatmapData.days,
            isDark,
          }),
      }),
      requestWidgetUpdate({
        widgetName: "DailyProgressWidget",
        renderWidget: () =>
          createElement(DailyProgressAndroidWidget, {
            percentage: dailyProgressData.percentage,
            day: dailyProgressData.day,
            weekday: dailyProgressData.weekday,
            isDark,
          }),
      }),
    ]);
  } catch (error) {
    console.error("Failed to update Android widgets:", error);
  }
}
