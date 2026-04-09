export const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";

export const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
});

export const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr.startsWith("0001")) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0)  return { label: `${Math.abs(days)}d overdue`, overdue: true };
  if (days === 0) return { label: "Due today", overdue: false };
  if (days === 1) return { label: "Due tomorrow", overdue: false };
  return { label: `${d.toLocaleDateString("en", { month: "short", day: "numeric" })}`, overdue: false };
};

export const PRIORITY_CONFIG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  high:   { color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",    dot: "bg-red-400",    label: "High"   },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", dot: "bg-yellow-400", label: "Medium" },
  low:    { color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", label: "Low" },
};

export const COLUMN_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  "todo":        { color: "text-zinc-400",   bg: "bg-zinc-500/10",    border: "border-zinc-500/20",   glow: "shadow-zinc-500/10"   },
  "in progress": { color: "text-violet-400", bg: "bg-violet-500/10",  border: "border-violet-500/20", glow: "shadow-violet-500/20" },
  "completed":   { color: "text-emerald-400",bg: "bg-emerald-500/10", border: "border-emerald-500/20",glow: "shadow-emerald-500/10"},
};