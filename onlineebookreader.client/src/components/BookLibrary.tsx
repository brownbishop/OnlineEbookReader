import { useEffect, useState, useMemo } from 'react';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

export default function BookLibrary() {
    const navigate = useNavigate();
    const {
        books,
        isLoading,
        error,
        fetchBooks,
        setCurrentBook,
    } = useAppState();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterBy, setFilterBy] = useState<'all' | 'reading' | 'completed'>('all');

    useEffect(() => {
        fetchBooks();
    }, []);

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
                return book.progress && parseInt(book.progress) > 0 && parseInt(book.progress) < 100;
            }
            if (filterBy === 'completed') {
                return book.progress && parseInt(book.progress) === 100;
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-lg text-muted-foreground">Loading your books...</p>
            </div>
        );
    }

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
                            {books.filter(b => b.progress && parseInt(b.progress) > 0 && parseInt(b.progress) < 100).length}
                            )
                        </Button>
                        <Button
                            variant={filterBy === 'completed' ? 'default' : 'outline'}
                            onClick={() => setFilterBy('completed')}
                            size="sm"
                        >
                            Completed (
                            {books.filter(b => b.progress && parseInt(b.progress) === 100).length}
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
                                    {book.coverImageUrl ? (
                                        <img
                                            src={`https://localhost:55942/api/books/downloadcover/${book.id}`}
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
                                            <div className="w-full bg-secondary rounded-full h-2">
                                                <div
                                                    className="bg-primary rounded-full h-2 transition-all"
                                                    style={{
                                                        width: `${Math.min(parseInt(book.progress) || 0, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => handleReadBook(book.id)}
                                        className="w-full"
                                    >
                                        {book.progress ? 'Continue Reading' : 'Start Reading'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
