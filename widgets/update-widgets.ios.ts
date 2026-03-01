import DailyProgressWidget from "./ios/DailyProgressWidget";
import HeatmapWidget from "./ios/HeatmapWidget";
import { getDailyProgressData, getHeatmapData } from "./widget-data";

export async function updateAllWidgets(isDark: boolean) {
  try {
    const [heatmapData, dailyProgressData] = await Promise.all([
      getHeatmapData(),
      getDailyProgressData(),
    ]);

    HeatmapWidget.updateSnapshot({
      ...heatmapData,
      isDark,
    });
    DailyProgressWidget.updateSnapshot({
      ...dailyProgressData,
      isDark,
    });
  } catch (error) {
    console.error("Failed to update iOS widgets:", error);
  }
}
