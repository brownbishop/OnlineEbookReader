import {createOpencodeClient, OpencodeClient} from "@opencode-ai/sdk";
import type {Part} from "@opencode-ai/sdk";
import {Loader, MessageSquare, Send, X} from 'lucide-react';
import {useCallback, useEffect, useRef, useState} from "react";
import {RefreshCw} from 'lucide-react';

// ====================================================================
// --- CONFIGURATION ---
// ====================================================================
const CONFIG = {
    // The URL where your Opencode server is running.
    // Default is localhost:4096 if running "opencode" in terminal.
    baseUrl: "http://localhost:4096",

    // You can specify a model, or let Opencode use its default.
    // Example: { providerID: "anthropic", modelID: "claude-3-5-sonnet" }
    model: {providerID: "opencode", modelID: "big-pickle"}
};

// ====================================================================
// --- REACT COMPONENT ---
// ====================================================================

const MESSAGE_TYPE = {
    USER: 'user',
    AI: 'ai',
    LOADING: 'loading',
    ERROR: 'error',
};

type MessageType = typeof MESSAGE_TYPE[keyof typeof MESSAGE_TYPE];

interface Message {
    text: string;
    sender: MessageType;
}

const OpencodeChatWidget = ({bookUrl}: ChatComponentProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {text: "Hello! I'm connected to your local Opencode instance.", sender: MESSAGE_TYPE.AI}
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // SDK State
    const [client, setClient] = useState<OpencodeClient | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- 1. INITIALIZE SDK & CREATE SESSION ---
    const initOpencode = useCallback(async () => {
        try {
            setConnectionStatus('connecting');
            console.log("Connecting to Opencode at", CONFIG.baseUrl);

            // Create the client
            const newClient = createOpencodeClient({
                baseUrl: CONFIG.baseUrl,
            });
            setClient(newClient);

            // Create a new session for this chat
            // The SDK uses sessions to maintain context
            const sessionResponse = await newClient.session.create();

            // Extract session from response
            const session = (sessionResponse as unknown as {data?: {id?: string}}).data || sessionResponse as unknown as {id?: string};
            const id = session?.id;

            if (!id) {
                throw new Error('No session ID in response');
            }

            setSessionId(id);
            setConnectionStatus('connected');
            console.log("Opencode Session Created:", id);



            const userMessageText = "This is the file path to the book you have to use to answer messages: " + bookUrl;

            try {
                // API Call to Opencode SDK
                // client.session.prompt sends the message and awaits the response
                const response = await newClient.session.prompt({
                    path: {id: id},
                    body: {
                        model: CONFIG.model,
                        parts: [{type: "text", text: userMessageText}],
                    },
                });

                // The SDK returns a response with info and parts
                const responseData = (response as unknown as {data?: {parts?: Part[]}}).data || response as unknown as {parts?: Part[]};
                const aiText = (responseData?.parts as Part[])
                    .map((p: Part) => {
                        if ('text' in p) {
                            return p.text || '';
                        }
                        return '';
                    })
                    .filter(Boolean)
                    .join('\n') || "No text response received.";

                // Update UI with AI Response
                setMessages(prev => {
                    const filtered = prev.filter(m => m.sender !== MESSAGE_TYPE.LOADING);
                    return [...filtered, {text: aiText, sender: MESSAGE_TYPE.AI}];
                });

            } catch (error) {
                console.error("Error sending message:", error);
                setMessages(prev => {
                    const filtered = prev.filter(m => m.sender !== MESSAGE_TYPE.LOADING);
                    return [...filtered, {text: "Error: Failed to get response from Opencode.", sender: MESSAGE_TYPE.ERROR}];
                });
            } finally {
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Opencode Connection Error:", error);
            setConnectionStatus('error');
            setMessages(prev => [...prev, {
                text: "Could not connect to Opencode server. Is it running? (run 'opencode' in terminal)",
                sender: MESSAGE_TYPE.ERROR
            }]);
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        initOpencode();
    }, [initOpencode]);


    // --- 2. SEND MESSAGE FUNCTION ---
    const handleSendMessage = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading || !client || !sessionId) return;

        const userMessageText = inputValue.trim();
        setInputValue('');
        setIsLoading(true);

        // Add User Message to UI
        setMessages(prev => [...prev, {text: userMessageText, sender: MESSAGE_TYPE.USER}]);
        // Add Loading State
        setMessages(prev => [...prev, {text: 'Thinking...', sender: MESSAGE_TYPE.LOADING}]);

        try {
            // API Call to Opencode SDK
            // client.session.prompt sends the message and awaits the response
            const response = await client.session.prompt({
                path: {id: sessionId},
                body: {
                    model: CONFIG.model,
                    parts: [{type: "text", text: userMessageText}],
                },
            });

            // The SDK returns a response with info and parts
            const responseData = (response as unknown as {data?: {parts?: Part[]}}).data || response as unknown as {parts?: Part[]};
            const aiText = (responseData?.parts as Part[])
                .map((p: Part) => {
                    if ('text' in p) {
                        return p.text || '';
                    }
                    return '';
                })
                .filter(Boolean)
                .join('\n') || "No text response received.";

            // Update UI with AI Response
            setMessages(prev => {
                const filtered = prev.filter(m => m.sender !== MESSAGE_TYPE.LOADING);
                return [...filtered, {text: aiText, sender: MESSAGE_TYPE.AI}];
            });

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => {
                const filtered = prev.filter(m => m.sender !== MESSAGE_TYPE.LOADING);
                return [...filtered, {text: "Error: Failed to get response from Opencode.", sender: MESSAGE_TYPE.ERROR}];
            });
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, isLoading, client, sessionId]);


    // --- UI COMPONENTS (Bubble, Window, Button) ---

    const ChatBubble = ({message}: {message: Message}) => {
        const isUser = message.sender === MESSAGE_TYPE.USER;
        const isError = message.sender === MESSAGE_TYPE.ERROR;
        const isLoadingMsg = message.sender === MESSAGE_TYPE.LOADING;

        const wrapperClass = isUser ? "justify-end" : "justify-start";
        let bubbleClass = "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ";

        if (isUser) {
            bubbleClass += "bg-amber-600 text-white rounded-br-none";
        } else if (isError) {
            bubbleClass += "bg-red-100 text-red-700 border border-red-200";
        } else if (isLoadingMsg) {
            bubbleClass += "bg-gray-100 text-gray-500 italic flex items-center gap-2";
        } else {
            bubbleClass += "bg-white text-gray-800 border border-gray-200 rounded-tl-none";
        }

        return (
            <div className={`flex ${wrapperClass} w-full mb-3 animate-in fade-in slide-in-from-bottom-2`}>
                <div className={bubbleClass}>
                    {isLoadingMsg ? (
                        <>
                            <Loader className="w-3 h-3 animate-spin" />
                            {message.text}
                        </>
                    ) : (
                        <div className="whitespace-pre-wrap">{message.text}</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">

            {/* CHAT WINDOW */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-96 h-[500px] bg-gray-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 ring-1 ring-black/5">

                    {/* Header */}
                    <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h3 className="font-bold text-gray-800">Opencode Assistant</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                <span className="text-xs text-gray-500 capitalize">{connectionStatus}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {connectionStatus === 'error' && (
                                <button onClick={initOpencode} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Reconnect">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                        {messages.map((msg, i) => <ChatBubble key={i} message={msg} />)}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                        <div className="relative">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={sessionId ? "Ask me anything..." : "Connecting..."}
                                disabled={!sessionId || isLoading}
                                className="w-full pl-4 pr-12 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all disabled:opacity-60"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading || !sessionId}
                                className="absolute right-2 top-2 p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TOGGLE BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-amber-600 text-white rounded-full shadow-lg hover:bg-amber-700 hover:scale-105 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-amber-300"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>
    );
};

interface ChatComponentProps {
    bookUrl: string
};


const ChatComponent = ({bookUrl}: ChatComponentProps): React.ReactElement => {
    return <OpencodeChatWidget bookUrl={bookUrl} />
};

export default ChatComponent;
