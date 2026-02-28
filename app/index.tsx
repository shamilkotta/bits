import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 7 full days + 1/4 day on each side = 7.5 units of item width
const ITEM_WIDTH = SCREEN_WIDTH / 7.5;
const HORIZONTAL_PADDING = (SCREEN_WIDTH - 7 * ITEM_WIDTH) / 2;

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to get a range of dates
const getDatesRange = (daysCount: number, offset: number = 0) => {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = -offset; i < daysCount - offset; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
};

const INITIAL_HABITS = [
  "Do flow work",
  "Eat a healthy meal",
  "Morning workout",
  "Avoid screen time",
  "Meditate",
  "Drink Water",
  "Read Book new long task goes here",
];

// Generate some dummy history for the heatmap
const generateDummyHistory = (habits: string[]) => {
  const history: Record<string, Record<string, boolean>> = {};
  const todayStr = formatDate(new Date());

  // Use a fixed range for dummy data
  const range = [];
  const start = new Date();
  start.setDate(start.getDate() - 100);
  for (let i = 0; i < 150; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    range.push(formatDate(d));
  }

  range.forEach((date) => {
    history[date] = {};
    if (date < todayStr) {
      habits.forEach((habit) => {
        history[date][habit] = Math.random() > 0.4;
      });
    } else if (date === todayStr) {
      habits.forEach((habit) => {
        history[date][habit] = false;
      });
    }
  });
  return history;
};

const DAYS_COUNT = 184; // 180 past days + 1 today + 4 future days
const OFFSET_DAYS = 180;

