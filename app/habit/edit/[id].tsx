import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useHabit, useUpdateHabit } from "@/hooks/use-habits";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HABIT_ICONS = [
  "water",
  "barbell",
  "book",
  "leaf",
  "moon",
  "sunny",
  "bicycle",
  "fitness",
  "fast-food",
  "color-palette",
  "code-working",
  "journal",
  "musical-notes",
  "sparkles",
  "heart",
  "walk",
  "briefcase",
  "school",
  "planet",
  "game-controller",
  "bed",
  "cafe",
  "camera",
  "infinite",
];

const TIME_OPTIONS = ["Morning", "Afternoon", "Evening", "Night", "Anytime"];
const FREQUENCY_OPTIONS = ["Daily", "Weekends", "Weekdays", "Custom"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const { habit, loading: loadingHabit } = useHabit(Number(id));
  const { updateHabit } = useUpdateHabit();

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("Daily");
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [goal, setGoal] = useState("1");
  const [selectedIcon, setSelectedIcon] = useState(HABIT_ICONS[0]);
  const [customDays, setCustomDays] = useState<string[]>([]);

  const [showPicker, setShowPicker] = useState(false);
  const [showCustomDays, setShowCustomDays] = useState(false);
  const [popoverY, setPopoverY] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const goalInputRef = useRef<TextInput>(null);
  const freqRowRef = useRef<View>(null);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setFrequency(habit.frequency);
      setSelectedTimes(JSON.parse(habit.times || "[]"));
      setGoal(String(habit.goal));
      setSelectedIcon(habit.icon);
      setCustomDays(JSON.parse(habit.customDays || "[]"));
    }
  }, [habit]);

  const isDark = colorScheme === "dark";

  const toggleDay = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleCloseCustomDays = () => {
    setShowCustomDays(false);
    if (customDays.length === 0) {
      setFrequency("Daily");
    }
  };

  const toggleTime = (t: string) => {
    setSelectedTimes((prev) =>
      prev.includes(t)
        ? prev.length > 1
          ? prev.filter((time) => time !== t)
          : prev
        : [...prev, t],
    );
  };

  const onTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (event.type === "set" && date) {
        const timeStr = date.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        if (!selectedTimes.includes(timeStr))
          setSelectedTimes((prev) => [...prev, timeStr]);
      }
    } else if (date) {
      setSelectedDate(date);
    }
  };

  const handleConfirmTime = () => {
    const timeStr = selectedDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    if (!selectedTimes.includes(timeStr))
      setSelectedTimes((prev) => [...prev, timeStr]);
    setShowPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateHabit(Number(id), {
        name: name.trim(),
        icon: selectedIcon,
        frequency,
        customDays: JSON.stringify(customDays),
        goal: parseInt(goal, 10) || 1,
        times: JSON.stringify(selectedTimes),
      });
      router.back();
    } catch (e) {
      console.error("Failed to update habit:", e);
      setSaving(false);
    }
  };

  if (loadingHabit) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator
          style={{ flex: 1 }}
          color={isDark ? "#FFF" : "#000"}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <ThemedText style={styles.title}>Edit bit</ThemedText>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={28}
                color={isDark ? "#FFF" : "#000"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: isDark ? "#FFF" : "#000",
                    borderBottomColor: isDark ? "#333" : "#EEE",
                  },
                ]}
                placeholder="What is the habit?"
                placeholderTextColor={isDark ? "#666" : "#AAA"}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.optionsContainer}>
              <View style={{ zIndex: 10 }}>
                <View ref={freqRowRef}>
                  <OptionRow
                    label="FREQUENCY"
                    value={
                      frequency === "Custom" && customDays.length > 0
                        ? customDays.join(", ")
                        : frequency
                    }
                    onPress={() => {
                      const currentIndex = FREQUENCY_OPTIONS.indexOf(frequency);
                      const nextValue =
                        FREQUENCY_OPTIONS[
                          (currentIndex + 1) % FREQUENCY_OPTIONS.length
                        ];
                      setFrequency(nextValue);
                      if (nextValue === "Custom") {
                        setTimeout(() => {
                          freqRowRef.current?.measure(
                            (x, y, w, h, pageX, pageY) => {
                              setPopoverY(pageY + h);
                              setShowCustomDays(true);
                            },
                          );
                        }, 100);
                      } else {
                        setShowCustomDays(false);
                      }
                    }}
                  />
                </View>
                <Modal
                  visible={showCustomDays}
                  transparent
                  animationType="none"
                  onRequestClose={handleCloseCustomDays}
                >
                  <Pressable
                    style={styles.modalBackdrop}
                    onPress={handleCloseCustomDays}
                  >
                    <View
                      style={[
                        styles.popover,
                        {
                          backgroundColor: isDark ? "#1A1A1A" : "#FFF",
                          top: popoverY,
                          right: 24,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.popoverArrow,
                          { borderBottomColor: isDark ? "#1A1A1A" : "#FFF" },
                        ]}
                      />
                      <View style={styles.popoverHeader}>
                        <ThemedText style={styles.popoverTitle}>
                          Days
                        </ThemedText>
                        <TouchableOpacity onPress={handleCloseCustomDays}>
                          <Ionicons
                            name="close"
                            size={18}
                            color={isDark ? "#888" : "#CCC"}
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.daysGridCompact}>
                        {DAYS.map((day) => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.dayCircle,
                              customDays.includes(day) && {
                                backgroundColor: isDark ? "#FFF" : "#000",
                              },
                              { borderColor: isDark ? "#333" : "#EEE" },
                            ]}
                            onPress={() => toggleDay(day)}
                          >
                            <ThemedText
                              style={[
                                styles.dayCircleText,
                                customDays.includes(day) && {
                                  color: isDark ? "#000" : "#FFF",
                                },
                              ]}
                            >
                              {day.charAt(0)}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                </Modal>
              </View>

              <TouchableOpacity
                activeOpacity={1}
                onPress={() => goalInputRef.current?.focus()}
                style={[
                  styles.optionRow,
                  { borderBottomColor: isDark ? "#1A1A1A" : "#F9F9F9" },
                ]}
              >
                <ThemedText style={styles.optionLabel}>GOAL</ThemedText>
                <View style={styles.goalInputWrapper}>
                  <TextInput
                    ref={goalInputRef}
                    style={[
                      styles.numericInput,
                      { color: isDark ? "#FFF" : "#000" },
                    ]}
                    value={goal}
                    onChangeText={(text) =>
                      setGoal(text.replace(/[^0-9]/g, ""))
                    }
                    keyboardType="numeric"
                  />
                  <ThemedText style={styles.unitLabel}>Units</ThemedText>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>TIME</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeChipsRow}
                style={styles.horizontalScroll}
              >
                {TIME_OPTIONS.concat(
                  selectedTimes.filter((t) => !TIME_OPTIONS.includes(t)),
                ).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.timeChip,
                      selectedTimes.includes(t) && {
                        backgroundColor: isDark ? "#FFF" : "#000",
                      },
                      { borderColor: isDark ? "#333" : "#EEE" },
                    ]}
                    onPress={() => toggleTime(t)}
                  >
                    <ThemedText
                      style={[
                        styles.timeChipText,
                        selectedTimes.includes(t) && {
                          color: isDark ? "#000" : "#FFF",
                        },
                      ]}
                    >
                      {t}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.timeChip,
                    { borderColor: isDark ? "#333" : "#EEE" },
                  ]}
                  onPress={() => {
                    setSelectedDate(new Date());
                    setShowPicker(true);
                  }}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={isDark ? "#FFF" : "#000"}
                  />
                </TouchableOpacity>
              </ScrollView>
              {showPicker && Platform.OS === "ios" && (
                <Modal visible={true} transparent animationType="slide">
                  <Pressable
                    style={styles.modalBackdropBlur}
                    onPress={() => setShowPicker(false)}
                  >
                    <View
                      style={[
                        styles.bottomSheet,
                        { backgroundColor: isDark ? "#1A1A1A" : "#FFF" },
                      ]}
                    >
                      <View style={styles.sheetHeader}>
                        <TouchableOpacity onPress={() => setShowPicker(false)}>
                          <ThemedText style={styles.sheetCancel}>
                            Cancel
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirmTime}>
                          <ThemedText style={styles.sheetDone}>Done</ThemedText>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={selectedDate}
                        mode="time"
                        display="spinner"
                        onChange={onTimeChange}
                        textColor={isDark ? "#FFF" : "#000"}
                      />
                    </View>
                  </Pressable>
                </Modal>
              )}
              {showPicker && Platform.OS === "android" && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  display="default"
                  onChange={onTimeChange}
                />
              )}
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>APPEARANCE</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.iconsRow}
                style={styles.horizontalScroll}
              >
                {HABIT_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconCircle,
                      selectedIcon === icon && {
                        backgroundColor: isDark ? "#333" : "#F0F0F0",
                      },
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={24}
                      color={
                        selectedIcon === icon
                          ? isDark
                            ? "#FFF"
                            : "#000"
                          : isDark
                            ? "#333"
                            : "#CCC"
                      }
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: isDark ? "#FFF" : "#000" },
                saving && { opacity: 0.6 },
              ]}
              disabled={saving || !name.trim()}
              onPress={handleSave}
            >
              <ThemedText
                style={[
                  styles.saveButtonText,
                  { color: isDark ? "#000" : "#FFF" },
                ]}
              >
                {saving ? "SAVING..." : "SAVE CHANGES"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function OptionRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  return (
    <TouchableOpacity
      style={[
        styles.optionRow,
        { borderBottomColor: isDark ? "#1A1A1A" : "#F9F9F9" },
      ]}
      onPress={onPress}
    >
      <ThemedText style={styles.optionLabel}>{label}</ThemedText>
      <ThemedText style={styles.optionValue}>{value}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: "Geist-ExtraBold",
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  closeButton: { padding: 4 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  inputContainer: { marginTop: 20, marginBottom: 40 },
  input: {
    fontSize: 24,
    fontFamily: "Geist-Medium",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  optionsContainer: { marginBottom: 32 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontSize: 12,
    fontFamily: "Geist-SemiBold",
    color: "#888",
    letterSpacing: 1,
  },
  optionValue: { fontSize: 16, fontFamily: "Geist-Medium" },
  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Geist-SemiBold",
    color: "#888",
    letterSpacing: 1,
    marginBottom: 16,
  },
  timeChipsRow: { gap: 8, paddingHorizontal: 24 },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timeChipText: { fontSize: 14, fontFamily: "Geist-SemiBold" },
  horizontalScroll: { marginHorizontal: -24 },
  numericInput: {
    fontSize: 16,
    fontFamily: "Geist-SemiBold",
    textAlign: "right",
  },
  goalInputWrapper: { flexDirection: "row", alignItems: "center", gap: 8 },
  unitLabel: { fontSize: 16, color: "#888", fontFamily: "Geist-Medium" },
  modalBackdrop: { flex: 1, backgroundColor: "transparent" },
  popover: {
    position: "absolute",
    width: 280,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  popoverArrow: {
    position: "absolute",
    top: -8,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  popoverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  popoverTitle: { fontSize: 14, fontFamily: "Geist-SemiBold", color: "#888" },
  daysGridCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleText: { fontSize: 12, fontFamily: "Geist-Bold" },
  iconsRow: { gap: 12, paddingHorizontal: 24 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12 },
  saveButton: {
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { fontSize: 16, fontFamily: "Geist-Bold", letterSpacing: 1 },
  modalBackdropBlur: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  sheetCancel: { fontSize: 16, color: "#666", fontFamily: "Geist-Medium" },
  sheetDone: { fontSize: 16, color: "#000", fontFamily: "Geist-Bold" },
});
