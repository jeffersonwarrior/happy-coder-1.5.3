import 'react-native-quick-base64';
import '../theme.css';
import { FontAwesome } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Fonts from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PostHogProvider } from 'posthog-react-native';
import * as React from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import sodium from 'react-native-libsodium';
import { initialWindowMetrics, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUnistyles } from 'react-native-unistyles';

import { AuthProvider } from '@/auth/AuthContext';
import { AuthCredentials, TokenStorage } from '@/auth/tokenStorage';
import { CommandPaletteProvider } from '@/components/CommandPalette/CommandPaletteProvider';
import { SidebarNavigator } from '@/components/SidebarNavigator';
import { StatusBarProvider } from '@/components/StatusBarProvider';
import { FaviconPermissionIndicator } from '@/components/web/FaviconPermissionIndicator';
import { ModalProvider } from '@/modal';
import { RealtimeProvider } from '@/realtime/RealtimeProvider';
import { syncRestore } from '@/sync/sync';
import { tracking } from '@/track/tracking';
import { useTrackScreens } from '@/track/useTrackScreens';
// import * as SystemUI from 'expo-system-ui';
import { applyDesktopWindowSizing, initializeWindowSizeMonitoring } from '@/utils/desktopWindow';
import { monkeyPatchConsoleForRemoteLoggingForFasterAiAutoDebuggingOnlyInLocalBuilds } from '@/utils/remoteLogger';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Configure splash screen
SplashScreen.setOptions({
  fade: true,
  duration: 300,
});
SplashScreen.preventAutoHideAsync();

// Set window background color - now handled by Unistyles
// SystemUI.setBackgroundColorAsync('white');

// NEVER ENABLE REMOTE LOGGING IN PRODUCTION
// This is for local debugging with AI only
// So AI will have all the logs easily accessible in one file for analysis
if (process.env.PUBLIC_EXPO_DANGEROUSLY_LOG_TO_SERVER_FOR_AI_AUTO_DEBUGGING) {
  monkeyPatchConsoleForRemoteLoggingForFasterAiAutoDebuggingOnlyInLocalBuilds();
}

// Component to apply horizontal safe area padding
function HorizontalSafeAreaWrapper({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {children}
    </View>
  );
}

export default function RootLayout() {
  const { theme } = useUnistyles();
  const navigationTheme = React.useMemo(() => {
    if (theme.dark) {
      return {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.colors.groupped.background,
        },
      };
    }
    return {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: theme.colors.groupped.background,
      },
    };
  }, [theme.dark]);

  //
  // Init sequence
  //
  const [initState, setInitState] = React.useState<{
    credentials: AuthCredentials | null;
  } | null>(null);
  React.useEffect(() => {
    (async () => {
      try {
        // Check if running in Tauri
        const isTauri =
          Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

        if (!isTauri) {
          // Normal font loading for non-Tauri environments (native and regular web)
          await Fonts.loadAsync({
            // Keep existing font
            SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),

            // IBM Plex Sans family
            'IBMPlexSans-Regular': require('@/assets/fonts/IBMPlexSans-Regular.ttf'),
            'IBMPlexSans-Italic': require('@/assets/fonts/IBMPlexSans-Italic.ttf'),
            'IBMPlexSans-SemiBold': require('@/assets/fonts/IBMPlexSans-SemiBold.ttf'),

            // IBM Plex Mono family
            'IBMPlexMono-Regular': require('@/assets/fonts/IBMPlexMono-Regular.ttf'),
            'IBMPlexMono-Italic': require('@/assets/fonts/IBMPlexMono-Italic.ttf'),
            'IBMPlexMono-SemiBold': require('@/assets/fonts/IBMPlexMono-SemiBold.ttf'),

            // Bricolage Grotesque
            'BricolageGrotesque-Bold': require('@/assets/fonts/BricolageGrotesque-Bold.ttf'),

            ...FontAwesome.font,
          });
        } else {
          // For Tauri, skip Font Face Observer as fonts are loaded via CSS
          console.log('Do not wait for fonts to load');
          (async () => {
            try {
              await Fonts.loadAsync({
                // Keep existing font
                SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),

                // IBM Plex Sans family
                'IBMPlexSans-Regular': require('@/assets/fonts/IBMPlexSans-Regular.ttf'),
                'IBMPlexSans-Italic': require('@/assets/fonts/IBMPlexSans-Italic.ttf'),
                'IBMPlexSans-SemiBold': require('@/assets/fonts/IBMPlexSans-SemiBold.ttf'),

                // IBM Plex Mono family
                'IBMPlexMono-Regular': require('@/assets/fonts/IBMPlexMono-Regular.ttf'),
                'IBMPlexMono-Italic': require('@/assets/fonts/IBMPlexMono-Italic.ttf'),
                'IBMPlexMono-SemiBold': require('@/assets/fonts/IBMPlexMono-SemiBold.ttf'),

                // Bricolage Grotesque
                'BricolageGrotesque-Bold': require('@/assets/fonts/BricolageGrotesque-Bold.ttf'),

                ...FontAwesome.font,
              });
            } catch (e) {
              // Ignore
            }
          })();
        }
        await sodium.ready;

        // Initialize desktop window sizing
        applyDesktopWindowSizing();

        const credentials = await TokenStorage.getCredentials();
        console.log('credentials', credentials);
        if (credentials) {
          await syncRestore(credentials);
        }

        setInitState({ credentials });
      } catch (error) {
        console.error('Error initializing:', error);
      }
    })();
  }, []);

  // Initialize window resize monitoring for desktop
  React.useEffect(() => {
    if (initState) {
      const cleanup = initializeWindowSizeMonitoring();
      return cleanup;
    }
  }, [initState]);

  React.useEffect(() => {
    if (initState) {
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 100);
    }
  }, [initState]);

  // Track the screens
  useTrackScreens();

  //
  // Not inited
  //

  if (!initState) {
    return null;
  }

  //
  // Boot
  //

  let providers = (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <KeyboardProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider initialCredentials={initState.credentials}>
            <ThemeProvider value={navigationTheme}>
              <StatusBarProvider />
              <ModalProvider>
                <CommandPaletteProvider>
                  <RealtimeProvider>
                    <HorizontalSafeAreaWrapper>
                      <SidebarNavigator />
                    </HorizontalSafeAreaWrapper>
                  </RealtimeProvider>
                </CommandPaletteProvider>
              </ModalProvider>
            </ThemeProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
  if (tracking) {
    providers = <PostHogProvider client={tracking}>{providers}</PostHogProvider>;
  }

  return (
    <>
      <FaviconPermissionIndicator />
      {providers}
    </>
  );
}
