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