import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import styles from "../assets/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";

export default function LogoutButton() {
  const { logout, isLoading } = useAuth();

  const confirmLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        onPress: async () => {
          const result = await logout();
          if (!result.success) {
            Alert.alert("Error", result.error || "Failed to logout");
          }
          // Success: AuthContext will trigger navigation to login via router.replace()
        }, 
        style: "destructive" 
      },
    ]);
  };

  return (
    <TouchableOpacity 
      style={[styles.logoutButton, isLoading && { opacity: 0.6 }]} 
      onPress={confirmLogout}
      disabled={isLoading}
    >
      <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );
}
