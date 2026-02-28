import { db } from "@/db/client";
import { userSettings } from "@/db/schema";
import { ThemeContext, ThemeMode } from "@/hooks/use-theme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationProvider,
} from "@react-navigation/native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  useColorScheme as useNativeColorScheme,
} from "react-native";
import "react-native-reanimated";
import migrations from "../drizzle/migrations";

export default function RootLayout() {
  const nativeColorScheme = useNativeColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const { success: migrationsSuccess, error: migrationsError } = useMigrations(
    db,
    migrations,
  );

  // Load theme from DB
  useEffect(() => {
    if (migrationsSuccess) {
      (async () => {
        try {
          const settings = await db.select().from(userSettings).limit(1);
          if (settings.length > 0) {
            setThemeState(settings[0].theme as ThemeMode);
          } else {
            // Initialize with default
            await db.insert(userSettings).values({ theme: "system" });
          }
        } catch (e) {
          console.error("Failed to load settings:", e);
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
        <Text style={{ color: "red" }}>
          Migration error: {migrationsError.message}
        </Text>
      </View>
    );
  }

  if (!migrationsSuccess || !isThemeLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#FFF" : "#000"}
        />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorScheme }}>
      <NavigationProvider
        value={colorScheme === "dark" ? CustomDarkTheme : DefaultTheme}
      >
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="new-habit"
            options={{ presentation: "containedModal", headerShown: false }}
          />
        </Stack>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </NavigationProvider>
    </ThemeContext.Provider>
  );
}
