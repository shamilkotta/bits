import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useDeleteHabit, useHabit, useHabitStats } from "@/hooks/use-habits";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HabitDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const { habit, loading } = useHabit(Number(id));
  const { streak, totalLogged } = useHabitStats(Number(id));
  const { deleteHabit } = useDeleteHabit();

  const isDark = colorScheme === "dark";

  const handleDelete = () => {
    Alert.alert(
      "Delete bit",
      "Are you sure you want to delete this habit? All past and future progress and logs will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteHabit(Number(id));
              router.back();
            } catch {
              Alert.alert("Error", "Failed to delete habit");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centered}>
            <ActivityIndicator color={isDark ? "#FFF" : "#000"} />
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!habit) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
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
          <View style={styles.centered}>
            <ThemedText style={styles.notFoundText}>Habit not found</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const times = JSON.parse(habit.times || "[]");
  const customDays = JSON.parse(habit.customDays || "[]");

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <View
              style={[
                styles.inlineIconCircle,
                { backgroundColor: isDark ? "#333" : "#F0F0F0" },
              ]}
            >
              <Ionicons
                name={habit.icon as any}
                size={24}
                color={isDark ? "#FFF" : "#000"}
              />
            </View>
            <ThemedText style={styles.headerTitleText} numberOfLines={1}>
              {habit.name}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push(`/habit/edit/${id}`)}
              style={[
                styles.editButton,
                { backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6" },
              ]}
            >
              <ThemedText style={styles.editText}>Edit</ThemedText>
            </TouchableOpacity>
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
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View
              style={[
                styles.statItem,
                { backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6" },
              ]}
            >
              <ThemedText style={styles.statLabel}>STREAK</ThemedText>
              <View style={styles.statValueRow}>
                <Ionicons
                  name="flame"
                  size={20}
                  color={isDark ? "#FFF" : "#000"}
                />
                <ThemedText style={styles.statValue}>{streak} days</ThemedText>
              </View>
            </View>
            <View
              style={[
                styles.statItem,
                { backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6" },
              ]}
            >
              <ThemedText style={styles.statLabel}>TOTAL LOGS</ThemedText>
              <View style={styles.statValueRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={isDark ? "#FFF" : "#000"}
                />
                <ThemedText style={styles.statValue}>
                  {totalLogged} logs
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Options Section */}
          <View style={styles.optionsContainer}>
            <OptionRow
              label="FREQUENCY"
              value={
                habit.frequency === "Custom" && customDays.length > 0
                  ? customDays.join(", ")
                  : habit.frequency
              }
            />
            <OptionRow label="GOAL" value={`${habit.goal} Units`} />
            <OptionRow
              label="CREATED"
              value={new Date(habit.createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            />
          </View>

          {/* Time Section */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>TIME</ThemedText>
            <View style={styles.timeChipsRow}>
              {times.map((t: string) => (
                <View
                  key={t}
                  style={[
                    styles.timeChip,
                    {
                      borderColor: isDark ? "#333" : "#EEE",
                      backgroundColor: isDark ? "#FFF" : "#000",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.timeChipText,
                      { color: isDark ? "#000" : "#FFF" },
                    ]}
                  >
                    {t}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.deleteButtonText}>
              Delete Habit
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function OptionRow({ label, value }: { label: string; value: string }) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={[
        styles.optionRow,
        { borderBottomColor: isDark ? "#1A1A1A" : "#F9F9F9" },
      ]}
    >
      <ThemedText style={styles.optionLabel}>{label}</ThemedText>
      <ThemedText style={styles.optionValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
    marginRight: 10,
  },
  headerTitleText: {
    fontSize: 28,
    fontFamily: "Geist-ExtraBold",
    letterSpacing: -0.5,
    flex: 1,
    lineHeight: 28,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editText: {
    fontSize: 14,
    fontFamily: "Geist-Bold",
    letterSpacing: -0.3,
  },
  inlineIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 100,
  },
  optionsContainer: {
    marginTop: 10,
    marginBottom: 32,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionLabel: {
    fontSize: 12,
    fontFamily: "Geist-Bold",
    color: "#888",
    letterSpacing: 1,
  },
  optionValue: {
    fontSize: 16,
    fontFamily: "Geist-SemiBold",
  },
  section: {
    marginTop: 12,
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Geist-Bold",
    color: "#888",
    letterSpacing: 1,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Geist-Bold",
    letterSpacing: -0.5,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Geist-SemiBold",
    color: "#888",
    letterSpacing: 1,
    marginBottom: 16,
  },
  timeChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timeChipText: {
    fontSize: 14,
    fontFamily: "Geist-SemiBold",
  },
  appearanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  deleteButton: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 69, 58, 0.08)",
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: "Geist-Bold",
    color: "#FF453A",
  },
  notFoundText: {
    fontSize: 16,
    color: "#888",
    fontFamily: "Geist-Medium",
  },
});
