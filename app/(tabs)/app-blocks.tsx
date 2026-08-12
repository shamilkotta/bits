import { useTabBarBottomInset } from "@/components/bottom-nav";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useDayNote } from "@/hooks/use-day-note";
import { useTheme } from "@/hooks/use-theme";
import { formatYmd } from "@/lib/date";
import {
  defaultEditorTheme,
  RichText,
  Toolbar,
  useEditorBridge,
} from "@10play/tentap-editor";
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
const lightEditorCss = `
  * {
    background-color: #FFFFFF;
    color: #111827;
  }
  html, body {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  ::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  html::-webkit-scrollbar,
  body::-webkit-scrollbar,
  .ProseMirror::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  .ProseMirror {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  ul[data-type="taskList"] li > label input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid #111827;
    border-radius: 4px;
    background-color: #FFFFFF;
    position: relative;
  }
  ul[data-type="taskList"] li > label input[type="checkbox"]:checked {
    background-color: #111827;
  }
  ul[data-type="taskList"] li > label input[type="checkbox"]:checked::after {
    content: "";
    position: absolute;
    left: 4px;
    top: 1px;
    width: 5px;
    height: 9px;
    border: solid #FFFFFF;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  blockquote {
    border-left: 3px solid #D1D5DB;
    padding-left: 1rem;
  }
`;
const darkEditorCss = `
  * {
    background-color: #000000;
    color: #FFFFFF;
  }
  html, body {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  ::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  html::-webkit-scrollbar,
  body::-webkit-scrollbar,
  .ProseMirror::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  .ProseMirror {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  ul[data-type="taskList"] li > label input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border: 2px solid #FFFFFF;
    border-radius: 4px;
    background-color: #000000;
    position: relative;
  }
  ul[data-type="taskList"] li > label input[type="checkbox"]:checked {
    background-color: #FFFFFF;
  }
  ul[data-type="taskList"] li > label input[type="checkbox"]:checked::after {
    content: "";
    position: absolute;
    left: 4px;
    top: 1px;
    width: 5px;
    height: 9px;
    border: solid #000000;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  blockquote {
    border-left: 3px solid #374151;
    padding-left: 1rem;
  }
  .highlight-background {
    background-color: #1F2937;
  }
`;

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
  const [selectedDate, setSelectedDate] = useState(today);
  const flatListRef = useRef<FlatList>(null);
  const calendarDates = useMemo(
    () => getDatesRange(DAYS_COUNT, OFFSET_DAYS),
    [],
  );
  const { note, loading: noteLoading, saveNote } = useDayNote(selectedDate);
  const syncedEditorDateRef = useRef<string | null>(null);
  const editorTheme = useMemo(
    () =>
      colorScheme === "dark"
        ? {
            toolbar: {
              toolbarBody: {
                backgroundColor: "#000000",
                borderTopColor: "#1F2937",
                borderBottomColor: "#1F2937",
              },
              toolbarButton: {
                backgroundColor: "#000000",
              },
              icon: {
                tintColor: "#FFFFFF",
              },
              iconDisabled: {
                tintColor: "#4B5563",
              },
              iconWrapper: {
                backgroundColor: "#000000",
              },
              iconWrapperActive: {
                backgroundColor: "#1F2937",
              },
              linkBarTheme: {
                addLinkContainer: {
                  backgroundColor: "#000000",
                  borderTopColor: "#1F2937",
                  borderBottomColor: "#1F2937",
                },
                linkInput: {
                  backgroundColor: "#000000",
                  color: "#FFFFFF",
                },
                placeholderTextColor: "#6B7280",
                doneButton: {
                  backgroundColor: "#FFFFFF",
                },
                doneButtonText: {
                  color: "#000000",
                },
              },
            },
            webview: {
              backgroundColor: "#000000",
            },
            webviewContainer: {
              backgroundColor: "#000000",
            },
          }
        : defaultEditorTheme,
    [colorScheme],
  );
  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    initialContent: note.content,
    theme: editorTheme,
  });

  const resetEditorScroll = useCallback(() => {
    editor.webviewRef.current?.injectJavaScript(`
      const resetScroll = () => {
        const editorEl = document.querySelector('.ProseMirror');
        const scrollParents = [
          editorEl,
          document.scrollingElement,
          document.documentElement,
          document.body,
        ].filter(Boolean);
        scrollParents.forEach((element) => {
          element.scrollTop = 0;
          element.scrollLeft = 0;
        });
        window.scrollTo(0, 0);
      };
      resetScroll();
      setTimeout(resetScroll, 50);
      setTimeout(resetScroll, 150);
      true;
    `);
  }, [editor]);

  const applyEditorTheme = useCallback(() => {
    const css = `${colorScheme === "dark" ? darkEditorCss : lightEditorCss}
      .ProseMirror {
        padding-bottom: ${tabBarInset + 80}px !important;
      }`;

    (editor as any).injectCSS?.(css, "bits-editor-theme");
    setTimeout(() => {
      (editor as any).injectCSS?.(css, "bits-editor-theme");
    }, 100);
    setTimeout(() => {
      (editor as any).injectCSS?.(css, "bits-editor-theme");
    }, 300);
  }, [colorScheme, editor, tabBarInset]);

  useEffect(() => {
    if (noteLoading || note.date !== selectedDate) return;
    if (syncedEditorDateRef.current === selectedDate) return;

    editor.setContent(note.content);
    resetEditorScroll();
    syncedEditorDateRef.current = selectedDate;
  }, [
    editor,
    note.content,
    note.date,
    noteLoading,
    resetEditorScroll,
    selectedDate,
  ]);

  useEffect(() => {
    return editor._subscribeToContentUpdate(async () => {
      const content = await editor.getHTML();
      syncedEditorDateRef.current = selectedDate;
      saveNote({ content });
    });
  }, [editor, saveNote, selectedDate]);

  useEffect(() => {
    applyEditorTheme();
    return editor._subscribeToEditorStateUpdate((state: any) => {
      if (state.isReady) applyEditorTheme();
    });
  }, [applyEditorTheme, editor]);

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
                  backgroundColor:
                    colorScheme === "dark" ? "#374151" : "#E5E7EB",
                },
              ]}
            />

            <View
              style={[
                styles.toolbarShell,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#000000" : "#FFFFFF",
                  borderColor: colorScheme === "dark" ? "#1F2937" : "#D1D5DB",
                },
              ]}
            >
              <Toolbar editor={editor} hidden={false} />
            </View>
            <View
              style={[
                styles.editorShell,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#000000" : "#FFFFFF",
                },
              ]}
            >
              <RichText
                key={selectedDate}
                editor={editor}
                onLoad={() => {
                  applyEditorTheme();
                  if (note.date === selectedDate) {
                    editor.setContent(note.content);
                    resetEditorScroll();
                  }
                }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                style={[
                  styles.richTextEditor,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#000000" : "#FFFFFF",
                  },
                ]}
              />
            </View>
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
  editorShell: {
    flex: 1,
    overflow: "hidden",
  },
  richTextEditor: {
    flex: 1,
    backgroundColor: "transparent",
  },
  toolbarShell: {
    height: 46,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 18,
    overflow: "hidden",
  },
});
