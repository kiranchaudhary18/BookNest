import { useEffect, useState } from "react";
import {
  View,
  Alert,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { API_URL } from "../../constants/api";
import { useAuth } from "../../context/AuthContext";
import { useBookStore } from "../../store/bookStore";
import styles from "../../assets/styles/profile.styles";
import ProfileHeader from "../../components/ProfileHeader";
import LogoutButton from "../../components/LogoutButton";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import { Image } from "expo-image";
import { sleep } from ".";
import Loader from "../../components/Loader";

export default function Profile() {
  const [refreshing, setRefreshing] = useState(false);

  const { token } = useAuth();
  const {
    userBooks: books,
    userBooksLoading: isLoading,
    fetchUserBooks,
    deleteBookOptimistic,
    restoreBook,
    confirmDelete,
    deletingBookIds,
  } = useBookStore();

  const router = useRouter();

  useEffect(() => {
    if (token) {
      fetchUserBooks(token);
    }
  }, [token]);

  const handleRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await fetchUserBooks(token);
      await sleep(800);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!token) {
      Alert.alert("Error", "No authentication token available");
      return;
    }

    try {
      // Find the book to restore if delete fails
      const bookToRestore = useBookStore.getState().userBooks.find((b) => b._id === bookId);

      if (!bookToRestore) {
        Alert.alert("Error", "Book not found");
        return;
      }

      // Delete from UI immediately (optimistic update)
      deleteBookOptimistic(bookId);

      // Make API call to delete from backend
      const response = await fetch(`${API_URL}/books/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete book");
      }

      // API succeeded - confirm the deletion
      confirmDelete(bookId);
      Alert.alert("Success", "Recommendation deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      
      // Restore the book to UI if delete failed
      const bookToRestore = useBookStore.getState().userBooks.find((b) => b._id === bookId);
      if (!bookToRestore && useBookStore.getState().books.some((b) => b._id === bookId)) {
        // Find it in the books array and restore
        const book = useBookStore.getState().books.find((b) => b._id === bookId);
        if (book) restoreBook(book);
      } else if (bookToRestore) {
        restoreBook(bookToRestore);
      }

      Alert.alert("Error", error.message || "Failed to delete recommendation");
    }
  };

  const confirmDeleteAction = (bookId) => {
    Alert.alert("Delete Recommendation", "Are you sure you want to delete this recommendation?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDeleteBook(bookId) },
    ]);
  };

  const renderBookItem = ({ item }) => (
    <View style={styles.bookItem}>
      <Image source={item.image} style={styles.bookImage} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>
        <Text style={styles.bookCaption} numberOfLines={2}>
          {item.caption}
        </Text>
        <Text style={styles.bookDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.deleteButton, deletingBookIds.has(item._id) && { opacity: 0.6 }]} 
        onPress={() => confirmDeleteAction(item._id)}
        disabled={deletingBookIds.has(item._id)}
      >
        {deletingBookIds.has(item._id) ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  if (isLoading && !refreshing) return <Loader />;

  return (
    <View style={styles.container}>
      <ProfileHeader />
      <LogoutButton />

      {/* YOUR RECOMMENDATIONS */}
      <View style={styles.booksHeader}>
        <Text style={styles.booksTitle}>Your Recommendations 📚</Text>
        <Text style={styles.booksCount}>{books.length} books</Text>
      </View>

      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={50} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
              <Text style={styles.addButtonText}>Add Your First Book</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
