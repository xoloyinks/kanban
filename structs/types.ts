export interface User {
  id: string;
  name: string;
  email: string;
  teams: string[]; // Array of team IDs the user belongs to
}

export interface Team {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface Board {
  id: string;
  name: string;
  destination_id: string;
}

export interface Column { 
  id: string; 
  name: string; 
  board_id: string; 
}
export interface Task {
  id: string; title: string; description: string;
  destination_id: string; board_id: string; column_id?: string;
  priority: string; category: string; due_date: string;
  created_at: string; updated_at: string;
  column: Column;
}

export interface PaginatedTasks { 
  data: Task[]; 
  pagination: { 
    page: number; 
    limit: number; 
    total: number; 
    total_pages: number; 
    has_next: boolean; 
    has_prev: boolean; 
  }; 
}

export interface ColumnDef {
  id: string; // server column id (may be empty if no tasks yet)
  name: "todo" | "in progress" | "completed";
  tasks: Task[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const FIXED_COLUMNS: Array<"todo" | "in progress" | "completed"> = [
  "todo",
  "in progress",
  "completed",
];

export const PRIORITY: Record<string, { label: string; color: string; bg: string; dot: string; ring: string }> = {
  high:   { label: "High",   color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",       dot: "bg-red-400",     ring: "ring-red-500/30"    },
  medium: { label: "Medium", color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-400",  ring: "ring-yellow-500/30" },
  low:    { label: "Low",    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",dot: "bg-emerald-400", ring: "ring-emerald-500/30"},
};
export const COLUMN: Record<string, { color: string; bg: string; dot: string }> = {
  "todo":        { color: "text-zinc-400",    bg: "bg-zinc-800",         dot: "bg-zinc-500"    },
  "in progress": { color: "text-violet-400",  bg: "bg-violet-500/10",    dot: "bg-violet-400"  },
  "completed":   { color: "text-emerald-400", bg: "bg-emerald-500/10",   dot: "bg-emerald-400" },
};
