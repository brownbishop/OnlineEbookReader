import { useState, useEffect } from 'react';
import { DeepChat } from 'deep-chat-react';
import { X, MessageCircle } from 'lucide-react';
import { type Book, loadEPUB } from 'react-ebookjs';

interface FloatingChatProps {
    epubData?: Blob | null;
}

interface Section {
    createDocument: () => Promise<Document>;
}

// Extract all text from the entire book
async function extractAllTextFromBook(book: Book): Promise<string> {
    let allText = '';

    if (!book.sections) return '';

    for (const section of book.sections) {
        if (!section) continue;
        try {
            const text = await extractTextFromSection(section);
            allText += text + '\n\n';
        } catch (error) {
            console.error('Error processing section:', error);
        }
    }

    return allText;
}

// Extract text from a specific section
async function extractTextFromSection(section: Section): Promise<string> {
    try {
        const doc = await section.createDocument();
        const text = doc?.body?.innerText || '';
        return text;
    } catch (error) {
        console.error('Error extracting text from section:', error);
        return '';
    }
}

const getTheme = (isDark: boolean) => {
    const lightTheme = {
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userMessage: {
            bubble: {
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '10px 14px',
                maxWidth: '80%',
            },
            text: {
                fontSize: '15px',
            }
        },
        aiMessage: {
            bubble: {
                backgroundColor: '#f5f5f4',
                color: '#1c1917',
                borderRadius: '16px',
                padding: '10px 14px',
                maxWidth: '80%',
            },
            text: {
                fontSize: '15px',
            }
        },
        loading: {
            message: {
                styles: {
                    bubble: {
                        backgroundColor: '#f5f5f4',
                        borderRadius: '16px',
                        padding: '10px 14px',
                    }
                }
            }
        },
        textInput: {
            container: {
                backgroundColor: '#fafaf9',
                border: '2px solid #e7e5e4',
                borderRadius: '12px',
                padding: '8px 12px',
            },
            text: {
                color: '#1c1917',
                fontSize: '15px',
                placeholder: {
                    color: '#a8a29e',
                }
            },
            focus: {
                border: '2px solid #f59e0b',
            }
        },
        submitButton: {
            container: {
                default: {
                    backgroundColor: '#f59e0b',
                    borderRadius: '8px',
                    padding: '8px 12px',
                },
                hover: {
                    backgroundColor: '#d97706',
                },
                click: {
                    backgroundColor: '#b45309',
                }
            },
            svg: {
                content: '🚀',
                styles: {
                    default: {
                        filter: 'brightness(0) invert(1)',
                    }
                }
            }
        },
    };

    const darkTheme = {
        backgroundColor: '#0c0a09',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userMessage: {
            bubble: {
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '10px 14px',
                maxWidth: '80%',
            },
            text: {
                fontSize: '15px',
            }
        },
        aiMessage: {
            bubble: {
                backgroundColor: '#1c1917',
                color: '#fafaf9',
                borderRadius: '16px',
                padding: '10px 14px',
                maxWidth: '80%',
            },
            text: {
                fontSize: '15px',
            }
        },
        loading: {
            message: {
                styles: {
                    bubble: {
                        backgroundColor: '#1c1917',
                        borderRadius: '16px',
                        padding: '10px 14px',
                    }
                }
            }
        },
        textInput: {
            container: {
                backgroundColor: '#1c1917',
                border: '2px solid #292524',
                borderRadius: '12px',
                padding: '8px 12px',
            },
            text: {
                color: '#fafaf9',
                fontSize: '15px',
                placeholder: {
                    color: '#57534e',
                }
            },
            focus: {
                border: '2px solid #f59e0b',
            }
        },
        submitButton: {
            container: {
                default: {
                    backgroundColor: '#f59e0b',
                    borderRadius: '8px',
                    padding: '8px 12px',
                },
                hover: {
                    backgroundColor: '#d97706',
                },
                click: {
                    backgroundColor: '#b45309',
                }
            },
            svg: {
                content: '🚀',
                styles: {
                    default: {
                        filter: 'brightness(0) invert(1)',
                    }
                }
            }
        },
    };

    return isDark ? darkTheme : lightTheme;
};

export const FloatingChat = ({ epubData }: FloatingChatProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [documentContext, setDocumentContext] = useState<string>("");

    const currentTheme = getTheme(isDark);

    useEffect(() => {
        if (epubData) {
            const loadBookText = async () => {
                try {
                    const book = await loadEPUB(epubData);
                    const text = await extractAllTextFromBook(book);
                    setDocumentContext(text);
                } catch (error) {
                    console.error('Error extracting text from book:', error);
                    setDocumentContext("");
                }
            };
            loadBookText();
        } else {
            setDocumentContext("");
        }
    }, [epubData]);

    const systemPrompt = documentContext
        ? `You are a helpful AI assistant. Here is the document context you should use to answer questions:\n\n${documentContext}`
        : 'You are a helpful AI assistant.';

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-40 p-4 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
                    aria-label="Open chat"
                >
                    <MessageCircle size={24} />
                </button>
            )}

            {/* Floating Chat Window */}
            {isOpen && (
                <div className={`fixed bottom-6 right-6 z-40 w-96 h-[600px] rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all ${isDark ? 'bg-stone-950 border border-stone-800' : 'bg-white border border-stone-200'
                    }`}>
                    {/* Header */}
                    <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'
                        }`}>
                        <div className="flex items-center gap-2">
                            <MessageCircle size={20} className="text-amber-500" />
                            <h3 className={`font-semibold ${isDark ? 'text-stone-50' : 'text-stone-900'}`}>
                                Chat Assistant
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsDark(!isDark)}
                                className={`p-2 rounded-lg transition-all ${isDark
                                    ? 'bg-stone-800 text-amber-500 hover:bg-stone-700'
                                    : 'bg-stone-100 text-amber-600 hover:bg-stone-200'
                                    }`}
                                aria-label="Toggle theme"
                            >
                                {isDark ? '☀️' : '🌙'}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className={`p-2 rounded-lg transition-all ${isDark
                                    ? 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                    }`}
                                aria-label="Close chat"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <DeepChat
                            directConnection={{
                                ollama: {
                                    url: 'http://localhost:11434',
                                    model: 'gemma3:1b',
                                    system_prompt: systemPrompt,
                                }
                            } as Record<string, unknown>}
                            style={{
                                height: '100%',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                backgroundColor: currentTheme.backgroundColor,
                                fontFamily: currentTheme.fontFamily,
                                border: 'none',
                            }}
                            messageStyles={{
                                default: {
                                    user: currentTheme.userMessage,
                                    ai: currentTheme.aiMessage,
                                },
                                loading: currentTheme.loading,
                            }}
                            textInput={{
                                styles: currentTheme.textInput,
                                placeholder: {
                                    text: 'Type a message...',
                                    style: currentTheme.textInput.text.placeholder,
                                }
                            }}
                            submitButtonStyles={{
                                submit: currentTheme.submitButton,
                            }}
                            demo={true}
                            introMessage={{
                                text: 'Hello! I\'m your AI assistant. How can I help you today?'
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

const ChatComponent = ({ epubData }: FloatingChatProps) => {
    return <FloatingChat epubData={epubData} />;
};

export default ChatComponent;
