import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct DailyProgressWidget: Widget {
  let name: String = "DailyProgressWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Today's Progress")
    .description("Shows your habit completion progress for today")
    .supportedFamilies([.systemSmall])
  }
}