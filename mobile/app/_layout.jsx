import { SplashScreen, Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useRef } from "react";

import { useAuthStore } from "../store/authStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { checkAuth, isCheckingAuth, user, token } = useAuthStore();
  const hasCheckedAuth = useRef(false);

  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, []);

  // Show splash screen while checking auth or loading fonts
  if (isCheckingAuth || !fontsLoaded) {
    return null;
  }

  // Determine initial route based on auth state
  const isSignedIn = user && token;
  const initialRouteName = isSignedIn ? "(tabs)" : "(auth)";

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Stack
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRouteName}
        >
          <Stack.Screen name="(auth)" options={{ animationEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ animationEnabled: false }} />
        </Stack>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
