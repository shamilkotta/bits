import "expo-router/entry";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "@/widgets/android/widget-task-handler";

registerWidgetTaskHandler(widgetTaskHandler);
