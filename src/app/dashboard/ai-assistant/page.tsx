"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot, User, Sparkles, Loader2, Info } from "lucide-react";
import { useSession } from "next-auth/react";
import ReactMarkdown from 'react-markdown';
import { calculateProjections } from "@/lib/calculators";
import Image from "next/image";

type Message = {
    role: "user" | "ai" | "system";
    content: string;
};

const DEFAULT_QUESTIONS = [
    "How is my asset looking?",
    "Are my liabilities pulling down my growth?",
    "What should I be aware of regarding my FIRE goals?",
    "Suggest a simple reallocation strategy."
];

type AssetData = {
    id: string;
    type: string;
    name: string;
    investedAmount: number;
    returnRate: number;
};

type LiabilityData = {
    id: string;
    type: string;
    name: string;
    outstandingAmount: number;
    interestRate: number;
    emi: number;
};

type GoalData = {
    id: string;
    name: string;
    targetAmount: number;
    targetDate: string;
    priority: string;
};

type FireSettingsData = {
    annualExpenses: number;
    inflationRate: number;
    safeWithdrawalRate: number;
    currentAge: number | null;
    retirementAgeGoal: number | null;
};

type ProjectionData = {
    year: number;
    age: number;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    eventCost: number;
    eventName?: string;
};

type UserDataContext = {
    assets: AssetData[];
    liabilities: LiabilityData[];
    goals: GoalData[];
    fireSettings?: FireSettingsData;
    projections?: ProjectionData[];
};

