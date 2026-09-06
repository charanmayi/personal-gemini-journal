import React, { useState, useEffect } from "react";
import { ChatMessage, JournalSummaryPayload } from "../types";
import { getCurrentUserToken, saveJournalEntry } from "../lib/firebase";
import {
  X,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  Tag,
  Smile,
  ListOrdered,
  BookOpen,
} from "lucide-react";

interface JournalSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  userId: string;
  onSavedSuccessfully: (entryId: string) => void;
}

export const JournalSummaryModal: React.FC<JournalSummaryModalProps> = ({
  isOpen,
  onClose,
  messages,
  userId,
  onSavedSuccessfully,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [insights, setInsights] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [mood, setMood] = useState("Reflective");
  const [newTagInput, setNewTagInput] = useState("");

  // Automatically request summary from backend when modal opens
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;

    let isMounted = true;

    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        const token = await getCurrentUserToken();
        if (!token) {
          throw new Error("Missing auth token. Please sign in again.");
        }

        const res = await fetch("/api/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || "Summarization failed");
        }

        if (isMounted) {
          setTitle(data.title || "Reflective Journal Entry");
          setSummary(data.summary || "");
          setInsights(data.insights || []);
          setTags(data.tags || ["journal", "reflection"]);
          setMood(data.mood || "Reflective");
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Summary generation error:", err);
          setError(err instanceof Error ? err.message : "Failed to generate summary");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      const cleaned = newTagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (cleaned && !tags.includes(cleaned) && tags.length < 15) {
        setTags([...tags, cleaned]);
      }
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSaveToFirestore = async () => {
    if (!title.trim() || !summary.trim()) {
      setError("Title and Summary cannot be empty.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: JournalSummaryPayload = {
        title: title.trim(),
        summary: summary.trim(),
        insights,
        tags,
        mood: mood.trim(),
      };

      const entryId = await saveJournalEntry(userId, payload, messages.length);
      onSavedSuccessfully(entryId);
    } catch (err: unknown) {
      console.error("Save to Firestore error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to write document to Firestore. Check permissions or security rules."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#3d3d3d]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#f5f5f0] border border-[#e2e2d8] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e2e2d8] flex items-center justify-between bg-[#efefe9]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#5a5a40] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-4 w-4 text-[#d4d4bc]" />
            </div>
            <div>
              <h3 className="text-base font-serif italic text-[#5a5a40]">
                AI Journal Synthesis
              </h3>
              <p className="text-xs text-[#8e8e7c]">
                Review and refine your session before saving to your isolated Firestore path
              </p>
            </div>
          </div>
          <button
            id="btn-close-summary-modal"
            onClick={onClose}
            className="p-1.5 text-[#8e8e7c] hover:text-[#3d3d3d] rounded-xl hover:bg-[#e2e2d8] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block h-8 w-8 border-3 border-[#e2e2d8] border-t-[#5a5a40] rounded-full animate-spin" />
              <p className="text-sm font-serif italic text-[#5a5a40]">
                Gemini is synthesizing your reflections and extracting key insights...
              </p>
              <p className="text-xs text-[#8e8e7c]">Analyzing {messages.length} conversational turns</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a393]">
                  Journal Title
                </label>
                <input
                  id="input-summary-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  className="w-full px-4 py-2.5 bg-white border border-[#e2e2d8] rounded-2xl text-sm font-medium text-[#3d3d3d] focus:outline-none focus:ring-2 focus:ring-[#5a5a40]/20 transition-all"
                  placeholder="e.g., Overcoming Creative Inertia & Weekly Goals"
                />
              </div>

              {/* Mood & Message Count Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a393] mb-1.5 flex items-center gap-1.5">
                    <Smile className="h-3.5 w-3.5 text-[#5a5a40]" />
                    <span>Mindset / Mood</span>
                  </label>
                  <input
                    id="input-summary-mood"
                    type="text"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    maxLength={50}
                    className="w-full px-3.5 py-2 bg-white border border-[#e2e2d8] rounded-2xl text-xs text-[#3d3d3d] focus:outline-none focus:ring-2 focus:ring-[#5a5a40]/20 transition-all"
                    placeholder="e.g. Energized, Reflective"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a393] mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#5a5a40]" />
                    <span>Storage Scope</span>
                  </label>
                  <div className="px-3.5 py-2 bg-[#efefe9] border border-[#e2e2d8] rounded-2xl text-xs text-[#5a5a40] font-mono truncate">
                    users/{userId.slice(0, 8)}.../journals
                  </div>
                </div>
              </div>

              {/* Summary / Synthesis Text */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a393]">
                  Session Summary & Reflections
                </label>
                <textarea
                  id="input-summary-text"
                  rows={5}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  maxLength={5000}
                  className="w-full p-4 bg-white border border-[#e2e2d8] rounded-2xl text-sm text-[#3d3d3d] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#5a5a40]/20 transition-all"
                  placeholder="Detailed session synthesis..."
                />
              </div>

              {/* Insights List */}
              {insights.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a393] flex items-center gap-1.5">
                    <ListOrdered className="h-3.5 w-3.5 text-[#5a5a40]" />
                    <span>Key Takeaways & Action Items</span>
                  </label>
                  <ul className="space-y-2 bg-white border border-[#e2e2d8] rounded-2xl p-4">
                    {insights.map((insight, idx) => (
                      <li key={idx} className="text-xs text-[#4a4a38] flex items-start gap-2.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#5a5a40] shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a3a393] flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-[#5a5a40]" />
                  <span>Topic Tags (Press Enter to add)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 items-center p-2.5 bg-white border border-[#e2e2d8] rounded-2xl">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[#efefe9] border border-[#e2e2d8] rounded-xl text-xs text-[#5a5a40] font-medium"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-700 transition-colors ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="+ add tag..."
                    className="text-xs bg-transparent border-none focus:outline-none px-2 py-1 text-[#3d3d3d] placeholder:text-[#a3a393]"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#e2e2d8] bg-[#efefe9] flex items-center justify-between">
          <button
            id="btn-cancel-summary"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-[#8e8e7c] hover:text-[#4a4a38] rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            id="btn-confirm-save-journal"
            onClick={handleSaveToFirestore}
            disabled={loading || saving || !title.trim() || !summary.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5a5a40] hover:bg-[#4a4a34] text-white rounded-2xl text-xs font-medium transition-all shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 text-[#d4d4bc]" />
                <span>Save to My Journal Vault</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
