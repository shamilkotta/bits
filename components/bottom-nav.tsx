import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE_TAB_WIDTH = 104;
const INACTIVE_TAB_WIDTH = 46;
const TAB_BAR_HEIGHT = 48;
const TAB_BAR_PADDING = 3;
const TAB_BAR_GAP = 6;
const TAB_BAR_MARGIN = 10;
const TAB_BAR_WIDTH =
  ACTIVE_TAB_WIDTH + INACTIVE_TAB_WIDTH + TAB_BAR_GAP + TAB_BAR_PADDING * 2 + 2;
const TAB_ITEM_HEIGHT = TAB_BAR_HEIGHT - TAB_BAR_PADDING * 2;

const TAB_CONFIG = {
  index: {
    label: "Bits",
    icon: "sparkles-outline",
  },
  "app-blocks": {
    label: "Day",
    icon: "calendar-outline",
  },
} as const;

type TabRouteName = keyof typeof TAB_CONFIG;

export function useTabBarBottomInset() {
  const insets = useSafeAreaInsets();
  return (
    TAB_BAR_HEIGHT + TAB_BAR_MARGIN + Math.max(insets.bottom, TAB_BAR_MARGIN)
  );
}

const TAB_SPRING = { damping: 20, stiffness: 260, mass: 0.8 };
const PRESS_SPRING = { damping: 12, stiffness: 260 };

export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const { colorScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, TAB_SPRING);
  }, [activeIndex, state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          activeIndex.value,
          [0, 1],
          [TAB_BAR_PADDING, TAB_BAR_PADDING + INACTIVE_TAB_WIDTH + TAB_BAR_GAP],
        ),
      },
    ],
  }));

  const indicatorColor = colorScheme === "dark" ? "#FFFFFF" : "#111827";

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, TAB_BAR_MARGIN) },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(17, 24, 39, 0.92)"
                : "rgba(255, 255, 255, 0.94)",
            borderColor: colorScheme === "dark" ? "#1F2937" : "#E5E7EB",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: indicatorColor },
            indicatorStyle,
          ]}
        />
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name as TabRouteName];
          if (!config) return null;

          const isActive = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <NavItem
              key={route.key}
              icon={config.icon}
              isActive={isActive}
              label={config.label}
              onPress={onPress}
              colorScheme={colorScheme}
            />
          );
        })}
      </View>
    </View>
  );
}

type NavItemProps = {
  colorScheme: "light" | "dark";
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  label: string;
  onPress: () => void;
};

function NavItem({
  colorScheme,
  icon,
  isActive,
  label,
  onPress,
}: NavItemProps) {
  const activeProgress = useSharedValue(isActive ? 1 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    activeProgress.value = withSpring(isActive ? 1 : 0, TAB_SPRING);
  }, [activeProgress, isActive]);

  const itemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(activeProgress.value, [0, 1], [0.88, 1]),
      },
    ],
    opacity: interpolate(activeProgress.value, [0, 1], [0.55, 1]),
  }));

  const activeColor = colorScheme === "dark" ? "#000000" : "#FFFFFF";
  const inactiveColor = "#9CA3AF";
  const tintColor = isActive ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withSpring(0.94, PRESS_SPRING);
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, PRESS_SPRING);
      }}
      style={[
        styles.itemPressable,
        { width: isActive ? ACTIVE_TAB_WIDTH : INACTIVE_TAB_WIDTH },
      ]}
    >
      <Animated.View
        style={[styles.item, isActive && styles.activeItem, itemStyle]}
      >
        <Animated.View style={iconStyle}>
          <Ionicons name={icon} size={18} color={tintColor} />
        </Animated.View>
        {isActive && (
          <Animated.Text style={[styles.label, { color: tintColor }]}>
            {label}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  container: {
    width: TAB_BAR_WIDTH,
    height: TAB_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: TAB_BAR_GAP,
    borderWidth: 1,
    borderRadius: 22,
    padding: TAB_BAR_PADDING,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: TAB_BAR_PADDING,
    bottom: TAB_BAR_PADDING,
    width: ACTIVE_TAB_WIDTH,
    borderRadius: 17,
  },
  itemPressable: {
    height: TAB_ITEM_HEIGHT,
  },
  item: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },
  activeItem: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Geist-SemiBold",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
