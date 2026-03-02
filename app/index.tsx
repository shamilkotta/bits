import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import {
  useCompletionCounts,
  useHabitCompletions,
  useHabits,
  useToggleCompletion,
} from "@/hooks/use-habits";
import { useTheme } from "@/hooks/use-theme";
import { updateAllWidgets } from "@/widgets/update-widgets";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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

const DAYS_COUNT = 184; // 180 past days + 1 today + 4 future days
const OFFSET_DAYS = 180;

export default function HomeScreen() {
  const router = useRouter();
  const { theme, setTheme, colorScheme, hasSeenOnboarding } = useTheme();
  const today = useMemo(() => formatDate(new Date()), []);
  const flatListRef = useRef<FlatList>(null);
  const [selectedDate, setSelectedDate] = useState(today);

  // DB hooks
  const { habits, refetch: refetchHabits } = useHabits();
  const { completions, refetch: refetchCompletions } =
    useHabitCompletions(selectedDate);
  const { toggle } = useToggleCompletion();

  // Generate range for the scrollable calendar (days)
  const calendarDates = useMemo(
    () => getDatesRange(DAYS_COUNT, OFFSET_DAYS),
    [],
  );

  const { percentages, refetch: refetchCounts } = useCompletionCounts(
    calendarDates,
    habits.length,
  );

  // Refetch data when screen comes into focus (e.g. after creating a habit)
  useFocusEffect(
    useCallback(() => {
      refetchHabits();
      refetchCompletions();
      refetchCounts();
      updateAllWidgets(colorScheme === "dark");
    }, [refetchHabits, refetchCompletions, refetchCounts, colorScheme]),
  );

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
  const toggleHabit = async (habitId: number) => {
    if (selectedDate > today) return;
    const currentlyCompleted = !!completions[habitId];
    await toggle(habitId, selectedDate, currentlyCompleted);
    refetchCompletions();
    refetchCounts();
    updateAllWidgets(colorScheme === "dark");
  };

  // Calculate completion percentage for any given date
  const getCompletionPercentage = (date: string) => {
    return percentages[date] || 0;
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

  if (!hasSeenOnboarding) {
    return <Redirect href="/welcome" />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>bits</ThemedText>
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
            {habits.length === 0 && (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>
                  No habits yet. Tap + to create one!
                </ThemedText>
              </View>
            )}
            {habits.map((habit) => {
              const isCompleted = !!completions[habit.id];
              return (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => toggleHabit(habit.id)}
                  style={styles.habitItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.habitInfo}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name={habit.icon as any}
                        size={24}
                        color={
                          isCompleted
                            ? colorScheme === "dark"
                              ? "#FFFFFF"
                              : "#111827"
                            : colorScheme === "dark"
                              ? "#374151"
                              : "#E5E7EB"
                        }
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.habitName,
                        isCompleted && styles.completedHabitText,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {habit.name}
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

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: Colors[colorScheme].text }, // Use text color as background for contrast
        ]}
        activeOpacity={0.8}
        onPress={() => router.push("/new-habit")}
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
    lineHeight: 40,
    fontFamily: "Geist-Bold",
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
    fontFamily: "Geist-Medium",
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 17,
    fontFamily: "Geist-SemiBold",
  },
  selectedText: {
    fontFamily: "Geist-Bold",
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
    gap: 16,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  habitName: {
    fontSize: 18,
    fontFamily: "Geist-SemiBold",
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    fontFamily: "Geist-Medium",
  },
});
