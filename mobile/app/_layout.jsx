import { SplashScreen, Stack, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";

SplashScreen.preventAutoHideAsync();

// Inner component that uses auth context
function RootLayoutContent() {
  const { isCheckingAuth, isSignedIn } = useAuth();
  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });
  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded && !isCheckingAuth) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isCheckingAuth]);

  // Navigate based on auth state when it changes
  useEffect(() => {
    if (!isCheckingAuth && fontsLoaded) {
      if (isSignedIn) {
        // Ensure we're on the tabs stack when signed in
        router.replace("/(tabs)");
      } else {
        // Ensure we're on the auth stack when not signed in
        router.replace("/(auth)");
      }
    }
  }, [isSignedIn, isCheckingAuth, fontsLoaded, router]);

  // Show splash screen while checking auth or loading fonts
  if (isCheckingAuth || !fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
          }}
        >
          {/* Auth Stack */}
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
          </Stack.Group>

          {/* Tabs Stack */}
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack.Group>
        </Stack>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

// Root layout with provider
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
