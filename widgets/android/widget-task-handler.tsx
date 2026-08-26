import type { ReactElement } from "react";
import type { WidgetInfo, WidgetTaskHandlerProps } from "react-native-android-widget";
import { upsertDayNote } from "@/hooks/use-day-note";
import { toggleCheckboxLine } from "@/lib/markdown";
import { DailyProgressAndroidWidget } from "@/widgets/android/DailyProgressAndroidWidget";
import { DayNotesAndroidWidget } from "@/widgets/android/DayNotesAndroidWidget";
import { HeatmapAndroidWidget } from "@/widgets/android/HeatmapAndroidWidget";
import { getDailyProgressData, getHeatmapData, getTodayNoteData } from "@/widgets/widget-data";

const renderWidgetByName = async (widgetName: string, widgetInfo: WidgetInfo) => {
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
            widgetWidthDp={widgetInfo.width}
            widgetHeightDp={widgetInfo.height}
          />
        ),
        dark: (
          <DailyProgressAndroidWidget
            percentage={dailyProgressData.percentage}
            day={dailyProgressData.day}
            weekday={dailyProgressData.weekday}
            isDark
            widgetWidthDp={widgetInfo.width}
            widgetHeightDp={widgetInfo.height}
          />
        ),
      };
    }
    case "DayNotesWidget": {
      const todayNoteData = await getTodayNoteData();
      return {
        light: (
          <DayNotesAndroidWidget
            content={todayNoteData.content}
            day={todayNoteData.day}
            weekday={todayNoteData.weekday}
            isDark={false}
            widgetWidthDp={widgetInfo.width}
            widgetHeightDp={widgetInfo.height}
          />
        ),
        dark: (
          <DayNotesAndroidWidget
            content={todayNoteData.content}
            day={todayNoteData.day}
            weekday={todayNoteData.weekday}
            isDark
            widgetWidthDp={widgetInfo.width}
            widgetHeightDp={widgetInfo.height}
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
  clickAction,
  clickActionData,
  renderWidget,
}: WidgetTaskHandlerProps) {
  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const representation = await renderWidgetByName(
        widgetInfo.widgetName,
        widgetInfo,
      );
      if (representation) {
        renderWidget(representation);
      }
      break;
    }
    case "WIDGET_CLICK": {
      if (
        widgetInfo.widgetName === "DayNotesWidget" &&
        clickAction === "TOGGLE_TASK"
      ) {
        await toggleTaskFromWidget(widgetInfo, clickActionData, renderWidget);
        break;
      }
      break;
    }
    case "WIDGET_DELETED":
    default:
      break;
  }
}

async function toggleTaskFromWidget(
  widgetInfo: WidgetInfo,
  clickActionData: Record<string, unknown> | undefined,
  renderWidget: (representation: {
    light: ReactElement;
    dark: ReactElement;
  }) => void,
) {
  const lineIndex = clickActionData?.lineIndex;
  if (typeof lineIndex !== "number") return;

  const note = await getTodayNoteData();
  const lines = note.content.split("\n");
  const result = toggleCheckboxLine(lines[lineIndex] ?? "");
  if (!result) return;

  lines[lineIndex] = result.line;
  await upsertDayNote(note.date, lines.join("\n"));

  const representation = await renderWidgetByName(widgetInfo.widgetName, widgetInfo);
  if (representation) {
    renderWidget(representation);
  }
}
