import {create} from 'zustand';

export interface Book {
    id: number;
    title: string;
    author: string;
    description: string;
    coverImageUrl: string;
    fileUrl: string;
    progress: string;
}

interface AppState {
    // Auth state
    token: string;
    setToken: (token: string) => void;
    currentUser: string;
    setCurrentUser: (user: string) => void;

    // Books state
    books: Book[];
    currentBook: Book | null;
    isLoading: boolean;
    error: string | null;

    // Books actions
    setBooks: (books: Book[]) => void;
    addBook: (book: Book) => void;
    updateBook: (id: number, updates: Partial<Book>) => void;
    removeBook: (id: number) => void;
    setCurrentBook: (book: Book | null) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Async actions
    fetchBooks: () => Promise<void>;
    fetchBookById: (id: number) => Promise<void>;
    syncBookProgress: (id: number, progress: string) => Promise<void>;
    uploadBook: (file: File) => Promise<Book>;
}

export const useAppState = create<AppState>()((set, get) => ({
    // Auth state
    token: '',
    setToken: (token: string) => set(() => ({ token })),
    currentUser: '',
    setCurrentUser: (user: string) => set(() => ({ currentUser: user })),

    // Books state
    books: [],
    currentBook: null,
    isLoading: false,
    error: null,

    // Books sync actions
    setBooks: (books: Book[]) => set(() => ({ books })),
    addBook: (book: Book) => set((state) => ({ books: [...state.books, book] })),
    updateBook: (id: number, updates: Partial<Book>) => set((state) => ({
        books: state.books.map((book) => book.id === id ? { ...book, ...updates } : book),
        currentBook: state.currentBook?.id === id ? { ...state.currentBook, ...updates } : state.currentBook,
    })),
    removeBook: (id: number) => set((state) => ({
        books: state.books.filter((book) => book.id !== id),
        currentBook: state.currentBook?.id === id ? null : state.currentBook,
    })),
    setCurrentBook: (book: Book | null) => set(() => ({ currentBook: book })),
    setIsLoading: (loading: boolean) => set(() => ({ isLoading: loading })),
    setError: (error: string | null) => set(() => ({ error })),

    // Async actions
    fetchBooks: async () => {
        const state = get();
        if (!state.token) {
            set(() => ({ error: 'No auth token available' }));
            return;
        }

        set(() => ({ isLoading: true, error: null }));
        try {
            const response = await fetch('https://localhost:55942/api/books', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${state.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch books: ${response.statusText}`);
            }

            const books: Book[] = await response.json();
            set(() => ({ books, isLoading: false }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set(() => ({ error: errorMessage, isLoading: false }));
        }
    },

    fetchBookById: async (id: number) => {
        const state = get();
        if (!state.token) {
            set(() => ({ error: 'No auth token available' }));
            return;
        }

        set(() => ({ isLoading: true, error: null }));
        try {
            const response = await fetch(`https://localhost:55942/api/books/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${state.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch book: ${response.statusText}`);
            }

            const book: Book = await response.json();
            set((state) => ({
                currentBook: book,
                books: state.books.some(b => b.id === id)
                    ? state.books.map(b => b.id === id ? book : b)
                    : [...state.books, book],
                isLoading: false,
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set(() => ({ error: errorMessage, isLoading: false }));
        }
    },

    syncBookProgress: async (id: number, progress: string) => {
        const state = get();
        if (!state.token) {
            set(() => ({ error: 'No auth token available' }));
            return;
        }

        // Optimistic update
        set((state) => ({
            books: state.books.map((book) => book.id === id ? { ...book, progress } : book),
            currentBook: state.currentBook?.id === id ? { ...state.currentBook, progress } : state.currentBook,
        }));

        try {
            const response = await fetch(`https://localhost:55942/api/books/${id}/progress`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ progress }),
            });

            if (!response.ok) {
                throw new Error(`Failed to sync progress: ${response.statusText}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set(() => ({ error: errorMessage }));
            // Note: We keep the optimistic update; you could revert it here if needed
        }
    },

    uploadBook: async (file: File) => {
        const state = get();
        if (!state.token) {
            throw new Error('No auth token available');
        }

        set(() => ({ isLoading: true, error: null }));
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('https://localhost:55942/api/books/Upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Failed to upload book: ${response.statusText}`);
            }

            // Refetch books to get the newly uploaded book
            await get().fetchBooks();
            set(() => ({ isLoading: false }));

            // Return the book if available from the response
            const data = await response.json();
            return data as Book;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set(() => ({ error: errorMessage, isLoading: false }));
            throw error;
        }
    },
}));
