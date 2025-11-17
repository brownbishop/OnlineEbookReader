import {useAppState} from '@/lib/store';
import {Rendition} from 'epubjs';
import {useCallback, useEffect, useRef, useState} from 'react';
import {ReactReader} from 'react-reader';
import {useSearchParams} from 'react-router';

function Reader() {
    const [progress, setProgress] = useState<number>(0);
    const [searchParams] = useSearchParams();
    const [page, setPage] = useState('');
    const [location, setLocation] = useState<string | number>(0);
    const [bookUrl, setBookUrl] = useState<string | ArrayBuffer>('');
    const [isLoading, setIsLoading] = useState(true);
    const rendition = useRef<Rendition | undefined>(undefined);
    const [locationsReady, setLocationsReady] = useState(false);
    const toc = useRef<any[]>([]);
    const {books, token, syncBookProgress} = useAppState();

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
        if (!locationsReady || !bookId || Number(progress) <= 0 || !rendition.current?.book) return;
        try {
            const book = rendition.current.book;
            const cfi: string | number = book.locations.cfiFromPercentage(progress / 100);
            if (cfi !== -1) {
                rendition.current.display(cfi);
                setLocation(cfi);
            }
        } catch (error) {
            console.error('Error restoring progress:', error);
        }
    }, [locationsReady, bookId, progress]);

    return (<>
        <div className="absolute top-0 right-0 z-10 text-black">
            <h3>{page}</h3>
        </div>

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
                    locationChanged={(loc: string) => {
                        setLocation(loc)
                        if (rendition.current && toc.current) {
                            const {displayed, href} = rendition.current.location.start
                            const chapter = toc.current.find((item) => item.href === href)
                            setPage(
                                `Page ${displayed.page} of ${displayed.total} in chapter ${chapter ? chapter.label : 'n/a'
                                }`
                            )

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
                        r.book.locations.generate(1500).then(() => setLocationsReady(true));
                    }}

                />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p>Error loading book. Please try again.</p>
                </div>
            ))}
        </div>
    </>
    )
}



export default Reader
