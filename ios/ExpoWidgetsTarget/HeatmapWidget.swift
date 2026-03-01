import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct HeatmapWidget: Widget {
  let name: String = "HeatmapWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Weekly Heatmap")
    .description("Shows your habit completion heatmap for the last 7 days")
    .supportedFamilies([.systemMedium])
  }
}