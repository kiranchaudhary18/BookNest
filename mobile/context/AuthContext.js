import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/api";
import { useRouter } from "expo-router";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // Check if user is already logged in on app start
  const checkAuth = useCallback(async () => {
    try {
      setIsCheckingAuth(true);
      const savedToken = await AsyncStorage.getItem("authToken");
      const savedUser = await AsyncStorage.getItem("authUser");

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        // Navigate to home after restoring session
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 0);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setToken(null);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  }, [router]);

  // Initialize auth check on app start
  useEffect(() => {
    checkAuth();
  }, []);

  // Signup function
  const signup = useCallback(async (username, email, password) => {
    try {
      setIsLoading(true);

      // Validate inputs
      if (!username || !email || !password) {
        return {
          success: false,
          error: "All fields are required",
        };
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Signup failed",
        };
      }

      // Save token and user to AsyncStorage
      try {
        await AsyncStorage.setItem("authToken", data.token);
        await AsyncStorage.setItem("authUser", JSON.stringify(data.user));
      } catch (storageError) {
        console.error("Storage error:", storageError);
        return {
          success: false,
          error: "Failed to save credentials",
        };
      }

      // Update state
      setToken(data.token);
      setUser(data.user);

      // Navigate to home after successful signup
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 100);

      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        error: error.message || "Signup failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);

      // Validate inputs
      if (!email || !password) {
        return {
          success: false,
          error: "Email and password are required",
        };
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Login failed",
        };
      }

      // Save token and user to AsyncStorage
      try {
        await AsyncStorage.setItem("authToken", data.token);
        await AsyncStorage.setItem("authUser", JSON.stringify(data.user));
      } catch (storageError) {
        console.error("Storage error:", storageError);
        return {
          success: false,
          error: "Failed to save credentials",
        };
      }

      // Update state
      setToken(data.token);
      setUser(data.user);

      // Navigate to home after successful login
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 100);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Remove token and user from AsyncStorage
      try {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("authUser");
      } catch (storageError) {
        console.error("Storage error:", storageError);
      }

      // Clear state
      setToken(null);
      setUser(null);

      // Navigate to login after logout
      setTimeout(() => {
        router.replace("/(auth)");
      }, 100);

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear state even if something fails
      setToken(null);
      setUser(null);
      return {
        success: false,
        error: error.message || "Logout failed",
      };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Determine if user is authenticated
  const isSignedIn = !!token && !!user;

  const value = {
    user,
    token,
    isLoading,
    isCheckingAuth,
    isSignedIn,
    signup,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
