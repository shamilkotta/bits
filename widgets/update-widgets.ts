import { Platform } from "react-native";
import DailyProgressWidget from "./DailyProgressWidget";
import HeatmapWidget from "./HeatmapWidget";
import { getDailyProgressData, getHeatmapData } from "./widget-data";

export async function updateAllWidgets(isDark: boolean) {
  if (Platform.OS !== "ios") return;

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
    console.error("Failed to update widgets:", error);
  }
}
