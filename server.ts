import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createServer as createViteServer } from "vite";

dotenv.config();

const PORT = 3000;

// Initialize Firebase Admin SDK for server-side ID token verification
let isFirebaseAdminReady = false;
try {
  if (getApps().length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
      });
      isFirebaseAdminReady = true;
      console.log("Firebase Admin initialized via Service Account Key JSON.");
    } else if (process.env.FIREBASE_PROJECT_ID) {
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      isFirebaseAdminReady = true;
      console.log(`Firebase Admin initialized with project ID: ${process.env.FIREBASE_PROJECT_ID}`);
    } else {
      // On Google Cloud (e.g. Cloud Run), ADC (Application Default Credentials) is auto-detected
      initializeApp();
      isFirebaseAdminReady = true;
      console.log("Firebase Admin initialized via default environment credentials.");
    }
  } else {
    isFirebaseAdminReady = true;
  }
} catch (error) {
  console.warn(
    "Firebase Admin initialization deferred (waiting for environment credentials / FIREBASE_PROJECT_ID):",
    error instanceof Error ? error.message : error
  );
}

// Lazy Gemini API Client instantiation (reads from GEMINI_API_KEY environment variable)
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Set this in .env or Secret Manager.");
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Typed Request for Authenticated Endpoints
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

// Input Sanitization Helper: Strips non-printable control codes, trims whitespace, and limits length
function sanitizeString(input: unknown, maxLength = 10000): string {
  if (typeof input !== "string") return "";
  // Strip control characters (preserve newlines \n, \r, tabs \t)
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  return cleaned.slice(0, maxLength);
}

// Middleware: Verify Firebase Auth ID Token (Rule 2: Reject unauthenticated requests with 401)
async function verifyFirebaseToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or malformed Authorization header. Expected 'Bearer <Firebase_ID_Token>'.",
    });
    return;
  }

  const idToken = authHeader.split("Bearer ")[1].trim();
  if (!idToken) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Empty token supplied in Authorization header.",
    });
    return;
  }

  if (!isFirebaseAdminReady && getApps().length === 0) {
    // If running in development without credentials yet, provide a clear actionable error
    res.status(401).json({
      error: "Unauthorized",
      message: "Server is pending Firebase configuration. Please set FIREBASE_PROJECT_ID in .env.",
    });
    return;
  }

  try {
    const authAdmin = getAuth();
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Token verification failed";
    console.error("Token verification rejected:", errorMsg);
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid, revoked, or expired Firebase ID token.",
    });
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // --- HEALTH / STATUS ENDPOINT ---
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      serverTime: new Date().toISOString(),
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      firebaseAdminConfigured: getApps().length > 0,
      projectId: process.env.FIREBASE_PROJECT_ID || "not_set",
    });
  });

  // --- MULTI-TURN GEMINI CHAT ENDPOINT ---
  // Verified with Firebase Auth token, preserves multi-turn context
  app.post("/api/chat", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { prompt, history } = req.body;

      // Validate & Sanitize Input (Rule 4)
      const sanitizedPrompt = sanitizeString(prompt, 4000);
      if (!sanitizedPrompt) {
        res.status(400).json({ error: "Invalid prompt", message: "Prompt must not be empty." });
        return;
      }

      // Format conversation history for @google/genai
      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history)) {
        // Enforce maximum history depth (e.g. last 20 turns) to prevent payload abuse
        const recentHistory = history.slice(-20);
        for (const item of recentHistory) {
          if (item && (item.role === "user" || item.role === "model") && typeof item.content === "string") {
            const cleanContent = sanitizeString(item.content, 4000);
            if (cleanContent) {
              contents.push({
                role: item.role,
                parts: [{ text: cleanContent }],
              });
            }
          }
        }
      }

      // Append current user prompt
      contents.push({
        role: "user",
        parts: [{ text: sanitizedPrompt }],
      });

      const ai = getGeminiClient();

      const systemInstruction = `You are a supportive, insightful personal journaling and creative brainstorming companion called "Gemini Journal".
Your role is to help the user:
- Reflect deeply on their day, emotions, aspirations, or challenges.
- Structure brainstorming sessions, explore novel perspectives, and break down complex ideas.
- Ask mindful, open-ended follow-up questions to stimulate deeper thought.
- Maintain an empathetic, non-judgmental, encouraging, and clear tone.
- Avoid robotic platitudes; be genuine, concise, and focused on personal growth.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || "I was unable to formulate a response. Please try again.";

      res.json({
        reply,
        turnCount: contents.length,
      });
    } catch (err: unknown) {
      console.error("Gemini Chat API error:", err);
      const message = err instanceof Error ? err.message : "Internal AI generation error";
      res.status(500).json({
        error: "AI generation failed",
        message,
      });
    }
  });

  // --- SESSION SUMMARIZATION & INSIGHT EXTRACTION ENDPOINT ---
  // Analyzes the full session transcript and extracts title, insights, mood, and markdown summary
  app.post("/api/summarize", verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "Invalid messages", message: "A conversation transcript is required to summarize." });
        return;
      }

      // Build transcript representation
      const transcript = messages
        .slice(-30)
        .map((m: { role?: string; content?: string }) => {
          const speaker = m.role === "user" ? "User" : "Gemini";
          return `${speaker}: ${sanitizeString(m.content, 2000)}`;
        })
        .join("\n\n");

      const ai = getGeminiClient();

      const summaryPrompt = `Analyze the following private journal / brainstorming session transcript and synthesize it into a structured journal entry.
Transcript:
---
${transcript}
---

You MUST respond strictly in valid JSON format with the following schema:
{
  "title": "A concise, evocative title for this journal entry (maximum 10 words)",
  "summary": "A cohesive, reflective 2-3 paragraph summary synthesizing the key thoughts, reflections, and emotional arc of the session.",
  "insights": [
    "3 to 5 distinct actionable takeaways, realizations, or brainstorm ideas"
  ],
  "tags": [
    "3 to 5 concise thematic tags (e.g. mindfulness, career, creative-writing)"
  ],
  "mood": "One or two words describing the prevailing emotional tone or mindset (e.g. Reflective, Motivated, Contemplative, Energized)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: summaryPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });

      const responseText = response.text || "{}";
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        // Fallback in case of raw markdown wrapped JSON
        const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedData = JSON.parse(cleaned);
      }

      res.json({
        title: sanitizeString(parsedData.title || "Untitled Journal Session", 150),
        summary: sanitizeString(parsedData.summary || "Summary generation in progress.", 5000),
        insights: Array.isArray(parsedData.insights)
          ? parsedData.insights.map((i: unknown) => sanitizeString(i, 300)).slice(0, 10)
          : [],
        tags: Array.isArray(parsedData.tags)
          ? parsedData.tags.map((t: unknown) => sanitizeString(t, 40).toLowerCase()).slice(0, 10)
          : ["journal"],
        mood: sanitizeString(parsedData.mood || "Reflective", 50),
      });
    } catch (err: unknown) {
      console.error("Gemini Summarize API error:", err);
      const message = err instanceof Error ? err.message : "Summarization failed";
      res.status(500).json({
        error: "Summarization failed",
        message,
      });
    }
  });

  // --- VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Personal Gemini Journal server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
