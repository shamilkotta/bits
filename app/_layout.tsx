import { ThemeContext, ThemeMode } from "@/hooks/use-theme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useColorScheme as useNativeColorScheme } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  const nativeColorScheme = useNativeColorScheme();
  const [theme, setTheme] = useState<ThemeMode>("system");

  const colorScheme =
    theme === "system" ? (nativeColorScheme ?? "light") : theme;

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: "#000000",
      card: "#000000",
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorScheme }}>
      <NavigationProvider
        value={colorScheme === "dark" ? CustomDarkTheme : DefaultTheme}
      >
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </NavigationProvider>
    </ThemeContext.Provider>
  );
}