export default function HomeScreen() {
  const { theme, setTheme, colorScheme } = useTheme();
  const today = useMemo(() => formatDate(new Date()), []);
  const flatListRef = useRef<FlatList>(null);
  const [history, setHistory] = useState(() =>
    generateDummyHistory(INITIAL_HABITS),
  );
  const [selectedDate, setSelectedDate] = useState(today);

  // Cycle through theme modes: system -> light -> dark -> system
  const cycleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  const getThemeIcon = () => {
    if (theme === "system") return "contrast-outline";
    if (theme === "light") return "sunny-outline";
    return "moon-outline";
  };

  // Toggle habit completion for selected date
  const toggleHabit = (habitName: string) => {
    if (selectedDate > today) return;

    setHistory((prev) => {
      const currentDayData = prev[selectedDate] || {};
      return {
        ...prev,
        [selectedDate]: {
          ...currentDayData,
          [habitName]: !currentDayData[habitName],
        },
      };
    });
  };

  // Calculate completion percentage for any given date
  const getCompletionPercentage = (date: string) => {
    const dayData = history[date];
    if (!dayData) return 0;
    const completedCount = Object.values(dayData).filter(Boolean).length;
    return (completedCount / INITIAL_HABITS.length) * 100;
  };

  // Map percentage to heatmap color
  const getHeatmapColor = (percentage: number) => {
    if (colorScheme === "dark") {
      if (percentage === 0) return "#1F2937";
      if (percentage <= 25) return "#374151";
      if (percentage <= 50) return "#4B5563";
      if (percentage <= 75) return "#9CA3AF";
      return "#FFFFFF";
    }
    if (percentage === 0) return "#E5E7EB";
    if (percentage <= 25) return "#D1D5DB";
    if (percentage <= 50) return "#9CA3AF";
    if (percentage <= 75) return "#4B5563";
    return "#111827";
  };

  // Generate range for the scrollable calendar (days)
  const calendarDates = useMemo(
    () => getDatesRange(DAYS_COUNT, OFFSET_DAYS),
    [],
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>Habits</ThemedText>
            <TouchableOpacity
              onPress={cycleTheme}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.themeButton}
            >
              <Ionicons
                name={getThemeIcon()}
                size={24}
                color={Colors[colorScheme].text}
              />
            </TouchableOpacity>
          </View>

          {/* Day-by-Day Pager (Dates and Heatmap dots combined) */}
          <View style={styles.pagerContainer}>
            <FlatList
              ref={flatListRef}
              data={calendarDates}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              initialScrollIndex={OFFSET_DAYS}
              snapToInterval={ITEM_WIDTH}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
              getItemLayout={(data, index) => ({
                length: ITEM_WIDTH,
                offset: ITEM_WIDTH * index,
                index,
              })}
              renderItem={({ item: dateStr }) => {
                const dateObj = new Date(dateStr);
                const dayName = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][
                  dateObj.getDay()
                ];
                const isSelected = selectedDate === dateStr;
                const percentage = getCompletionPercentage(dateStr);
                const isToday = today === dateStr;
                const isFuture = dateStr > today;

                return (
                  <View
                    style={[
                      styles.dayColumn,
                      { width: ITEM_WIDTH, opacity: isFuture ? 0.4 : 1 },
                    ]}
                  >
                    {/* Date Item */}
                    <TouchableOpacity
                      disabled={isFuture}
                      onPress={() => setSelectedDate(dateStr)}
                      style={[
                        styles.dateItem,
                        isSelected && {
                          backgroundColor:
                            colorScheme === "dark" ? "#1F2937" : "#F3F4F6",
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.dayText,
                          isSelected && styles.selectedText,
                        ]}
                      >
                        {dayName}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.dateText,
                          isSelected && styles.selectedText,
                        ]}
                      >
                        {dateObj.getDate()}
                      </ThemedText>
                    </TouchableOpacity>

                    {/* Heatmap Cell */}
                    <TouchableOpacity
                      disabled={isFuture}
                      onPress={() => setSelectedDate(dateStr)}
                      style={[
                        styles.heatmapCell,
                        { backgroundColor: getHeatmapColor(percentage) },
                      ]}
                    >
                      {isToday && (
                        <View
                          style={[
                            styles.todayIndicator,
                            {
                              backgroundColor:
                                colorScheme === "dark" ? "#000000" : "#fff",
                            },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: colorScheme === "dark" ? "#374151" : "#E5E7EB",
              },
            ]}
          />

          {/* Habit List for Selected Date */}
          <View style={styles.habitList}>
            {INITIAL_HABITS.map((habitName) => {
              const isCompleted = history[selectedDate]?.[habitName];
              return (
                <TouchableOpacity
                  key={habitName}
                  onPress={() => toggleHabit(habitName)}
                  style={styles.habitItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.habitInfo}>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor:
                            colorScheme === "dark" ? "#4B5563" : "#E5E7EB",
                          backgroundColor:
                            isCompleted && colorScheme === "dark"
                              ? "#FFFFFF"
                              : isCompleted
                                ? "#111827"
                                : "transparent",
                          borderRadius: 6,
                        },
                      ]}
                    >
                      {isCompleted && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={colorScheme === "dark" ? "#000" : "#fff"}
                        />
                      )}
                    </View>
                    <ThemedText
                      style={[
                        styles.habitName,
                        isCompleted && styles.completedHabitText,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {habitName}
                    </ThemedText>
                  </View>
                  <View style={styles.progressContainer}>
                    <View
                      style={[
                        styles.progressBackground,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#374151" : "#F3F4F6",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: isCompleted ? "100%" : "0%",
                            backgroundColor:
                              colorScheme === "dark" ? "#FFFFFF" : "#111827",
                          },
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: Colors[colorScheme].text }, // Use text color as background for contrast
        ]}
        activeOpacity={0.8}
        onPress={() => console.log("Add habit")}
      >
        <Ionicons name="add" size={32} color={Colors[colorScheme].background} />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 36,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  themeButton: {
    padding: 8,
    borderRadius: 12,
  },
  pagerContainer: {
    marginBottom: 44,
    marginHorizontal: -20, // Pull out to full screen width
    width: SCREEN_WIDTH,
  },
  dayColumn: {
    alignItems: "center",
    gap: 12,
  },
  heatmapCell: {
    width: 42,
    height: 42,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  todayIndicator: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dateItem: {
    alignItems: "center",
    gap: 8,
    width: 42,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dayText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 17,
    fontWeight: "600",
  },
  selectedText: {
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginBottom: 36,
  },
  habitList: {
    gap: 24,
  },
  habitItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  habitInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  habitName: {
    fontSize: 17,
    fontWeight: "500",
  },
  completedHabitText: {
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  progressContainer: {
    width: 50,
    marginLeft: 20,
  },
  progressBackground: {
    height: 5,
    backgroundColor: "#F3F4F6",
    borderRadius: 2.5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#000000", // Default to black
    borderRadius: 2.5,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 10,
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
