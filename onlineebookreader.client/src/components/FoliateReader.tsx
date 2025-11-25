import { useAppState } from '@/lib/store';
import React, { useState, useEffect, useRef } from 'react';
import { Reader, ReaderContent, ReaderNext, ReaderPrevious, loadEPUB, type Book, useSearch, useBookNavigator } from 'react-ebookjs'

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { delay } from 'lodash';
import ChatComponent from './ChatComponent';

function FoliateReader() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [isLoading, setIsLoading] = useState(true);
    const { books, token, syncBookProgress, theme, toggleTheme } = useAppState();
    const [book, setBook] = useState<Book | null>(null);
    const [epubData, setEpubData] = useState<Blob | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reader settings
    const [fontSize, setFontSize] = useState(16);
    const [lineSpacing, setLineSpacing] = useState(1.5);
    const [justify, setJustify] = useState(true);
    const [hyphenate, setHyphenate] = useState(true);
    const [flow, setFlow] = useState<"paginated" | "scrolled">("paginated");
    const [progress, setProgress] = useState(0);
    const [initialProgress, setInitialProgress] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showTOC, setShowTOC] = useState(false);


    const url: string = searchParams.get('url') || "";
    const bookId: string = searchParams.get('bookId') || "";
    const title: string = searchParams.get('title') || "";

    // Theme-based colors
    const bgPrimary = () => theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
    const bgSecondary = () => theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100';
    const bgTertiary = () => theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-50';
    const textPrimary = () => theme === 'dark' ? 'text-white' : 'text-black';
    const textSecondary = () => theme === 'dark' ? 'text-zinc-400' : 'text-gray-600';
    const borderColor = () => theme === 'dark' ? 'border-zinc-700' : 'border-gray-300';
    const bgSearchBox = () => theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200';
    const bgSearchInput = () => theme === 'dark' ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-300';
    const bgTOCBox = () => theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100';
    const bgNavBar = () => theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100';
    const bgSlider = () => theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-300';

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setEpubData(file);
            const loadedBook = await loadEPUB(file);
            setBook(loadedBook);
        } catch (error) {
            console.error('Error loading EPUB:', error);
            alert('Failed to load EPUB file. Please try another file.');
        }
    };

    // Fetch the book with authentication if bookId is provided
    useEffect(() => {
        if (bookId && token) {
            const fetchBook = async () => {
                try {
                    const id = parseInt(bookId);
                    const book = books.filter(b => b.id == id).at(0);
                    if (!book)
                        throw new Error("Failed to find book progress");
                    setProgress(Number(book.progress) / 100);
                    setInitialProgress(Number(book.progress) / 100);


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
                    setEpubData(blob);
                    const epubFile = await loadEPUB(blob);
                    setBook(epubFile);
                } catch (error) {
                    console.error('Error fetching book:', error);
                    setBook(null);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchBook().then(res => console.log("ok: ", res))
                .catch(error => console.error(error));
        } else {
            console.error('Error no book provided');
            setIsLoading(false);
        }
    }, [bookId, token, url]);

    useEffect(() => {
        delay(() => setProgress(initialProgress), 300);
        console.log("once");
    }, [initialProgress]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };


    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        const file = event.dataTransfer.files?.[0];
        if (!file) return;

        try {
            setEpubData(file);
            const loadedBook = await loadEPUB(file);
            setBook(loadedBook);
        } catch (error) {
            console.error('Error loading EPUB:', error);
            alert('Failed to load EPUB file. Please try another file.');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`flex flex-col h-screen ${bgPrimary()} ${textPrimary()} px-0`}>
            {!book ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div
                        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed ${borderColor} rounded-lg cursor-pointer transition-colors hover:border-indigo-500`}
                        onClick={triggerFileInput}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <h2 className="text-2xl font-semibold mb-2">Upload EPUB</h2>
                        <p className={textSecondary()}>Click to browse or drag and drop an EPUB file here</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".epub"
                            className="hidden"
                        />
                    </div>
                </div>
            ) : (
                <>
                    <div className={`flex flex-wrap justify-center gap-3 mb-0 p-2 ${bgSecondary}`}>
                        <div className="flex flex-col items-center gap-1">
                            <label className={`text-xs ${textSecondary()}`}>Font Size</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                                    className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center ${bgTertiary()} rounded-lg border border-transparent transition-colors hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                >
                                    A-
                                </button>
                                <span className="min-w-12 text-center text-sm">{fontSize}px</span>
                                <button
                                    onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                                    className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center ${bgTertiary()} rounded-lg border border-transparent transition-colors hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                >
                                    A+
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <label className={`text-xs ${textSecondary()}`}>Line Spacing</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setLineSpacing(Math.max(1.0, lineSpacing - 0.1))}
                                    className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center ${bgTertiary()} rounded-lg border border-transparent transition-colors hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                >
                                    -
                                </button>
                                <span className="min-w-12 text-center text-sm">{lineSpacing.toFixed(1)}</span>
                                <button
                                    onClick={() => setLineSpacing(Math.min(2.0, lineSpacing + 0.1))}
                                    className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center ${bgTertiary()} rounded-lg border border-transparent transition-colors hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <label className="text-xs text-amber-500">Text</label>
                            <div className="flex items-center gap-2">
                                <button
                                    title="Justified Text"
                                    className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${justify ? 'bg-amber-600 text-white border-amber-600' : `${bgTertiary()} border-transparent hover:border-amber-500`
                                        }`}
                                    onClick={() => setJustify(true)}
                                >
                                    <span className="text-xl">⟷</span>
                                </button>
                                <button
                                    title="Left Aligned Text"
                                    className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${!justify ? 'bg-amber-600 text-white border-amber-600' : `${bgTertiary()} border-transparent hover:border-amber-500`
                                        }`}
                                    onClick={() => setJustify(false)}
                                >
                                    <span className="text-xl">⟵</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <label className="text-xs text-amber-500">Hyphenation</label>
                            <button
                                className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${hyphenate ? 'bg-amber-600 text-white border-amber-600' : `${bgTertiary()} border-transparent hover:border-amber-500`
                                    }`}
                                onClick={() => setHyphenate(!hyphenate)}
                            >
                                {hyphenate ? 'On' : 'Off'}
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <label className="text-xs text-amber-500">View Mode</label>
                            <div className="flex items-center gap-2">
                                <button
                                    title="Paginated View"
                                    className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${flow === 'paginated' ? 'bg-amber-600 text-white border-amber-600' : `${bgTertiary()} border-transparent hover:border-amber-500`
                                        }`}
                                    onClick={() => setFlow('paginated')}
                                >
                                    <span className="text-xl">⊞</span>
                                </button>
                                <button
                                    title="Scrolled View"
                                    className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${flow === 'scrolled' ? 'bg-amber-600 text-white border-amber-600' : `${bgTertiary()} border-transparent hover:border-amber-500`
                                        }`}
                                    onClick={() => setFlow('scrolled')}
                                >
                                    <span className="text-xl">≡</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <label className={`text-xs ${textSecondary()}`}>Search</label>
                            <button
                                title="Toggle Search"
                                className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${showSearch ? 'bg-indigo-600 text-white border-indigo-600' : `${bgTertiary()} border-transparent hover:border-indigo-500`
                                    }`}
                                onClick={() => {
                                    setShowSearch(!showSearch);
                                    if (showTOC) setShowTOC(false);
                                }}
                            >
                                <span className="text-xl">🔍</span>
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-0">
                            <label className="text-xs text-amber-500">Contents</label>
                            <button
                                title="Toggle Table of Contents"
                                className={`px-3 py-2 min-w-10 h-10 flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${showTOC ? 'bg-amber-600 text-white border-amber-600' : `${bgTertiary()} border-transparent hover:border-amber-500`
                                    }`}
                                onClick={() => {
                                    setShowTOC(!showTOC);
                                    if (showSearch) setShowSearch(false);
                                }}
                            >
                                <span className="text-xl">≡</span>
                            </button>
                        </div>


                        <div className="flex flex-col items-center gap-0">

                            <label className="text-xs text-amber-500">Theme</label>
                            <Button size="sm" variant="ghost" onClick={toggleTheme}>
                                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Reader
                            book={book}
                            progress={progress}
                            onProgressChange={(prog: number) => {
                                setProgress(prog);
                                if (!isLoading) {
                                    const p = Math.round(prog * 100);
                                    syncBookProgress(parseInt(bookId), p)
                                        .catch(err => console.error(err));
                                }
                            }}
                        >
                            {showSearch && (
                                <div className={`mb-4 p-4 ${bgSearchBox()} rounded-lg flex flex-col gap-4`}>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search in book..."
                                        className={`w-full px-4 py-3 text-base rounded ${bgSearchInput()} text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                    />
                                    <SearchResults query={searchQuery} theme={theme} />
                                </div>
                            )}

                            {showTOC && (
                                <div className={`relative z-10 mb-5 max-h-80 overflow-y-auto p-4 ${bgTOCBox()} rounded-lg shadow-lg`}>
                                    <h3 className={`text-lg font-semibold mt-0 mb-4 pb-2 border-b ${borderColor()}`}>Table of Contents</h3>
                                    <TableOfContents toc={book.toc} />
                                </div>
                            )}

                            <div className={`flex-1 w-full ${textPrimary()} overflow-auto`}>
                                <ReaderContent
                                    fontSize={fontSize}
                                    lineSpacing={lineSpacing}
                                    justify={justify}
                                    hyphenate={hyphenate}
                                    flow={flow}
                                />
                            </div>

                            <div className={`flex justify-center items-center gap-2 mt-0 mb-0 p-3 ${bgNavBar()} flex-shrink-0`}>
                                <ReaderPrevious className={`px-4 py-2 ${bgTertiary()} rounded-lg border border-transparent transition-colors hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm flex-shrink-0`}>
                                    Previous Page
                                </ReaderPrevious>
                                <div className="flex flex-col items-center flex-1 min-w-0">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.001"
                                        value={progress}
                                        onChange={(e) => setProgress(parseFloat(e.target.value))}
                                        className={`w-full h-2 mb-1 ${bgSlider()} rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0`}
                                        title={`${Math.round(progress * 100)}%`}
                                    />
                                    <div className="text-xs opacity-80">{Math.round(progress * 100)}%</div>
                                </div>
                                <ReaderNext className={`px-4 py-2 ${bgTertiary} rounded-lg border border-transparent transition-colors hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm flex-shrink-0`}>
                                    Next Page
                                </ReaderNext>
                            </div>
                        </Reader>
                    </div>
                </>
            )}

            <ChatComponent epubData={epubData} />
        </div>
    );
}

