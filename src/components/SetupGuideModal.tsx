import React, { useState } from "react";
import {
  X,
  Shield,
  Key,
  Server,
  Terminal,
  ExternalLink,
  Check,
  Copy,
  Layers,
  AlertTriangle,
  FileCode,
} from "lucide-react";

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#3d3d3d]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#f5f5f0] border border-[#e2e2d8] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e2d8] flex items-center justify-between bg-[#efefe9]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#5a5a40] text-white flex items-center justify-center shadow-xs">
              <Shield className="h-4 w-4 text-[#d4d4bc]" />
            </div>
            <div>
              <h2 className="text-base font-serif italic text-[#5a5a40]">
                Security Architecture & Setup Guide
              </h2>
              <p className="text-xs text-[#8e8e7c]">
                Firebase Console setup, Cloud Run deployment, Secret Manager, & Local execution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8e8e7c] hover:text-[#3d3d3d] rounded-xl hover:bg-[#e2e2d8] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-8 text-xs text-[#3d3d3d] leading-relaxed">
          {/* Section 1: Firebase Services to Enable */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[#5a5a40] text-white font-bold flex items-center justify-center text-xs">
                1
              </span>
              <h3 className="text-sm font-serif italic text-[#5a5a40]">
                Exact Firebase Services to Enable in the Firebase Console
              </h3>
            </div>
            <p className="text-[#737362] pl-8">
              Navigate to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-[#5a5a40] underline inline-flex items-center gap-0.5 font-semibold">Firebase Console <ExternalLink className="h-3 w-3" /></a> and enable:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
              <div className="p-4 bg-white border border-[#e2e2d8] rounded-2xl space-y-2 shadow-xs">
                <div className="font-semibold text-[#5a5a40] flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-[#5a5a40]" />
                  <span>1. Firebase Authentication</span>
                </div>
                <ul className="space-y-1 text-[#737362] pl-4 list-disc">
                  <li>Go to <strong>Build &gt; Authentication &gt; Sign-in method</strong>.</li>
                  <li>Enable <strong>Google</strong> (select your project support email).</li>
                  <li>Enable <strong>Email/Password</strong> (leave Email link disabled).</li>
                  <li>Add your authorized domain (e.g., <code className="bg-[#efefe9] text-[#5a5a40] px-1 py-0.5 rounded">localhost</code> for dev).</li>
                </ul>
              </div>

              <div className="p-4 bg-white border border-[#e2e2d8] rounded-2xl space-y-2 shadow-xs">
                <div className="font-semibold text-[#5a5a40] flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-[#5a5a40]" />
                  <span>2. Cloud Firestore Database</span>
                </div>
                <ul className="space-y-1 text-[#737362] pl-4 list-disc">
                  <li>Go to <strong>Build &gt; Firestore Database &gt; Create Database</strong>.</li>
                  <li>Choose <strong>Start in production mode</strong> (locks down reads/writes by default).</li>
                  <li>Select your nearest cloud location (e.g. <code className="bg-[#efefe9] text-[#5a5a40] px-1 py-0.5 rounded">us-central1</code>).</li>
                  <li>Deploy the rules from <code className="bg-[#efefe9] text-[#5a5a40] px-1 py-0.5 rounded">firestore.rules</code>.</li>
                </ul>
              </div>
            </div>

            <div className="pl-8 pt-1">
              <h4 className="font-semibold text-[#5a5a40] mb-1">How to obtain your Web Config keys:</h4>
              <p className="text-[#737362]">
                Go to <strong>Project settings (gear icon) &gt; General &gt; "Your apps"</strong>. Click the <strong>Web (&lt;/&gt;)</strong> icon, register an app name, and copy the values into your <code className="bg-[#efefe9] text-[#5a5a40] px-1.5 py-0.5 rounded">.env</code> file (prefixed with <code className="bg-[#efefe9] text-[#5a5a40] px-1.5 py-0.5 rounded">VITE_FIREBASE_*</code>).
              </p>
            </div>
          </section>

          {/* Section 2: Node/Express vs Cloud Functions on Cloud Run */}
          <section className="space-y-3 border-t border-[#e2e2d8] pt-6">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[#5a5a40] text-white font-bold flex items-center justify-center text-xs">
                2
              </span>
              <h3 className="text-sm font-serif italic text-[#5a5a40]">
                Deployment Architecture: Node/Express vs Cloud Functions on Cloud Run
              </h3>
            </div>

            <div className="pl-8 space-y-3">
              <div className="p-4 bg-[#efefe9] border border-[#d4d4bc] rounded-2xl space-y-2">
                <span className="font-semibold text-[#5a5a40] text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Server className="h-4 w-4 text-[#5a5a40]" />
                  <span>Recommendation: Node/Express Container (Unified Full-Stack)</span>
                </span>
                <p className="text-[#4a4a38] text-xs">
                  For deploying to <strong>Google Cloud Run</strong>, a single <strong>Node/Express container</strong> is significantly easier and more cost-effective than managing separate Cloud Functions:
                </p>
                <ul className="space-y-1 text-[#4a4a38] pl-4 list-disc text-xs">
                  <li><strong>Single Container Lifecycle:</strong> The Express server handles both API endpoints (<code className="bg-[#e2e2d8] px-1 rounded">/api/*</code>) and static client assets (<code className="bg-[#e2e2d8] px-1 rounded">dist/</code>) in one container.</li>
                  <li><strong>No CORS Friction:</strong> Requests to <code className="bg-[#e2e2d8] px-1 rounded">/api/chat</code> and <code className="bg-[#e2e2d8] px-1 rounded">/api/summarize</code> are same-origin.</li>
                  <li><strong>Centralized Secret Injection:</strong> Secret Manager binds directly to the single Cloud Run service without maintaining separate permissions across multiple functions.</li>
                  <li><strong>Zero Cold-Start Cascade:</strong> Keeps execution latency minimal for multi-turn AI chat.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Secret Manager vs Local Dev */}
          <section className="space-y-3 border-t border-[#e2e2d8] pt-6">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[#5a5a40] text-white font-bold flex items-center justify-center text-xs">
                3
              </span>
              <h3 className="text-sm font-serif italic text-[#5a5a40]">
                Secret Manager vs Local Development Configuration
              </h3>
            </div>

            <div className="pl-8 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 bg-white border border-[#e2e2d8] rounded-2xl space-y-2 shadow-xs">
                  <span className="font-semibold text-[#5a5a40]">Local Development (.env)</span>
                  <p className="text-[#737362]">
                    Store secrets in a local <code className="font-mono bg-[#efefe9] text-[#5a5a40] px-1 rounded">.env</code> file (which is git-ignored):
                  </p>
                  <pre className="p-3 bg-[#2b2b24] text-[#e2e2d8] rounded-xl text-[11px] font-mono overflow-x-auto">
{`GEMINI_API_KEY="AIzaSy..."
FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
PORT=3000`}
                  </pre>
                </div>

                <div className="p-4 bg-white border border-[#e2e2d8] rounded-2xl space-y-2 shadow-xs">
                  <span className="font-semibold text-[#5a5a40]">Production (Cloud Run + Secret Manager)</span>
                  <p className="text-[#737362]">
                    Create the secret in Google Cloud Secret Manager and attach it to Cloud Run:
                  </p>
                  <pre className="p-3 bg-[#2b2b24] text-[#e2e2d8] rounded-xl text-[11px] font-mono overflow-x-auto">
{`# 1. Create Secret in GCP Secret Manager
gcloud secrets create gemini-api-key \\
  --data-file=- <<< "your-gemini-api-key"

# 2. Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding gemini-api-key \\
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \\
  --role="roles/secretmanager.secretAccessor"

# 3. Mount Secret onto Cloud Run
gcloud run services update personal-gemini-journal \\
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest"`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Security Tradeoffs & Manual Config Checklist */}
          <section className="space-y-3 border-t border-[#e2e2d8] pt-6">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[#5a5a40] text-white font-bold flex items-center justify-center text-xs">
                4
              </span>
              <h3 className="text-sm font-serif italic text-[#5a5a40]">
                Security Tradeoffs & Manual Configuration Checklist
              </h3>
            </div>

            <div className="pl-8 space-y-2.5">
              <div className="p-4 bg-[#efefe9] border border-[#d4d4bc] rounded-2xl space-y-1 text-[#4a4a38]">
                <div className="flex items-center gap-1.5 font-semibold text-[#5a5a40]">
                  <AlertTriangle className="h-4 w-4 text-[#5a5a40]" />
                  <span>Security Tradeoffs & Safeguards:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#4a4a38]">
                  <li><strong>Token Verification Latency:</strong> Every <code className="bg-[#e2e2d8] px-1 rounded">/api/*</code> request performs cryptographically validated token checks via the Firebase Admin SDK. This adds a slight (~10-20ms) overhead for uncompromised zero-trust security.</li>
                  <li><strong>Direct Client Firestore vs API Proxy:</strong> We implement hardened <code className="bg-[#e2e2d8] px-1 rounded">firestore.rules</code> with path variable checks and <code className="bg-[#e2e2d8] px-1 rounded">request.auth.uid == userId</code>. This allows client real-time synchronization while preventing unauthorized cross-user reading or writes.</li>
                </ul>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="font-semibold text-[#5a5a40]">Manual IAM & Firebase Commands to run:</span>
                <div className="p-3.5 bg-[#2b2b24] text-[#e2e2d8] rounded-2xl font-mono text-[11px] space-y-2">
                  <p className="text-[#a3a393]"># Deploy Firestore Security Rules:</p>
                  <p className="text-[#d4d4bc]">firebase deploy --only firestore:rules</p>
                  <p className="text-[#a3a393]"># Run locally:</p>
                  <p className="text-[#d4d4bc]">npm install && npm run dev</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e2e2d8] bg-[#efefe9] flex items-center justify-between">
          <span className="text-xs text-[#737362]">
            All code adheres strictly to production zero-trust standards.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#5a5a40] text-white rounded-2xl text-xs font-medium hover:bg-[#4a4a34] transition-colors shadow-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
