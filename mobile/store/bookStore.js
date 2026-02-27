import { create } from "zustand";
import { API_URL } from "../constants/api";

export const useBookStore = create((set, get) => ({
  // All books for home page
  books: [],
  booksLoading: false,
  booksPage: 1,
  booksHasMore: true,
  booksRefreshing: false,

  // User's books for profile page
  userBooks: [],
  userBooksLoading: false,

  // Track which books are being deleted (for UI feedback)
  deletingBookIds: new Set(),

  // Fetch all books with pagination
  fetchBooks: async (pageNum = 1, token, refresh = false) => {
    try {
      if (refresh) set({ booksRefreshing: true });
      else if (pageNum === 1) set({ booksLoading: true });

      const response = await fetch(`${API_URL}/books?page=${pageNum}&limit=2`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch books");

      const { books: currentBooks } = get();
      const uniqueBooks =
        refresh || pageNum === 1
          ? data.books
          : Array.from(new Set([...currentBooks, ...data.books].map((book) => book._id))).map(
              (id) => [...currentBooks, ...data.books].find((book) => book._id === id)
            );

      set({
        books: uniqueBooks,
        booksHasMore: pageNum < data.totalPages,
        booksPage: pageNum,
      });
    } catch (error) {
      console.log("Error fetching books", error);
      throw error;
    } finally {
      set({ booksLoading: false, booksRefreshing: false });
    }
  },

  // Add a new book optimistically - called immediately when user submits
  addBookOptimistic: (optimisticBook) => {
    set((state) => ({
      books: [optimisticBook, ...state.books],
      userBooks: [optimisticBook, ...state.userBooks],
    }));
    // Return the optimistic book ID for later reference
    return optimisticBook._id;
  },

  // Replace optimistic book with confirmed book from server
  confirmBook: (optimisticId, confirmedBook) => {
    set((state) => ({
      books: state.books.map((book) => (book._id === optimisticId ? confirmedBook : book)),
      userBooks: state.userBooks.map((book) => (book._id === optimisticId ? confirmedBook : book)),
    }));
  },

  // Remove optimistic book if API fails
  removeOptimisticBook: (bookId) => {
    set((state) => ({
      books: state.books.filter((book) => book._id !== bookId),
      userBooks: state.userBooks.filter((book) => book._id !== bookId),
    }));
  },

  // Delete a book optimistically from the store
  deleteBookOptimistic: (bookId) => {
    set((state) => ({
      books: state.books.filter((book) => book._id !== bookId),
      userBooks: state.userBooks.filter((book) => book._id !== bookId),
      deletingBookIds: new Set([...state.deletingBookIds, bookId]),
    }));
  },

  // Restore book if delete API fails
  restoreBook: (book) => {
    set((state) => ({
      books: [book, ...state.books],
      userBooks: [book, ...state.userBooks],
      deletingBookIds: new Set([...state.deletingBookIds].filter((id) => id !== book._id)),
    }));
  },

  // Remove deleting indicator after successful deletion
  confirmDelete: (bookId) => {
    set((state) => ({
      deletingBookIds: new Set([...state.deletingBookIds].filter((id) => id !== bookId)),
    }));
  },

  // Fetch user's books
  fetchUserBooks: async (token) => {
    try {
      set({ userBooksLoading: true });

      const response = await fetch(`${API_URL}/books/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch user books");

      set({ userBooks: data });
    } catch (error) {
      console.error("Error fetching user books:", error);
      throw error;
    } finally {
      set({ userBooksLoading: false });
    }
  },

  // Legacy function for backward compatibility
  deleteBook: (bookId) => {
    set((state) => ({
      books: state.books.filter((book) => book._id !== bookId),
      userBooks: state.userBooks.filter((book) => book._id !== bookId),
    }));
  },

  // Reset all books
  resetBooks: () => {
    set({
      books: [],
      booksPage: 1,
      booksHasMore: true,
      userBooks: [],
      deletingBookIds: new Set(),
    });
  },
}));
