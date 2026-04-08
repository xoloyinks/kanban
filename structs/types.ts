export interface User {
  id: string;
  name: string;
  email: string;
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