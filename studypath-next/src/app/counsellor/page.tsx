'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Loader2, Lock, Star, ChevronRight, Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    action?: {
        type: 'LOCK' | 'SHORTLIST';
        data: any;
    };
}

// Speech Recognition Type Definition
declare global {
    interface Window {
        webkitSpeechRecognition: any;
    }
}

export default function CounsellorPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hello! I'm your AI Counsellor. I can help you find universities, explain acceptance chances, and even apply for you. Try saying 'Shortlist Stanford' or 'Lock University of Toronto'."
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const router = useRouter();

    const [profile, setProfile] = useState<any>(null);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Load Profile Context
    useEffect(() => {
        const storedUser = localStorage.getItem('session');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                fetch(`/api/user/profile?email=${user.email}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.profile) setProfile(data.profile);
                    })
                    .catch(err => console.error("Failed to load profile context", err));
            } catch (e) {
                console.error("Invalid session", e);
            }
        }
    }, []);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && window.webkitSpeechRecognition) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleSend(transcript); // Auto-send on voice
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error(event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Voice recognition is not supported in this browser. Please try Chrome.");
            return;
        }
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSend = async (manualInput?: string) => {
        const textToSend = manualInput || input;
        if (!textToSend.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Retrieve latest profile state from localStorage/DB for context if needed
            const response = await fetch('/api/counsellor/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: textToSend,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    profile // Send the fetched profile context
                })
            });

            const data = await response.json();

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply,
                action: data.action
            };

            setMessages(prev => [...prev, aiMsg]);

            // Text to Speech for the response (optional but cool)
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(data.reply);
                window.speechSynthesis.speak(utterance);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Sorry, connection error."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const executeAction = async (action: any) => {
        alert(`${action.type === 'LOCK' ? 'Locked' : 'Shortlisted'}: ${action.data.name}`);
        // Here we would call the actual API to save to DB
    };

    return (
        <div className="min-h-screen bg-muted/20 p-2 md:p-6 flex flex-col h-screen">
            <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col glass rounded-2xl shadow-2xl overflow-hidden border border-white/20 h-full">

                {/* Header */}
                <div className="p-4 border-b bg-white/60 backdrop-blur-md flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-900">AI Counsellor</h1>
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Online • Voice Active
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                        <ChevronRight />
                    </Button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50/50" ref={scrollRef}>
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                            >
                                <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[70%]">
                                    <div className={cn(
                                        "p-5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                                    )}>
                                        {msg.content}
                                    </div>

                                    {/* Action Card Render */}
                                    {msg.action && (
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-white border border-slate-200 p-4 rounded-xl shadow-lg flex items-center justify-between gap-4 mt-1"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                                    {msg.action.type === 'LOCK' ? <Lock size={20} /> : <Star size={20} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">{msg.action.type === 'LOCK' ? 'Application Action' : 'Recommendation'}</p>
                                                    <p className="font-semibold text-slate-900">{msg.action.data.name}</p>
                                                    {msg.action.data.chance && <p className="text-xs text-slate-500">Acceptance Chance: <span className="text-green-600 font-medium">{msg.action.data.chance}</span></p>}
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => executeAction(msg.action)} className="rounded-lg">
                                                {msg.action.type === 'LOCK' ? 'Start App' : 'Shortlist'}
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm ml-4 animate-pulse">
                            <Loader2 className="animate-spin" size={16} /> Reasoning...
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-white border-t shrink-0">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="flex gap-3 relative"
                    >
                        <Button
                            type="button"
                            size="icon"
                            variant={isListening ? "destructive" : "secondary"}
                            className={cn("h-14 w-14 rounded-2xl shrink-0 transition-all", isListening && "animate-pulse ring-4 ring-red-100")}
                            onClick={toggleListening}
                        >
                            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                        </Button>

                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Ask about your profile, universities, or strategy..."}
                            className="flex-1 rounded-2xl h-14 pl-6 text-base shadow-sm border-slate-200 focus:ring-primary/20"
                        />
                        <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl shrink-0 shadow-lg shadow-primary/25" disabled={isLoading || (!input.trim() && !isListening)}>
                            <Send size={24} />
                        </Button>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">AI Powered • Voice Enabled</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
