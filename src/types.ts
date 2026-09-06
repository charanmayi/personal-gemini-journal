export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  summary: string;
  insights: string[];
  tags: string[];
  mood?: string;
  messageCount?: number;
  createdAt: any;
  updatedAt?: any;
}

export interface JournalSummaryPayload {
  title: string;
  summary: string;
  insights: string[];
  tags: string[];
  mood: string;
}

export interface ChatApiResponse {
  reply: string;
  turnCount: number;
}

export interface SummarizeApiResponse {
  title: string;
  summary: string;
  insights: string[];
  tags: string[];
  mood: string;
}

export interface FirebaseConfigState {
  isConfigured: boolean;
  projectId?: string;
}
