import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import { ThemeContext, ThemeMode } from "@/hooks/use-theme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationProvider,
} from "@react-navigation/native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Text,
  View,
  useColorScheme as useNativeColorScheme,
} from "react-native";
import "react-native-reanimated";
import migrations from "../drizzle/migrations";

// Prevent splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const nativeColorScheme = useNativeColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const { success: migrationsSuccess, error: migrationsError } = useMigrations(
    db,
    migrations,
  );

  const [loaded] = useFonts({
    Geist: require("../assets/fonts/Geist-Regular.ttf"),
    "Geist-Medium": require("../assets/fonts/Geist-Medium.ttf"),
    "Geist-SemiBold": require("../assets/fonts/Geist-SemiBold.ttf"),
    "Geist-Bold": require("../assets/fonts/Geist-Bold.ttf"),
    "Geist-ExtraBold": require("../assets/fonts/Geist-ExtraBold.ttf"),
    "Geist-Black": require("../assets/fonts/Geist-Black.ttf"),
  });

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (
      loaded &&
      migrationsSuccess &&
      isThemeLoaded &&
      hasSeenOnboarding !== null
    ) {
      SplashScreen.hideAsync();
    }
  }, [loaded, migrationsSuccess, isThemeLoaded, hasSeenOnboarding]);

  // Load theme and onboarding from DB
  useEffect(() => {
    if (migrationsSuccess) {
      (async () => {
        try {
          const settings = await db.select().from(userSettings).limit(1);
          if (settings.length > 0) {
            setThemeState(settings[0].theme as ThemeMode);
            setHasSeenOnboarding(settings[0].hasSeenOnboarding === 1);
          } else {
            // Initialize with default
            await db.insert(userSettings).values({
              theme: "system",
              hasSeenOnboarding: 0,
            });
            setHasSeenOnboarding(false);
          }
        } catch (e) {
          console.error("Failed to load settings:", e);
          setHasSeenOnboarding(true); // Default to seen if error to not block app
        } finally {
          setIsThemeLoaded(true);
        }
      })();
    }
  }, [migrationsSuccess]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      await db.update(userSettings).set({ theme: newTheme });
    } catch (e) {
      console.error("Failed to update theme in DB:", e);
    }
  };

  const colorScheme =
    theme === "system" ? (nativeColorScheme ?? "light") : theme;

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: "#000000",
      card: "#000000",
      text: "#FFFFFF",
    },
  };

  if (migrationsError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red", fontFamily: "Geist" }}>
          Migration error: {migrationsError.message}
        </Text>
      </View>
    );
  }

  if (
    !migrationsSuccess ||
    !isThemeLoaded ||
    !loaded ||
    hasSeenOnboarding === null
  ) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorScheme }}>
      <NavigationProvider
        value={colorScheme === "dark" ? CustomDarkTheme : DefaultTheme}
      >
        <Stack
          initialRouteName={hasSeenOnboarding ? "index" : "welcome"}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="welcome" />
          <Stack.Screen name="index" />
          <Stack.Screen
            name="new-habit"
            options={{ presentation: "containedModal" }}
          />
        </Stack>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </NavigationProvider>
    </ThemeContext.Provider>
  );
}
