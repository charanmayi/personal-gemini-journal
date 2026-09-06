import React, { useState } from "react";
import { JournalEntry } from "../types";
import { deleteJournalEntry } from "../lib/firebase";
import {
  BookOpen,
  Search,
  Calendar,
  Tag,
  Trash2,
  ExternalLink,
  Smile,
  Shield,
  X,
  CheckCircle2,
  Sparkles,
  PlusCircle,
} from "lucide-react";

interface JournalListProps {
  entries: JournalEntry[];
  userId: string;
  onNewSession: () => void;
}

export const JournalList: React.FC<JournalListProps> = ({
  entries,
  userId,
  onNewSession,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(entries.flatMap((entry) => entry.tags || []))
  ).slice(0, 15);

  // Filter entries based on search & tag
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (entry.insights && entry.insights.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag = !selectedTag || (entry.tags && entry.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this journal entry?")) {
      return;
    }

    setDeletingId(entryId);
    try {
      await deleteJournalEntry(userId, entryId);
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete entry: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e2e2d8]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-serif italic text-[#5a5a40] tracking-tight">
              My Private Journal Vault
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#efefe9] text-[#5a5a40] border border-[#d4d4bc] flex items-center gap-1">
              <Shield className="h-3 w-3 text-[#5a5a40]" />
              Isolated in Firestore
            </span>
          </div>
          <p className="text-[11px] text-[#8e8e7c] mt-1 font-mono">
            Collection path: users/{userId}/journals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-new-journal-session"
            onClick={onNewSession}
            className="px-4 py-2 bg-[#5a5a40] hover:bg-[#4a4a34] text-white rounded-2xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="h-4 w-4 text-[#d4d4bc]" />
            <span>New Reflection Session</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#a3a393]" />
          <input
            id="input-search-journals"
            type="text"
            placeholder="Search entries by title, reflection, insight, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e2e2d8] rounded-2xl text-xs text-[#3d3d3d] placeholder:text-[#a3a393] focus:outline-none focus:ring-2 focus:ring-[#5a5a40]/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-[#a3a393] hover:text-[#5a5a40] text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tag Filter Chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center w-full sm:w-auto">
            <span className="text-xs text-[#8e8e7c] font-medium mr-1">Tags:</span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="px-2.5 py-1 bg-[#5a5a40] text-white rounded-xl text-xs font-medium"
              >
                All
              </button>
            )}
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors border ${
                  selectedTag === tag
                    ? "bg-[#5a5a40] text-white border-[#5a5a40]"
                    : "bg-[#efefe9] text-[#5a5a40] border-[#e2e2d8] hover:bg-[#e2e2d8]"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List / Grid */}
      {filteredEntries.length === 0 ? (
        <div className="py-16 text-center max-w-md mx-auto space-y-4 bg-white/80 border border-[#e2e2d8] rounded-3xl p-8 shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-[#efefe9] text-[#5a5a40] flex items-center justify-center mx-auto border border-[#e2e2d8]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-serif italic text-[#4a4a38]">
              {searchQuery || selectedTag ? "No matching entries found" : "Your vault is empty"}
            </h3>
            <p className="text-xs text-[#8e8e7c] leading-relaxed">
              {searchQuery || selectedTag
                ? "Try adjusting your search terms or clearing the tag filter."
                : "Start a reflection session with Gemini to explore ideas, synthesize takeaways, and save your first private entry."}
            </p>
          </div>
          {!searchQuery && !selectedTag && (
            <button
              onClick={onNewSession}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#5a5a40] text-white rounded-2xl text-xs font-medium hover:bg-[#4a4a34] transition-colors shadow-xs"
            >
              <Sparkles className="h-4 w-4 text-[#d4d4bc]" />
              <span>Start Your First Session</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="group bg-white/80 hover:bg-white border border-[#e2e2d8] hover:border-[#5a5a40]/40 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Top Meta */}
                <div className="flex items-center justify-between text-xs text-[#8e8e7c]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#a3a393]" />
                    <span>{formatDate(entry.createdAt)}</span>
                  </div>
                  {entry.mood && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#efefe9] text-[#5a5a40] border border-[#d4d4bc] font-medium text-[11px] flex items-center gap-1">
                      <Smile className="h-3 w-3 text-[#5a5a40]" />
                      {entry.mood}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-serif italic text-[#4a4a38] group-hover:text-[#5a5a40] transition-colors line-clamp-2">
                  {entry.title}
                </h3>

                {/* Summary snippet */}
                <p className="text-xs text-[#737362] line-clamp-3 leading-relaxed">
                  {entry.summary}
                </p>
              </div>

              {/* Insights Preview */}
              {entry.insights && entry.insights.length > 0 && (
                <div className="p-3 bg-[#f5f5f0]/80 rounded-2xl border border-[#e2e2d8] text-[11px] text-[#4a4a38] space-y-1">
                  <span className="font-semibold text-[#5a5a40] block">Key Takeaway:</span>
                  <p className="line-clamp-2 italic text-[#737362]">"{entry.insights[0]}"</p>
                </div>
              )}

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#e2e2d8]/60 flex items-center justify-between text-xs">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 items-center max-w-[75%] overflow-hidden">
                  {(entry.tags || []).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-[#efefe9] text-[#5a5a40] border border-[#e2e2d8] rounded-lg text-[10px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                  {(entry.tags || []).length > 3 && (
                    <span className="text-[10px] text-[#a3a393]">
                      +{(entry.tags || []).length - 3}
                    </span>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, entry.id)}
                  disabled={deletingId === entry.id}
                  className="p-1.5 text-[#a3a393] hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                  title="Delete journal entry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reader Modal for Expanded Entry View */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#3d3d3d]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#f5f5f0] border border-[#e2e2d8] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#e2e2d8] flex items-center justify-between bg-[#efefe9]">
              <div className="flex items-center gap-2 text-xs text-[#8e8e7c]">
                <Calendar className="h-4 w-4 text-[#a3a393]" />
                <span>{formatDate(selectedEntry.createdAt)}</span>
                {selectedEntry.mood && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-[#5a5a40]">{selectedEntry.mood}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDelete(e, selectedEntry.id)}
                  className="p-1.5 text-[#8e8e7c] hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-1.5 text-[#8e8e7c] hover:text-[#3d3d3d] rounded-xl hover:bg-[#e2e2d8] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h2 className="text-2xl font-serif italic text-[#5a5a40] leading-snug">
                  {selectedEntry.title}
                </h2>
                <p className="text-[11px] text-[#a3a393] font-mono mt-1">
                  Document ID: {selectedEntry.id} (Owner UID: {userId.slice(0, 8)}...)
                </p>
              </div>

              {/* Full Summary */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3a393]">
                  Reflective Synthesis
                </h3>
                <div className="p-5 bg-white border border-[#e2e2d8] rounded-2xl text-sm text-[#3d3d3d] leading-relaxed whitespace-pre-wrap">
                  {selectedEntry.summary}
                </div>
              </div>

              {/* Insights */}
              {selectedEntry.insights && selectedEntry.insights.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3a393]">
                    Key Insights & Actionable Takeaways
                  </h3>
                  <div className="space-y-2">
                    {selectedEntry.insights.map((insight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3.5 bg-white border border-[#e2e2d8] rounded-2xl text-xs text-[#4a4a38]"
                      >
                        <CheckCircle2 className="h-4 w-4 text-[#5a5a40] shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3a393]">
                    Categorical Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[#efefe9] text-[#5a5a40] border border-[#e2e2d8] rounded-xl text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#e2e2d8] bg-[#efefe9] flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-5 py-2 bg-[#5a5a40] text-white rounded-2xl text-xs font-medium hover:bg-[#4a4a34] transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
