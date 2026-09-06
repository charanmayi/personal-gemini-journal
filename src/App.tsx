import React, { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, logoutUser, subscribeToUserJournals } from "./lib/firebase";
import { ChatMessage, JournalEntry } from "./types";
import { Navbar } from "./components/Navbar";
import { AuthModal } from "./components/AuthModal";
import { ChatSession } from "./components/ChatSession";
import { JournalList } from "./components/JournalList";
import { JournalSummaryModal } from "./components/JournalSummaryModal";
import { SetupGuideModal } from "./components/SetupGuideModal";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "vault" | "guide">("chat");

  // Multi-turn conversation state (preserved across turns)
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // User's private Firestore journal entries
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  // Modals
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Monitor Firebase Auth State
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore Journals for the Authenticated User UID
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const unsubscribe = subscribeToUserJournals(
      user.uid,
      (updatedEntries) => {
        setEntries(updatedEntries);
      },
      (error) => {
        console.error("Firestore journal subscription error:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setMessages([]);
    setEntries([]);
    setActiveTab("chat");
  };

  const handleResetSession = () => {
    if (messages.length > 0 && !window.confirm("Start a new session? Your unsaved conversation will be cleared.")) {
      return;
    }
    setMessages([]);
  };

  const handleSavedSuccessfully = () => {
    setIsSummaryModalOpen(false);
    setMessages([]); // Reset chat session once saved
    setActiveTab("vault"); // Switch to vault to show newly saved entry
  };

  // Auth Loading Splash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 border-3 border-[#e2e2d8] border-t-[#5a5a40] rounded-full animate-spin" />
          <p className="text-xs font-medium text-[#8e8e7c]">
            Initializing Personal Gemini Journal...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated View
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] text-[#3d3d3d]">
        <Navbar
          user={null}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === "guide") setIsGuideModalOpen(true);
          }}
          onSignOut={() => {}}
          journalCount={0}
        />

        <AuthModal onOpenGuide={() => setIsGuideModalOpen(true)} />

        <SetupGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
        />
      </div>
    );
  }

  // Authenticated Application
  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#3d3d3d] flex flex-col font-sans">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === "guide") {
            setIsGuideModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onSignOut={handleSignOut}
        journalCount={entries.length}
      />

      <main className="flex-1">
        {activeTab === "chat" && (
          <ChatSession
            messages={messages}
            setMessages={setMessages}
            onOpenSummary={() => setIsSummaryModalOpen(true)}
            onResetSession={handleResetSession}
          />
        )}

        {activeTab === "vault" && (
          <JournalList
            entries={entries}
            userId={user.uid}
            onNewSession={() => setActiveTab("chat")}
          />
        )}
      </main>

      {/* Synthesis & Firestore Save Modal */}
      <JournalSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        messages={messages}
        userId={user.uid}
        onSavedSuccessfully={handleSavedSuccessfully}
      />

      {/* Architecture, Setup & Secret Manager Guide Modal */}
      <SetupGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
