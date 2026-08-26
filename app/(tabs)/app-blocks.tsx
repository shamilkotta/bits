import { DayMarkdownEditor } from "@/components/day-markdown-editor";
import { MarkdownPreview } from "@/components/markdown-preview";
import { useTabBarBottomInset } from "@/components/bottom-nav";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useDayNote, upsertDayNote } from "@/hooks/use-day-note";
import { useTheme } from "@/hooks/use-theme";
import { formatYmd } from "@/lib/date";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = SCREEN_WIDTH / 7.5;
const HORIZONTAL_PADDING = (SCREEN_WIDTH - 7 * ITEM_WIDTH) / 2;
const DAYS_COUNT = 184;
const OFFSET_DAYS = 180;

type Draft = {
  date: string;
  content: string;
};

const getDatesRange = (daysCount: number, offset: number = 0) => {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = -offset; i < daysCount - offset; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatYmd(d));
  }

  return dates;
};

export default function AppBlocksScreen() {
  const tabBarInset = useTabBarBottomInset();
  const { theme, setTheme, colorScheme, hasSeenOnboarding } = useTheme();
  const today = useMemo(() => formatYmd(new Date()), []);
  const isDark = colorScheme === "dark";

  const [selectedDate, setSelectedDate] = useState(today);
  const [previewMode, setPreviewMode] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const calendarDates = useMemo(
    () => getDatesRange(DAYS_COUNT, OFFSET_DAYS),
    [],
  );

  const { note, loading: noteLoading } = useDayNote(selectedDate);

  // Draft holds exactly what is shown in the editor for one specific date,
  // so switching days can never mix content between notes.
  const [draft, setDraft] = useState<Draft | null>(null);
  const pendingSaveRef = useRef<Draft | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Writes with the date captured in the pending draft, never the currently
  // selected day - a late flush after switching days lands on the right row.
  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    if (!pending) return;
    pendingSaveRef.current = null;
    upsertDayNote(pending.date, pending.content).catch((e) =>
      console.error("Failed to save day note:", e),
    );
  }, []);

  // Load the freshly fetched note into the editor draft
  useEffect(() => {
    if (noteLoading || note.date !== selectedDate) return;
    setDraft((current) =>
      current?.date === selectedDate
        ? current
        : { date: selectedDate, content: note.content },
    );
  }, [note, noteLoading, selectedDate]);

  // Drop any stale draft as soon as the day changes, before the DB round-trip
  useEffect(() => {
    flushSave();
    setDraft(null);
  }, [selectedDate, flushSave]);

  // Debounced autosave
  useEffect(() => {
    if (!draft || draft.date !== selectedDate) return;
    pendingSaveRef.current = draft;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSave, 500);
    return () => {};
  }, [draft, selectedDate, flushSave]);

  // Flush on unmount so nothing is lost
  useEffect(() => flushSave, [flushSave]);

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

  if (!hasSeenOnboarding) {
    return <Redirect href="/welcome" />;
  }

  const editorColors = {
    background: isDark ? "#000000" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#111827",
    muted: isDark ? "#6B7280" : "#9CA3AF",
    border: isDark ? "#1F2937" : "#D1D5DB",
    toolbarActive: isDark ? "#1F2937" : "#F3F4F6",
  };

  const draftForSelectedDay =
    draft?.date === selectedDate ? draft : null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.screenContent}>
            <View style={styles.header}>
              <ThemedText style={styles.title}>day</ThemedText>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => setPreviewMode((p) => !p)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.headerButton}
                >
                  <Ionicons
                    name={previewMode ? "create-outline" : "eye-outline"}
                    size={24}
                    color={
                      previewMode
                        ? Colors[colorScheme].text
                        : Colors[colorScheme].tabIconSelected
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={cycleTheme}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.headerButton}
                >
                  <Ionicons
                    name={getThemeIcon()}
                    size={24}
                    color={Colors[colorScheme].text}
                  />
                </TouchableOpacity>
              </View>
            </View>

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
                contentContainerStyle={{
                  paddingHorizontal: HORIZONTAL_PADDING,
                }}
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
                  const isToday = today === dateStr;
                  const isFuture = dateStr > today;

                  return (
                    <TouchableOpacity
                      disabled={isFuture}
                      onPress={() => setSelectedDate(dateStr)}
                      style={[
                        styles.dateItem,
                        { width: ITEM_WIDTH, opacity: isFuture ? 0.4 : 1 },
                        isSelected && {
                          backgroundColor: isDark ? "#1F2937" : "#F3F4F6",
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
                      {isToday && (
                        <View
                          style={[
                            styles.todayDot,
                            { backgroundColor: Colors[colorScheme].text },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: isDark ? "#374151" : "#E5E7EB",
                },
              ]}
            />

            {draftForSelectedDay ? (
              previewMode ? (
                <MarkdownPreview
                  value={draftForSelectedDay.content}
                  colors={editorColors}
                  bottomInset={tabBarInset}
                  onToggleCheckbox={(content) =>
                    setDraft({ date: selectedDate, content })
                  }
                />
              ) : (
                <DayMarkdownEditor
                  value={draftForSelectedDay.content}
                  onChangeText={(content) =>
                    setDraft({ date: selectedDate, content })
                  }
                  colors={editorColors}
                  bottomInset={tabBarInset}
                />
              )
            ) : (
              <View style={[styles.editorPlaceholder]}>
                <ThemedText style={{ color: editorColors.muted }}>
                  Loading…
                </ThemedText>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  keyboardView: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
  },
  pagerContainer: {
    marginBottom: 16,
    marginHorizontal: -20,
    width: SCREEN_WIDTH,
  },
  dateItem: {
    alignItems: "center",
    gap: 8,
    width: 42,
    paddingVertical: 8,
    borderRadius: 12,
    position: "relative",
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
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  editorPlaceholder: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
  },
});
