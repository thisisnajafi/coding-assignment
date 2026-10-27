export type Role = "employee" | "it";
export type Status = "open" | "in_progress" | "closed";
export type Category = "hardware" | "network" | "software" | "access";
export type Priority = "low" | "medium" | "high";

export interface User {
  id?: number;
  username: string;
  role: Role;
}

export interface Ticket {
  id: number;
  owner: string;
  title: string;
  body: string;
  category: Category | string | null;
  priority: Priority | string | null;
  status: Status | string;
  final_reply?: string | null;
  replied_at?: string | null;
  created_at: string;
  updated_at?: string;
  // IT-only fields (absent for employees)
  suggested_reply?: string | null;
  suggestion_source?: "ai" | "fallback" | string | null;
  suggestion_model?: string | null;
  suggestion_note?: string | null;
  replied_by?: string | null;
}

export interface MessageQuote {
  id: number;
  author: string;
  role: Role;
  snippet: string;
}

export interface Message {
  id: number;
  ticket_id: number;
  author: string;
  role: Role;
  body: string;
  reply_to_id: number | null;
  reply_to: MessageQuote | null;
  is_final: boolean;
  created_at: string;
}
