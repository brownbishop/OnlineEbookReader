import {Rendition} from 'epubjs';
import {useEffect, useRef, useState} from 'react';
import {ReactReader} from 'react-reader';
import {useSearchParams} from 'react-router';
import {useAppState} from '@/lib/store';

function Reader() {
    const [searchParams, _setSearchParams] = useSearchParams();
    const [page, setPage] = useState('');
    const [location, setLocation] = useState<string | number>(0);
    const [bookUrl, setBookUrl] = useState<string | ArrayBuffer>('');
    const [isLoading, setIsLoading] = useState(true);
    const rendition = useRef<Rendition | undefined>(undefined);
    const toc = useRef<any[]>([]);
    const {token} = useAppState();

    const url: string = searchParams.get('url') || "";
    const bookId: string = searchParams.get('bookId') || "";
    const title: string = searchParams.get('title') || "";

    // Fetch the book with authentication if bookId is provided
    useEffect(() => {
        if (url) {
            // If URL is provided directly, use it
            setBookUrl(url);
            setIsLoading(false);
        } else if (bookId && token) {
            // If bookId is provided, fetch from the server with JWT
            const fetchBook = async () => {
                try {
                    const response = await fetch(`https://localhost:55942/api/books/download/${bookId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch book: ${response.statusText}`);
                    }

                    // Get the blob and create a URL from it
                    const blob = await response.blob();
                    setBookUrl(blob as unknown as ArrayBuffer);
                } catch (error) {
                    console.error('Error fetching book:', error);
                    setBookUrl('');
                } finally {
                    setIsLoading(false);
                }
            };

            fetchBook().then(res => console.log(res))
                .catch(error => console.log(error));
        } else {
            setIsLoading(false);
        }
    }, [bookId, token, url]);

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
                        }
                    }}
                    getRendition={(r: Rendition) => {
                        rendition.current = r
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