export default function AIAssistantPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([
        { role: "system", content: "Hello! I am your Wealth Orbit AI Assistant. I can analyze your financial data and answer your questions." }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [userDataContext, setUserDataContext] = useState<UserDataContext | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load messages from session storage
    useEffect(() => {
        const savedMessages = sessionStorage.getItem("ai_assistant_messages");
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages));
            } catch (e) {
                console.error("Failed to parse saved messages");
            }
        }
    }, []);

    // Save messages to session storage whenever they change
    useEffect(() => {
        if (messages.length > 1) { // Don't just save the default greeting
            sessionStorage.setItem("ai_assistant_messages", JSON.stringify(messages));
        }
    }, [messages]);

    // Fetch user data and check API key on mount
    useEffect(() => {
        const storedKey = localStorage.getItem("google_gemini_api_key");
        if (storedKey) {
            setApiKey(storedKey);
        }

        const fetchUserData = async () => {
            try {
                // We'll fetch assets, liabilities, goals, fire settings
                const [assetsRes, liabilitiesRes, goalsRes, fireRes] = await Promise.all([
                    fetch('/api/assets'),
                    fetch('/api/liabilities'),
                    fetch('/api/goals'),
                    fetch('/api/fire')
                ]);

                const assets = await assetsRes.json();
                const liabilities = await liabilitiesRes.json();
                const goals = await goalsRes.json();
                const fireSettings = fireRes.ok ? await fireRes.json() : null;

                // Calculate projections locally
                const projections = calculateProjections(assets, liabilities, 15);

                setUserDataContext({ assets, liabilities, goals, fireSettings, projections });
            } catch (error) {
                console.error("Failed to fetch user context data", error);
            }
        };

        fetchUserData();
    }, []);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const serializeContext = (data: UserDataContext | null) => {
        if (!data) return "No data available.";

        let contextString = "Here is the user's current financial context:\\n\\n";

        contextString += "### Assets:\\n";
        if (data.assets && data.assets.length > 0) {
            data.assets.forEach((a: AssetData) => {
                contextString += `- ${a.name} (${a.type}): ₹${a.investedAmount} at ${a.returnRate}% return\\n`;
            });
        } else {
            contextString += "No assets.\\n";
        }

        contextString += "\\n### Liabilities:\\n";
        if (data.liabilities && data.liabilities.length > 0) {
            data.liabilities.forEach((l: LiabilityData) => {
                contextString += `- ${l.name} (${l.type}): ₹${l.outstandingAmount} remaining, ${l.interestRate}% interest, ₹${l.emi}/month EMI\\n`;
            });
        } else {
            contextString += "No liabilities.\\n";
        }

        contextString += "\\n### Goals:\\n";
        if (data.goals && data.goals.length > 0) {
            data.goals.forEach((g: GoalData) => {
                contextString += `- ${g.name} (${g.priority} priority): Target ₹${g.targetAmount} by ${new Date(g.targetDate).toLocaleDateString()}\\n`;
            });
        } else {
            contextString += "No goals.\\n";
        }

        if (data.fireSettings) {
            contextString += "\\n### FIRE Settings:\\n";
            contextString += `- Annual Expenses: ₹${data.fireSettings.annualExpenses}\\n`;
            contextString += `- Inflation Rate: ${data.fireSettings.inflationRate}%\\n`;
            contextString += `- Safe Withdrawal Rate: ${data.fireSettings.safeWithdrawalRate}%\\n`;
            contextString += `- Current Age: ${data.fireSettings.currentAge || 'N/A'}\\n`;
            contextString += `- Retirement Age Goal: ${data.fireSettings.retirementAgeGoal || 'N/A'}\\n`;
        }

        if (data.projections && data.projections.length > 0) {
            contextString += "\\n### Future Projections (Summary):\\n";
            const nearTerm = data.projections.find(p => p.year === new Date().getFullYear() + 5);
            const longTerm = data.projections.find(p => p.year === new Date().getFullYear() + 15);

            if (nearTerm) contextString += `- In 5 years (Age ${nearTerm.age}): Net Worth ₹${nearTerm.netWorth.toFixed(0)}\\n`;
            if (longTerm) contextString += `- In 15 years (Age ${longTerm.age}): Net Worth ₹${longTerm.netWorth.toFixed(0)}\\n`;
        }

        return contextString;
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        if (!apiKey) {
            setMessages(prev => [...prev, { role: "system", content: "Please configure your Google Gemini API Key in the Settings page to use the AI Assistant." }]);
            return;
        }

        const newMessages = [...messages, { role: "user" as const, content: text }];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const contextData = serializeContext(userDataContext);
            const fullPrompt = `${contextData}\n\nUser Question: ${text}\n\nINSTRUCTIONS: Please analyze their question based on the financial context provided above.
Keep your response concise but highly readable.
DO NOT output a dense single paragraph. Use headings (##), bullet points (-), bold text (**), and short paragraphs to structure your advice beautifully. Must add empty lines between paragraphs and bullets.
CRITICAL: Do not start with greetings or pleasantries like "It's great you're taking a closer look". Dive straight into the analysis.
Adopt a helpful, professional, and encouraging tone. Format everything nicely using Markdown.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error("Failed to fetch response from Gemini API");
            }

            const data = await response.json();
            const rawAiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

            // Post-process the text: replace single newlines with double newlines to force proper spacing 
            // and eliminate dense paragraphs where Gemini forgets spacing.
            const formattedAiText = rawAiText.replace(/([^\\n])\\n([^\\n])/g, '$1\\n\\n$2').replace(/\\n{3,}/g, '\\n\\n');

            setMessages(prev => [...prev, { role: "ai", content: formattedAiText }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "system", content: "An error occurred while communicating with the AI. Please verify your API key and try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] space-y-4">
            <div className="flex-none flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        AI Assistant
                    </h1>
                    <p className="text-muted-foreground mt-1">Get personalized insights based on your assets and liabilities.</p>
                </div>
            </div>

            {!apiKey && (
                <div className="flex-none bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-start gap-3">
                    <Info className="h-5 w-5 mt-0.5" />
                    <div>
                        <p className="font-semibold">API Key Required</p>
                        <p className="text-sm mt-1">Please go to <a href="/dashboard/settings" className="underline">Settings</a> to configure your Google Gemini API Key in order to use this feature.</p>
                    </div>
                </div>
            )}

            <div className="flex-1 min-h-0 flex flex-col sm:flex-row gap-4">
                {/* Main Chat Area */}
                <Card className="flex-1 flex flex-col min-h-0">
                    <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent pr-4"
                        >
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-3 ${msg.role === 'user' ? 'max-w-[85%] flex-row-reverse' : 'w-full'}`}>

                                        {/* Avatar: Only show for User */}
                                        {msg.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-primary">
                                                <User className="h-4 w-4 text-primary-foreground" />
                                            </div>
                                        )}

                                        {/* Message Body */}
                                        <div className={`p-3 text-sm ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-lg'
                                            : 'text-foreground w-full'
                                            }`}>
                                            {msg.role === 'system' ? (
                                                <p>{msg.content}</p>
                                            ) : (
                                                <div className="prose prose-sm prose-invert text-foreground max-w-none prose-p:my-3 prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-3 prose-li:my-1 prose-pre:bg-black/50 prose-pre:p-2">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3 w-full">
                                        <div className="p-3 text-sm text-foreground flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            <span className="text-muted-foreground">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex-none p-4 border-t bg-background">
                            <form
                                className="flex gap-2"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                            >
                                <Input
                                    placeholder="Ask anything about your finances..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isLoading || !apiKey}
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={isLoading || !input.trim() || !apiKey}>
                                    <Send className="h-4 w-4" />
                                    <span className="sr-only">Send</span>
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Quick Prompts */}
                <Card className="flex-none w-full sm:w-64 hidden md:flex flex-col overflow-hidden shrink-0">
                    <CardHeader className="flex-none py-4">
                        <CardTitle className="text-lg">Suggested Prompts</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        {DEFAULT_QUESTIONS.map((q, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                className="w-full justify-start text-left h-auto py-3 px-4 text-sm font-normal whitespace-normal block"
                                onClick={() => handleSend(q)}
                                disabled={isLoading || !apiKey}
                            >
                                {q}
                            </Button>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
