import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();
  const { colorScheme } = useTheme();

  const handleStart = async () => {
    try {
      await db.update(userSettings).set({ hasSeenOnboarding: 1 });
      router.replace("/");
    } catch (e) {
      console.error("Failed to update onboarding status:", e);
      router.replace("/");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.centerContent}>
            <View style={styles.textContainer}>
              <ThemedText style={styles.logo}>bits</ThemedText>
              <ThemedText style={styles.title}>
                Track. Progress. Repeat.
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Build lasting habits with a minimal, focus-driven approach.
              </ThemedText>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#FFFFFF" : "#111827",
                },
              ]}
              onPress={handleStart}
              activeOpacity={0.8}
            >
              <ThemedText
                style={[
                  styles.buttonText,
                  { color: colorScheme === "dark" ? "#000000" : "#FFFFFF" },
                ]}
              >
                Start
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  logo: {
    fontSize: 64,
    fontFamily: "Geist-Bold",
    letterSpacing: -2,
    marginBottom: 40,
    lineHeight: 64,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    lineHeight: 48,
    fontFamily: "Geist-SemiBold",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: "Geist",
    textAlign: "center",
    color: "#9CA3AF",
    paddingHorizontal: 10,
  },
  footer: {
    marginBottom: 20,
  },
  button: {
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Geist-SemiBold",
  },
});
