import React from "react";
import { User } from "firebase/auth";
import { BookOpen, ShieldCheck, Sparkles, LogOut, HelpCircle, User as UserIcon } from "lucide-react";

interface NavbarProps {
  user: User | null;
  activeTab: "chat" | "vault" | "guide";
  setActiveTab: (tab: "chat" | "vault" | "guide") => void;
  onSignOut: () => void;
  journalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onSignOut,
  journalCount,
}) => {
  return (
    <header className="bg-[#efefe9]/90 backdrop-blur-md border-b border-[#e2e2d8] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#5a5a40] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-5 w-5 text-[#d4d4bc]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif italic text-2xl text-[#5a5a40] tracking-tight">
                  Gemini Journal
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e2e2d8]/60 text-[#5a5a40] border border-[#d4d4bc]">
                  <ShieldCheck className="h-3 w-3 text-[#5a5a40]" />
                  UID Isolated
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#a3a393] font-semibold hidden md:block">
                Personal Reflection & AI Synthesis Space
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          {user && (
            <nav className="flex items-center gap-1 bg-[#e2e2d8]/70 p-1 rounded-2xl border border-[#d4d4bc]/60">
              <button
                id="nav-tab-chat"
                onClick={() => setActiveTab("chat")}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "chat"
                    ? "bg-white text-[#4a4a38] shadow-xs"
                    : "text-[#8e8e7c] hover:text-[#4a4a38]"
                }`}
              >
                <Sparkles className="h-4 w-4 text-[#5a5a40]" />
                <span>Reflection Session</span>
              </button>

              <button
                id="nav-tab-vault"
                onClick={() => setActiveTab("vault")}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "vault"
                    ? "bg-white text-[#4a4a38] shadow-xs"
                    : "text-[#8e8e7c] hover:text-[#4a4a38]"
                }`}
              >
                <BookOpen className="h-4 w-4 text-[#5a5a40]" />
                <span>Journal Vault</span>
                {journalCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-[#efefe9] text-[#5a5a40] border border-[#d4d4bc] rounded-full text-xs font-semibold">
                    {journalCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-guide"
                onClick={() => setActiveTab("guide")}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "guide"
                    ? "bg-white text-[#4a4a38] shadow-xs"
                    : "text-[#8e8e7c] hover:text-[#4a4a38]"
                }`}
              >
                <HelpCircle className="h-4 w-4 text-[#8e8e7c]" />
                <span className="hidden sm:inline">Architecture Guide</span>
              </button>
            </nav>
          )}

          {/* Right Action: User Menu or Sign Out */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#4a4a38]">
                    {user.displayName || user.email?.split("@")[0] || "User"}
                  </span>
                  <span className="text-[10px] text-[#a3a393] font-mono">
                    UID: {user.uid.slice(0, 8)}...
                  </span>
                </div>

                <div className="h-9 w-9 rounded-full bg-[#d4d4bc] border border-[#c4c4ab] flex items-center justify-center text-[#5a5a40] text-xs font-bold overflow-hidden shadow-xs">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User avatar"}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}</span>
                  )}
                </div>

                <button
                  id="btn-sign-out"
                  onClick={onSignOut}
                  title="Sign out of Firebase"
                  className="p-2 text-[#8e8e7c] hover:text-red-700 hover:bg-[#e2e2d8] rounded-xl transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-nav-guide-unauth"
                onClick={() => setActiveTab("guide")}
                className="text-xs text-[#5a5a40] hover:text-[#3d3d3d] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#e2e2d8] hover:bg-[#efefe9] font-medium transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Architecture Guide</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
