import React, { useState } from "react";
import { loginWithGoogle, loginWithEmail, signupWithEmail, isFirebaseReady } from "../lib/firebase";
import { Shield, Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

interface AuthModalProps {
  onSuccess?: () => void;
  onOpenGuide: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onOpenGuide }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in with Google";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, displayName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      // Format friendly Firebase error codes
      if (msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password") || msg.includes("auth/invalid-credential")) {
        setError("Invalid email or password. If you haven't registered yet, switch to 'Create Account'.");
      } else if (msg.includes("auth/email-already-in-use")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (msg.includes("auth/configuration-not-found") || msg.includes("auth/operation-not-allowed")) {
        setError("Firebase Auth method is not enabled in your Firebase console. Please enable Email/Password and Google sign-in.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#f5f5f0]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e2e2d8] p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[#efefe9] border border-[#e2e2d8] text-[#5a5a40] mb-1 shadow-xs">
            <Sparkles className="h-7 w-7 text-[#5a5a40]" />
          </div>
          <h2 className="text-3xl font-serif italic text-[#5a5a40] tracking-tight">
            Gemini Journal
          </h2>
          <p className="text-sm text-[#737362] max-w-sm mx-auto leading-relaxed">
            Your private, AI-powered conversational reflection space with strict per-user UID isolation.
          </p>
        </div>

        {/* Security Highlights */}
        <div className="bg-[#efefe9] border border-[#e2e2d8] rounded-2xl p-4 text-xs text-[#4a4a38] space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-[#5a5a40]">
            <Shield className="h-4 w-4 text-[#5a5a40]" />
            <span>Zero-Trust Privacy Architecture:</span>
          </div>
          <div className="flex items-start gap-1.5 pl-6">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#5a5a40] shrink-0 mt-0.5" />
            <span>All entries stored in Firestore under <code className="bg-[#e2e2d8] px-1.5 py-0.5 rounded text-[#4a4a38] font-mono">users/&#123;uid&#125;/journals</code>.</span>
          </div>
          <div className="flex items-start gap-1.5 pl-6">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#5a5a40] shrink-0 mt-0.5" />
            <span>Backend verifies Firebase ID tokens on every request.</span>
          </div>
        </div>

        {/* Firebase Config Notice if unset */}
        {!isFirebaseReady && (
          <div className="bg-[#efefe9] border border-[#d4d4bc] rounded-2xl p-4 text-xs text-[#5a5a40] flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-[#5a5a40] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Firebase Credentials Pending</span>
              <p className="text-[#737362]">
                To sign in with your real Firebase account, configure your <code className="font-mono bg-[#e2e2d8] px-1 rounded text-[#4a4a38]">VITE_FIREBASE_*</code> keys in <code className="font-mono bg-[#e2e2d8] px-1 rounded text-[#4a4a38]">.env</code>.
              </p>
              <button
                type="button"
                onClick={onOpenGuide}
                className="text-[#5a5a40] underline font-semibold hover:text-[#3d3d3d] block pt-0.5"
              >
                View Step-by-Step Setup Guide →
              </button>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          id="btn-google-signin"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-[#e2e2d8] rounded-2xl font-medium text-sm text-[#4a4a38] hover:bg-[#fafaf7] hover:border-[#5a5a40]/30 focus:outline-none focus:ring-2 focus:ring-[#5a5a40]/20 transition-all disabled:opacity-50 shadow-2xs"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#e2e2d8] w-full" />
          <span className="bg-white px-3 text-[10px] text-[#a3a393] uppercase font-bold tracking-widest">
            Or with email
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#efefe9] p-1 rounded-2xl border border-[#e2e2d8] text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-xl transition-colors ${
              mode === "login"
                ? "bg-white text-[#4a4a38] shadow-2xs font-semibold"
                : "text-[#8e8e7c] hover:text-[#4a4a38]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-xl transition-colors ${
              mode === "signup"
                ? "bg-white text-[#4a4a38] shadow-2xs font-semibold"
                : "text-[#8e8e7c] hover:text-[#4a4a38]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium text-[#4a4a38] mb-1">
                Your Name (optional)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 h-4 w-4 text-[#a3a393]" />
                <input
                  id="input-displayname"
                  type="text"
                  placeholder="Maya Angelou"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#f5f5f0] border border-[#e2e2d8] rounded-2xl text-sm text-[#3d3d3d] placeholder:text-[#a3a393] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5a5a40]/20 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#4a4a38] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#a3a393]" />
              <input
                id="input-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#f5f5f0] border border-[#e2e2d8] rounded-2xl text-sm text-[#3d3d3d] placeholder:text-[#a3a393] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5a5a40]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4a4a38] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#a3a393]" />
              <input
                id="input-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#f5f5f0] border border-[#e2e2d8] rounded-2xl text-sm text-[#3d3d3d] placeholder:text-[#a3a393] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5a5a40]/20 transition-all"
              />
            </div>
          </div>

          <button
            id="btn-submit-auth"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#5a5a40] hover:bg-[#4a4a34] text-white rounded-2xl text-sm font-medium transition-all disabled:opacity-50 shadow-xs"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === "login" ? "Sign In to Journal" : "Create Account"}</span>
                <ArrowRight className="h-4 w-4 text-[#d4d4bc]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
