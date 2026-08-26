import type { ReactElement } from "react";
import { createElement } from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { DailyProgressAndroidWidget } from "./android/DailyProgressAndroidWidget";
import { DayNotesAndroidWidget } from "./android/DayNotesAndroidWidget";
import { HeatmapAndroidWidget } from "./android/HeatmapAndroidWidget";
import { getDailyProgressData, getHeatmapData, getTodayNoteData } from "./widget-data";

async function safeRequestWidgetUpdate(
  widgetName: string,
  renderWidget: (widgetInfo: { width: number; height: number }) => ReactElement,
) {
  try {
    await requestWidgetUpdate({ widgetName, renderWidget });
  } catch {
    // Widget not placed on home screen - ignore
  }
}

export async function updateAllWidgets(isDark: boolean) {
  try {
    const [heatmapData, dailyProgressData, todayNoteData] = await Promise.all([
      getHeatmapData(),
      getDailyProgressData(),
      getTodayNoteData(),
    ]);

    await Promise.all([
      safeRequestWidgetUpdate("HeatmapWidget", () =>
        createElement(HeatmapAndroidWidget, {
          days: heatmapData.days,
          isDark,
        }),
      ),
      safeRequestWidgetUpdate("DailyProgressWidget", (widgetInfo) =>
        createElement(DailyProgressAndroidWidget, {
          percentage: dailyProgressData.percentage,
          day: dailyProgressData.day,
          weekday: dailyProgressData.weekday,
          isDark,
          widgetWidthDp: widgetInfo.width,
          widgetHeightDp: widgetInfo.height,
        }),
      ),
      safeRequestWidgetUpdate("DayNotesWidget", (widgetInfo) =>
        createElement(DayNotesAndroidWidget, {
          content: todayNoteData.content,
          day: todayNoteData.day,
          weekday: todayNoteData.weekday,
          isDark,
          widgetWidthDp: widgetInfo.width,
          widgetHeightDp: widgetInfo.height,
        }),
      ),
    ]);
  } catch (error) {
    console.error("Failed to update Android widgets:", error);
  }
}
