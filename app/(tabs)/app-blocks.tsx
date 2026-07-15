import { useTabBarBottomInset } from "@/components/bottom-nav";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useBlockedApps, type BlockableApp } from "@/hooks/use-blocked-apps";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppBlocksScreen() {
  const tabBarInset = useTabBarBottomInset();
  const { theme, setTheme, colorScheme, hasSeenOnboarding } = useTheme();
  const { apps, blockedCount, toggleAppBlock } = useBlockedApps();
  const [challengeApp, setChallengeApp] = useState<BlockableApp | null>(null);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challengeError, setChallengeError] = useState("");

  const openApp = (app: BlockableApp) => {
    if (app.isBlocked === 1) {
      setChallengeApp(app);
      setChallengeAnswer("");
      setChallengeError("");
      return;
    }
    setChallengeApp(null);
  };

  const closeChallenge = () => {
    setChallengeApp(null);
    setChallengeAnswer("");
    setChallengeError("");
  };

  const submitChallenge = () => {
    if (challengeAnswer.trim() === "8") {
      closeChallenge();
      return;
    }
    setChallengeError("Try again before continuing.");
  };

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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarInset + 24 },
          ]}
        >
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.title}>focus</ThemedText>
            </View>
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

          <View style={styles.appList}>
            {apps.map((app) => {
              const isBlocked = app.isBlocked === 1;
              return (
                <TouchableOpacity
                  key={app.id}
                  onPress={() => openApp(app)}
                  activeOpacity={0.75}
                  style={[
                    styles.appItem,
                    {
                      borderColor:
                        colorScheme === "dark" ? "#1F2937" : "#E5E7EB",
                    },
                  ]}
                >
                  <View style={styles.appInfo}>
                    <View
                      style={[
                        styles.appIcon,
                        {
                          backgroundColor: isBlocked
                            ? colorScheme === "dark"
                              ? "#FFFFFF"
                              : "#111827"
                            : colorScheme === "dark"
                              ? "#111827"
                              : "#F3F4F6",
                        },
                      ]}
                    >
                      <Ionicons
                        name={app.icon as any}
                        size={22}
                        color={
                          isBlocked
                            ? colorScheme === "dark"
                              ? "#000000"
                              : "#FFFFFF"
                            : Colors[colorScheme].text
                        }
                      />
                    </View>
                    <View style={styles.appText}>
                      <ThemedText style={styles.appName}>{app.name}</ThemedText>
                      <ThemedText style={styles.appStatus}>
                        {isBlocked ? "Challenge required" : "Allowed"}
                      </ThemedText>
                    </View>
                  </View>
                  <Switch
                    value={isBlocked}
                    onValueChange={() => toggleAppBlock(app.id, isBlocked)}
                    trackColor={{ false: "#D1D5DB", true: "#9CA3AF" }}
                    thumbColor={
                      isBlocked
                        ? colorScheme === "dark"
                          ? "#FFFFFF"
                          : "#111827"
                        : "#FFFFFF"
                    }
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={challengeApp !== null}
        transparent
        animationType="fade"
        onRequestClose={closeChallenge}
      >
        <View style={styles.modalScrim}>
          <View
            style={[
              styles.challengeCard,
              {
                backgroundColor: Colors[colorScheme].background,
                borderColor: colorScheme === "dark" ? "#1F2937" : "#E5E7EB",
              },
            ]}
          >
            <View style={styles.challengeIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={26}
                color={Colors[colorScheme].text}
              />
            </View>
            <ThemedText style={styles.challengeTitle}>
              {challengeApp?.name} is blocked
            </ThemedText>
            <ThemedText style={styles.challengePrompt}>
              Solve 3 + 5 to continue.
            </ThemedText>
            <TextInput
              value={challengeAnswer}
              onChangeText={(text) => {
                setChallengeAnswer(text);
                setChallengeError("");
              }}
              keyboardType="number-pad"
              placeholder="Answer"
              placeholderTextColor="#9CA3AF"
              style={[
                styles.challengeInput,
                {
                  color: Colors[colorScheme].text,
                  borderColor: colorScheme === "dark" ? "#374151" : "#D1D5DB",
                },
              ]}
            />
            {challengeError.length > 0 && (
              <ThemedText style={styles.challengeError}>
                {challengeError}
              </ThemedText>
            )}
            <View style={styles.challengeActions}>
              <TouchableOpacity
                onPress={closeChallenge}
                style={[
                  styles.secondaryButton,
                  {
                    borderColor:
                      colorScheme === "dark" ? "#374151" : "#D1D5DB",
                  },
                ]}
              >
                <ThemedText style={styles.secondaryButtonText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitChallenge}
                style={[
                  styles.primaryButton,
                  { backgroundColor: Colors[colorScheme].text },
                ]}
              >
                <ThemedText
                  style={[
                    styles.primaryButtonText,
                    { color: Colors[colorScheme].background },
                  ]}
                >
                  Continue
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: "Geist-Bold",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: "#9CA3AF",
    fontFamily: "Geist-Medium",
  },
  themeButton: {
    padding: 8,
    borderRadius: 12,
  },
  appList: {
    gap: 14,
  },
  appItem: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  appInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  appIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  appText: {
    flex: 1,
    gap: 4,
  },
  appName: {
    fontSize: 16,
    fontFamily: "Geist-SemiBold",
  },
  appStatus: {
    fontSize: 13,
    color: "#9CA3AF",
    fontFamily: "Geist-Medium",
  },
  modalScrim: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  challengeCard: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 8,
    padding: 22,
  },
  challengeIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  challengeTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: "Geist-Bold",
  },
  challengePrompt: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    color: "#9CA3AF",
    fontFamily: "Geist-Medium",
  },
  challengeInput: {
    height: 52,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 14,
    fontSize: 18,
    fontFamily: "Geist-SemiBold",
  },
  challengeError: {
    marginTop: 10,
    color: "#EF4444",
    fontSize: 14,
    fontFamily: "Geist-Medium",
  },
  challengeActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: "Geist-SemiBold",
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: "Geist-Bold",
  },
});