// Search Results component to display search results
function SearchResults({ query, theme }: { query: string; theme: 'light' | 'dark' }) {
    const { loading, results } = useSearch(query);
    const { goTo } = useBookNavigator()

    const bgBox = theme === 'dark' ? 'bg-zinc-900' : 'bg-white';
    const borderClass = theme === 'dark' ? 'border-zinc-700' : 'border-gray-300';
    const hoverClass = theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-gray-100';

    const handleResultClick = async (result: any) => {
        await goTo(result.href)
    };

    if (!results) return null;

    return (
        <div className={`max-h-52 overflow-y-auto rounded ${bgBox}`}>
            {loading ? (
                <div className="p-4 text-center opacity-80">Searching...</div>
            ) : results.length > 0 ? (
                <div>
                    <div className={`px-4 py-2 font-bold border-b ${borderClass}`}>
                        Found {results.length} result{results.length !== 1 ? 's' : ''}
                    </div>
                    {results.map((result: any, index: number) => (
                        <div
                            key={index}
                            className={`px-4 py-3 border-b ${borderClass} last:border-b-0 cursor-pointer transition-colors ${hoverClass}`}
                            onClick={() => handleResultClick(result)}
                        >
                            {result.label || result}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-4 text-center opacity-80">No results found</div>
            )}
        </div>
    );
}

// Table of Contents component to display the book's table of contents
interface TableOfContentsProps {
    toc: Array<{
        label: string;
        href: string;
        subitems?: Array<{
            label: string;
            href: string;
            subitems?: any;
        }> | null;
    }>;
}

function TableOfContents({ toc }: TableOfContentsProps) {
    const { goTo } = useBookNavigator();

    const handleTOCItemClick = async (href: string) => {
        await goTo(href);
    };

    const renderTOCItems = (items: TableOfContentsProps['toc']) => {
        if (!items || items.length === 0) return null;

        return (
            <ul className="list-none m-0 p-0 pl-4 first:pl-0">
                {items.map((item, index) => (
                    <li key={index} className="mb-2">
                        <div
                            className="py-1 text-indigo-400 cursor-pointer transition-colors hover:text-indigo-300 hover:underline"
                            onClick={() => handleTOCItemClick(item.href)}
                        >
                            {item.label}
                        </div>
                        {item.subitems && renderTOCItems(item.subitems)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="text-sm">
            {renderTOCItems(toc)}
        </div>
    );
}

export default FoliateReader;
