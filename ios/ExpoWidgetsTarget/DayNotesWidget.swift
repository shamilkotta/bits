import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct DayNotesWidget: Widget {
  let name: String = "DayNotesWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
        .widgetURL(URL(string: "bits:///app-blocks"))
    }
    .configurationDisplayName("Today's Note")
    .description("Shows your note for today with formatted tasks and lists")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}
