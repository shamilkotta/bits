import DailyProgressWidget from "./ios/DailyProgressWidget";
import DayNotesWidget from "./ios/DayNotesWidget";
import HeatmapWidget from "./ios/HeatmapWidget";
import { getDailyProgressData, getHeatmapData, getTodayNoteData } from "./widget-data";

export async function updateAllWidgets(isDark: boolean) {
  try {
    const [heatmapData, dailyProgressData, todayNoteData] = await Promise.all([
      getHeatmapData(),
      getDailyProgressData(),
      getTodayNoteData(),
    ]);

    HeatmapWidget.updateSnapshot({
      ...heatmapData,
      isDark,
    });
    DailyProgressWidget.updateSnapshot({
      ...dailyProgressData,
      isDark,
    });
    DayNotesWidget.updateSnapshot({
      ...todayNoteData,
      isDark,
    });
  } catch (error) {
    console.error("Failed to update iOS widgets:", error);
  }
}
