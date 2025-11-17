import {useAppState} from '@/lib/store';
import {Rendition} from 'epubjs';
import {useCallback, useEffect, useRef, useState} from 'react';
import {ReactReader, ReactReaderStyle, type IReactReaderStyle} from 'react-reader';
import {useNavigate, useSearchParams} from 'react-router';
import {Button} from '@/components/ui/button';
import {Moon, Sun} from 'lucide-react';

function Reader() {
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [searchParams] = useSearchParams();

    const [location, setLocation] = useState<string | number>(0);
    const [bookUrl, setBookUrl] = useState<string | ArrayBuffer>('');
    const [isLoading, setIsLoading] = useState(true);
    const rendition = useRef<Rendition | undefined>(undefined);
    const [locationsReady, setLocationsReady] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const toc = useRef<any[]>([]);
    const {books, token, syncBookProgress, theme, toggleTheme} = useAppState();

    const url: string = searchParams.get('url') || "";
    const bookId: string = searchParams.get('bookId') || "";
    const title: string = searchParams.get('title') || "";

    // Calculate progress percentage
    const calculateProgress = useCallback((location: string | number): number => {
        if (!rendition.current || typeof location !== 'string') return 0;

        try {
            const parts = location.split('/');
            if (parts.length >= 2) {
                const current = parseInt(parts[1]);
                const total = parseInt(parts[2]);
                if (total > 0) {
                    return Math.round((current / total) * 100);
                }
            }
        } catch {
            return 0;
        }
        return 0;
    }, []);

    const updateTheme = (rendition: Rendition, theme: 'light' | 'dark') => {
        const themes = rendition.themes;
        switch (theme) {
            case 'dark': {
                themes.override('color', '#fff');
                themes.override('background', '#1a1a1a');
                break;
            }
            case 'light': {
                themes.override('color', '#000');
                themes.override('background', '#fff');
                break;
            }
        }
    };

    const lightReaderTheme: IReactReaderStyle = {
        ...ReactReaderStyle,
        readerArea: {
            ...ReactReaderStyle.readerArea,
            transition: undefined,
        },
    };

    const darkReaderTheme: IReactReaderStyle = {
        ...ReactReaderStyle,
        arrow: {
            ...ReactReaderStyle.arrow,
            color: 'white',
        },
        arrowHover: {
            ...ReactReaderStyle.arrowHover,
            color: '#ccc',
        },
        readerArea: {
            ...ReactReaderStyle.readerArea,
            backgroundColor: '#1a1a1a',
            transition: undefined,
        },
        titleArea: {
            ...ReactReaderStyle.titleArea,
            color: '#ccc',
        },
        tocArea: {
            ...ReactReaderStyle.tocArea,
            background: '#111',
        },
        tocButtonExpanded: {
            ...ReactReaderStyle.tocButtonExpanded,
            background: '#222',
        },
        tocButtonBar: {
            ...ReactReaderStyle.tocButtonBar,
            background: '#fff',
        },
        tocButton: {
            ...ReactReaderStyle.tocButton,
            color: 'white',
        },
    };

    const handlePrev = () => {
        if (rendition.current) {
            rendition.current.prev();
        }
    };

    const handleNext = () => {
        if (rendition.current) {
            rendition.current.next();
        }
    };

    // Fetch the book with authentication if bookId is provided
    useEffect(() => {
        if (url) {
            // If URL is provided directly, use it
            setBookUrl(url);
            setIsLoading(false);
        } else if (bookId && token) {
            const fetchBook = async () => {
                try {
                    const id = parseInt(bookId);
                    const book = books.filter(b => b.id == id).at(0);
                    if (!book)
                        throw new Error("Failed to find book progress");
                    setProgress(Number(book.progress));

                    const response = await fetch(`https://localhost:55942/api/books/download/${bookId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch book: ${response.statusText}`);
                    }

                    const blob = await response.blob();
                    setBookUrl(blob as unknown as ArrayBuffer);
                } catch (error) {
                    console.error('Error fetching book:', error);
                    setBookUrl('');
                } finally {
                    setIsLoading(false);
                }
            };

            fetchBook().then(res => console.log("ok: ", res))
                .catch(error => console.log(error));
        } else {
            setIsLoading(false);
        }
    }, [bookId, token, url, books]);

    // Restore progress when locations are ready
    useEffect(() => {
        if (!locationsReady || !bookId || progress <= 0 || !rendition.current?.book) return;
        try {
            const book = rendition.current.book;
            const cfi: string | number = book.locations.cfiFromPercentage(progress / 100);
            // @ts-ignore
            if (cfi !== -1) {
                rendition.current.display(cfi);
                setLocation(cfi);
            }
        } catch (error) {
            console.error('Error restoring progress:', error);
        }
    }, [locationsReady, bookId, progress]);

    useEffect(() => {
        if (rendition.current) {
            updateTheme(rendition.current, theme);
        }
    }, [theme]);

    return (<>
        <div className="relative w-screen h-screen" >
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <p>Loading book...</p>
                </div>
            ) : (bookUrl ? (
                <ReactReader
                    // url="https://react-reader.metabits.no/files/alice.epub"
                    url={bookUrl}
                    title={title}
                    location={location}
                    tocChanged={(l) => toc.current = l}
                    showToc={true}
                    pageTurnOnScroll={true}
                    readerStyles={theme === 'dark' ? darkReaderTheme : lightReaderTheme}
                    locationChanged={(loc: string) => {
                        setLocation(loc)
                        if (rendition.current && toc.current) {
                            const {displayed, href} = rendition.current.location.start
                            setCurrentPage(displayed.page);
                            setTotalPages(displayed.total);

                            // Calculate and save progress based on book spine
                            let progress = 0;
                            if (rendition.current.book && rendition.current.book.spine) {
                                const spine = (rendition.current.book.spine as any).spineItems;
                                const currentIndex = spine.findIndex((item: any) => item.href === href);
                                const totalItems = spine.length;
                                if (totalItems > 0) {
                                    // Calculate progress as percentage through the book
                                    progress = Math.round(((currentIndex + 1) / totalItems) * 100);
                                }
                            }
                            if (progress === 0) {
                                // Fallback to old calculation if spine not available
                                progress = calculateProgress(loc);
                            }
                            if (locationsReady) {
                                console.log("progress is: ", progress);
                                setProgress(progress);
                                syncBookProgress(parseInt(bookId), progress)
                                    .catch(err => console.log(err));
                            }
                        }
                    }}
                    getRendition={(r: Rendition) => {
                        rendition.current = r;
                        updateTheme(r, theme);
                        r.book.locations.generate(1500).then(() => setLocationsReady(true));
                    }}

                />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p>Error loading book. Please try again.</p>
                </div>
            ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 flex justify-between items-center p-1 bg-white border-t z-20 dark:bg-gray-900 dark:border-gray-700">
            <div className="flex items-center space-x-2">
                <Button size="sm" onClick={() => navigate('/library')}>Back to Library</Button>
                <Button size="sm" variant="ghost" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
            </div>
            <div className="flex items-center space-x-2">
                <Button size="sm" onClick={handlePrev} disabled={currentPage <= 1}>Previous</Button>
                <span className="text-sm dark:text-white">Page {currentPage} of {totalPages}</span>
                <Button size="sm" onClick={handleNext} disabled={currentPage >= totalPages}>Next</Button>
            </div>
        </div>
    </>
    )
}



export default Reader
