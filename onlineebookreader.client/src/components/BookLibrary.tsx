import { useEffect, useState, useMemo, useRef } from 'react';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar01, type Navbar01Props, Logo } from '@/components/Navbar';
import { Trash2 } from 'lucide-react';

export default function BookLibrary() {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        books,
        isLoading,
        error,
        fetchBooks,
        setCurrentBook,
        token,
        currentUser,
        logout,
        initializeAuth,
        deleteBook,
    } = useAppState();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterBy, setFilterBy] = useState<'all' | 'reading' | 'completed'>('all');
    const [coverImageUrls, setCoverImageUrls] = useState<Record<number, string>>({});
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const blobUrlsRef = useRef<Record<number, string>>({});

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        fetchBooks();
    }, [location.pathname, fetchBooks]);

    // Fetch cover images with JWT authentication
    useEffect(() => {
        if (!token || books.length === 0) return;

        const fetchCoverImages = async () => {
            const newCoverUrls: Record<number, string> = {};
            const newBlobUrls: Record<number, string> = {};

            // Clean up old blob URLs
            Object.values(blobUrlsRef.current).forEach(url => {
                URL.revokeObjectURL(url);
            });
            blobUrlsRef.current = {};

            // Fetch images for books that have coverImageUrl
            const booksWithCovers = books.filter(book => book.coverImageUrl);

            await Promise.all(
                booksWithCovers.map(async (book) => {
                    try {
                        const response = await fetch(
                            `https://localhost:55942/api/books/downloadcover/${book.id}`,
                            {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            }
                        );

                        if (response.ok) {
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            newCoverUrls[book.id] = blobUrl;
                            newBlobUrls[book.id] = blobUrl;
                        }
                    } catch (error) {
                        console.error(`Failed to fetch cover for book ${book.id}:`, error);
                    }
                })
            );

            blobUrlsRef.current = newBlobUrls;
            setCoverImageUrls(newCoverUrls);
        };

        fetchCoverImages().then().catch();

        // Cleanup function to revoke blob URLs when component unmounts
        return () => {
            Object.values(blobUrlsRef.current).forEach(url => {
                URL.revokeObjectURL(url);
            });
            blobUrlsRef.current = {};
        };
    }, [books, token]);

    // Filter and search books
    const filteredBooks = useMemo(() => {
        return books.filter((book) => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                book.title.toLowerCase().includes(searchLower) ||
                book.author.toLowerCase().includes(searchLower) ||
                book.description.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // Status filter
            if (filterBy === 'reading') {
                return book.progress && book.progress > 0 && book.progress < 100;
            }
            if (filterBy === 'completed') {
                return book.progress && book.progress === 100;
            }

            return true;
        });
    }, [books, searchQuery, filterBy]);

    const handleReadBook = (bookId: number) => {
        const book = books.find(b => b.id === bookId);
        if (book) {
            setCurrentBook(book);
            // Navigate to reader with book ID for JWT authentication
            navigate(`/reader?bookId=${bookId}&title=${encodeURIComponent(book.title)}`);
        }
    };

    const handleDeleteBook = async (bookId: number) => {
        try {
            await deleteBook(bookId);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete book:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-muted-foreground">Loading your books...</p>
            </div>
        );
    }

    const navbarProps: Navbar01Props = {
        logo: <Logo />,
        signInText: "Sign in",
        ctaText: "Log in",
        onSignInClick: () => navigate("/signin"),
        onCtaClick: () => navigate("/login"),
        currentUser: currentUser || null,
        onLogout: () => {
            logout();
            navigate("/");
        },
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => fetchBooks()} variant="outline">
                            Retry
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (books.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>No Books Found</CardTitle>
                        <CardDescription>
                            You haven't uploaded any books yet. Start by uploading your first ebook!
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={() => navigate('/upload')} className="w-full">
                            Upload a Book
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <>
            <Navbar01 {...navbarProps} />
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">My Books</h1>
                        <p className="text-muted-foreground">
                            You have {books.length} book{books.length !== 1 ? 's' : ''} in your library
                        </p>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="mb-8 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    type="text"
                                    placeholder="Search by title, author, or description..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <Button
                                onClick={() => navigate('/upload')}
                                className="whitespace-nowrap"
                            >
                                + Upload Book
                            </Button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={filterBy === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilterBy('all')}
                                size="sm"
                            >
                                All Books {books.length > 0 && `(${books.length})`}
                            </Button>
                            <Button
                                variant={filterBy === 'reading' ? 'default' : 'outline'}
                                onClick={() => setFilterBy('reading')}
                                size="sm"
                            >
                                Currently Reading (
                                {books.filter(b => b.progress && b.progress > 0 && b.progress < 100).length}
                                )
                            </Button>
                            <Button
                                variant={filterBy === 'completed' ? 'default' : 'outline'}
                                onClick={() => setFilterBy('completed')}
                                size="sm"
                            >
                                Completed (
                                {books.filter(b => b.progress && b.progress === 100).length}
                                )
                            </Button>
                        </div>

                        {/* Search Results Info */}
                        {searchQuery && (
                            <div className="text-sm text-muted-foreground">
                                Found {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} matching "{searchQuery}"
                            </div>
                        )}
                    </div>

                    {/* No results state */}
                    {filteredBooks.length === 0 ? (
                        <div className="flex items-center justify-center py-16">
                            <Card className="w-full max-w-md">
                                <CardHeader>
                                    <CardTitle>No Books Found</CardTitle>
                                    <CardDescription>
                                        {searchQuery
                                            ? `No books match your search: "${searchQuery}"`
                                            : 'No books match your filter criteria'}
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setFilterBy('all');
                                        }}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Clear Filters
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredBooks.map((book) => (
                                <Card key={book.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                                    {/* Book Cover */}
                                    <div className="relative h-48 bg-muted overflow-hidden">
                                        {book.coverImageUrl && coverImageUrls[book.id] ? (
                                            <img
                                                src={coverImageUrls[book.id]}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                                <span className="text-sm text-muted-foreground text-center px-4">
                                                    No Cover Available
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Book Info */}
                                    <CardHeader className="flex-1">
                                        <CardTitle className="line-clamp-2 text-lg">{book.title}</CardTitle>
                                        <CardDescription className="line-clamp-1">
                                            {book.author || 'Unknown Author'}
                                        </CardDescription>
                                    </CardHeader>

                                    {/* Book Description */}
                                    <CardContent className="flex-1">
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {book.description || 'No description available'}
                                        </p>
                                    </CardContent>

                                    {/* Progress Bar and Actions */}
                                    <CardFooter className="flex flex-col gap-3">
                                        {book.progress && (
                                            <div className="w-full">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs text-muted-foreground">Progress</span>
                                                    <span className="text-xs font-semibold">{book.progress}%</span>
                                                </div>
                                                <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-2">
                                                    <div
                                                        className="bg-amber-700 rounded-full h-2 transition-all"
                                                        style={{
                                                            width: `${Math.min(book.progress || 0, 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {deleteConfirm === book.id ? (
                                            <div className="w-full space-y-2">
                                                <p className="text-sm font-medium text-destructive">Delete this book?</p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => handleDeleteBook(book.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => setDeleteConfirm(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleReadBook(book.id)}
                                                    className="flex-1"
                                                >
                                                    {book.progress ? 'Continue Reading' : 'Start Reading'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setDeleteConfirm(book.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
