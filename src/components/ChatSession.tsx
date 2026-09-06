import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../types";
import { getCurrentUserToken } from "../lib/firebase";
import {
  Send,
  Sparkles,
  RefreshCw,
  BookmarkCheck,
  AlertCircle,
  Lightbulb,
  Shield,
  Bot,
  User as UserIcon,
} from "lucide-react";

interface ChatSessionProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onOpenSummary: () => void;
  onResetSession: () => void;
}

const PROMPT_SUGGESTIONS = [
  "Help me untangle what caused my anxiety today and how to reframe it.",
  "Brainstorm 5 creative angles for my new personal project.",
  "Reflect on a tough conversation I had and how I can communicate better next time.",
  "Ask me 3 thoughtful questions to help me clarify my top priorities for this week.",
];

export const ChatSession: React.FC<ChatSessionProps> = ({
  messages,
  setMessages,
  onOpenSummary,
  onResetSession,
}) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    setError(null);
    setInput("");

    // Add user message to state
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: promptText,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Rule 2: Get Firebase Auth ID Token for backend verification
      const token = await getCurrentUserToken();
      if (!token) {
        throw new Error("Authentication token expired or unavailable. Please sign in again.");
      }

      // Format previous history for multi-turn context
      const history = updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: promptText,
          history,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to receive reply from Gemini");
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: "model",
        content: data.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      const msg = err instanceof Error ? err.message : "Error sending message";
      setError(msg);
    } finally {
      setLoading(false);
      // Re-focus input
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 sm:px-6 py-4">
      {/* Session Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e2e2d8]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#5a5a40] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="h-4 w-4 text-[#d4d4bc]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#4a4a38]">
              Active Journaling & Brainstorming Session
            </h1>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8e8e7c] flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              Secure Session Active • Gemini 3.8 Flash • {messages.length} turn{messages.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <>
              <button
                id="btn-reset-session"
                onClick={onResetSession}
                className="px-3 py-1.5 text-xs font-medium text-[#8e8e7c] hover:text-[#4a4a38] hover:bg-[#efefe9] rounded-xl transition-colors flex items-center gap-1"
                title="Start a new blank session"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New Topic</span>
              </button>

              <button
                id="btn-summarize-session"
                onClick={onOpenSummary}
                className="px-4 py-2 bg-[#5a5a40] hover:bg-[#4a4a34] text-white rounded-2xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
              >
                <BookmarkCheck className="h-4 w-4 text-[#d4d4bc]" />
                <span>Summarize & Save to Vault</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 py-8">
            <div className="h-14 w-14 rounded-2xl bg-[#efefe9] border border-[#e2e2d8] text-[#5a5a40] flex items-center justify-center shadow-xs">
              <Lightbulb className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif italic text-[#5a5a40]">
                What is on your mind today?
              </h2>
              <p className="text-sm text-[#737362] leading-relaxed">
                Share a stream of consciousness, explore an idea, or process feelings. Gemini maintains your conversation context across turns, and will help synthesize key breakthroughs when you finish.
              </p>
            </div>

            {/* Prompt Starter Chips */}
            <div className="w-full space-y-2 text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#a3a393] block text-center">
                Prompt Starters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="p-3.5 bg-white/70 hover:bg-white border border-[#e2e2d8] hover:border-[#5a5a40]/30 rounded-2xl text-xs text-[#4a4a38] text-left transition-all shadow-2xs group flex items-start gap-2.5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#5a5a40] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="leading-snug">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#8e8e7c] bg-[#efefe9] px-3.5 py-1.5 rounded-full border border-[#e2e2d8]">
              <Shield className="h-3.5 w-3.5 text-[#5a5a40]" />
              <span>Zero-knowledge storage: Entries are saved strictly under your verified UID.</span>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? "justify-end flex-row-reverse" : "justify-start"}`}
              >
                {!isUser ? (
                  <div className="h-8 w-8 rounded-xl bg-[#5a5a40] text-white flex items-center justify-center shrink-0 shadow-2xs mt-1 text-[10px] font-bold">
                    AI
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-xl bg-[#d4d4bc] text-[#5a5a40] flex items-center justify-center shrink-0 mt-1 text-[10px] font-bold">
                    ME
                  </div>
                )}

                <div
                  className={`max-w-2xl px-5 py-4 rounded-3xl text-[15px] leading-relaxed shadow-xs ${
                    isUser
                      ? "bg-[#5a5a40] text-white rounded-tr-none"
                      : "bg-white text-[#4a4a38] border border-[#e2e2d8] rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <div
                    className={`mt-2 text-[10px] ${
                      isUser ? "text-[#d4d4bc] text-right" : "text-[#a3a393]"
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="h-8 w-8 rounded-xl bg-[#5a5a40] text-white flex items-center justify-center shrink-0 shadow-2xs mt-1 text-[10px] font-bold">
              AI
            </div>
            <div className="bg-white border border-[#e2e2d8] rounded-3xl rounded-tl-none px-5 py-3.5 shadow-xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#5a5a40] animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-[#5a5a40] animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-[#5a5a40] animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-[#8e8e7c] ml-1.5 font-medium">Gemini is reflecting...</span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50/90 border border-red-200 rounded-2xl p-3.5 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Generation Error:</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="pt-2">
        <div className="relative bg-white border border-[#e2e2d8] rounded-[32px] shadow-xs focus-within:ring-2 focus-within:ring-[#5a5a40]/20 transition-all p-2 pb-14">
          <textarea
            id="chat-input-textarea"
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reflections, questions, or stream of consciousness... (Enter to send, Shift+Enter for newline)"
            className="w-full resize-none p-3.5 bg-transparent text-sm text-[#3d3d3d] placeholder:text-[#a3a393] focus:outline-none"
          />

          <div className="absolute bottom-3 left-5 hidden sm:flex items-center gap-1.5 text-[10px] text-[#a3a393] font-medium">
            <Shield className="h-3 w-3 text-[#5a5a40]" />
            <span>Encrypted with Firestore & Verified UID</span>
          </div>

          <button
            id="btn-send-message"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="absolute bottom-3 right-3 w-10 h-10 bg-[#5a5a40] hover:bg-[#4a4a34] text-white rounded-full flex items-center justify-center disabled:opacity-40 transition-all shadow-md hover:scale-105"
            title="Send to Gemini"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-[#a3a393] text-center mt-2 font-medium">
          Context preserved across turns • Server-side Gemini 3.8 Flash • Verified Firebase Auth
        </p>
      </div>
    </div>
  );
};
