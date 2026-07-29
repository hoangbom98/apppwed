"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  MessageSquare,
  X,
  Save,
  AlertTriangle,
  ChevronDown,
  Filter,
  ListTodo,
  Loader2,
  Calendar,
  Flag,
  User,
  Layers,
  Send,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus   = "todo" | "in_progress" | "done" | "cancelled";
type TaskPriority = "critical" | "high" | "medium" | "low";
type SprintStatus = "active" | "completed" | "cancelled";
type FilterType   = "all" | "todo" | "in_progress" | "done";

interface Sprint {
  id: number;
  name: string;
  project: string;
  startDate: string;
  endDate: string;
  goal: string | null;
  status: SprintStatus;
  taskStats?: { total: number; done: number; progress: number };
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  project: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number | null;
  assigneeName: string | null;
  sprintId: number | null;
  sprint?: { id: number; name: string } | null;
  dueDate: string | null;
  completedAt: string | null;
  tags: string[];
  result: string | null;
  createdAt: string;
  _count?: { comments: number };
}

interface Comment {
  id: number;
  taskId: number;
  authorId: number | null;
  authorName: string | null;
  content: string;
  createdAt: string;
}

interface Stats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  dueSoon: number;
  sprintProgress: {
    sprint: Sprint;
    total: number;
    done: number;
    progress: number;
  } | null;
  velocity: { day: string; count: number }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECTS = ["hub", "game", "trade", "dating", "sports", "admin", "all"];
const PRIORITIES: TaskPriority[] = ["critical", "high", "medium", "low"];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high:     "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low:      "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-400",
  medium:   "bg-amber-400",
  low:      "bg-blue-400",
};

const PROJECT_COLORS: Record<string, string> = {
  hub:     "bg-blue-500/15 text-blue-300 border-blue-500/25",
  game:    "bg-amber-500/15 text-amber-300 border-amber-500/25",
  trade:   "bg-green-500/15 text-green-300 border-green-500/25",
  dating:  "bg-pink-500/15 text-pink-300 border-pink-500/25",
  sports:  "bg-purple-500/15 text-purple-300 border-purple-500/25",
  admin:   "bg-fortress-gold/15 text-fortress-gold border-fortress-gold/25",
  all:     "bg-white/10 text-white/60 border-white/20",
};

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  todo:        "in_progress",
  in_progress: "done",
  done:        "todo",
  cancelled:   "todo",
};

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h trước`;
  return `${Math.floor(h / 24)}d trước`;
}

// ─── Task Form Modal ──────────────────────────────────────────────────────────

function TaskModal({
  task,
  sprints,
  onClose,
  onSaved,
}: {
  task: Task | null;
  sprints: Sprint[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title:       task?.title       ?? "",
    description: task?.description ?? "",
    project:     task?.project     ?? "hub",
    priority:    (task?.priority   ?? "medium") as TaskPriority,
    assigneeName: task?.assigneeName ?? "",
    sprintId:    task?.sprintId    ?? null as number | null,
    dueDate:     task?.dueDate     ? task.dueDate.slice(0, 10) : "",
    status:      (task?.status     ?? "todo") as TaskStatus,
    result:      task?.result      ?? "",
    tags:        (task?.tags ?? []).join(", "),
  });
  const [saving, setSaving] = useState(false);

  function up<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Tiêu đề không được để trống"); return; }
    setSaving(true);
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description || null,
        project:     form.project,
        priority:    form.priority,
        assigneeName: form.assigneeName || null,
        sprintId:    form.sprintId,
        dueDate:     form.dueDate || null,
        status:      form.status,
        result:      form.result || null,
        tags:        form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      const url    = isEdit ? `/api/admin/workspace/tasks/${task!.id}` : "/api/admin/workspace/tasks";
      const method = isEdit ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Lỗi"); }
      toast.success(isEdit ? "Đã cập nhật task" : "Đã tạo task mới");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#07111D] border border-fortress-gold/20 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#07111D] border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-fortress-ivory">
            {isEdit ? "Chỉnh sửa task" : "Tạo task mới"}
          </h2>
          <button onClick={onClose} className="p-1.5 text-fortress-silver/40 hover:text-fortress-ivory rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Tiêu đề *</label>
            <input
              type="text" value={form.title} onChange={(e) => up("title", e.target.value)} required
              placeholder="Mô tả công việc cần làm..."
              className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 placeholder-fortress-silver/30 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Mô tả</label>
            <textarea
              value={form.description} onChange={(e) => up("description", e.target.value)} rows={3}
              placeholder="Chi tiết công việc, yêu cầu, ghi chú..."
              className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 placeholder-fortress-silver/30 resize-none transition-colors"
            />
          </div>

          {/* Project + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Dự án</label>
              <select value={form.project} onChange={(e) => up("project", e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors">
                {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Ưu tiên</label>
              <select value={form.priority} onChange={(e) => up("priority", e.target.value as TaskPriority)}
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Assignee + Sprint */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Người thực hiện</label>
              <input type="text" value={form.assigneeName} onChange={(e) => up("assigneeName", e.target.value)}
                placeholder="Tên thành viên..."
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 placeholder-fortress-silver/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Sprint</label>
              <select value={form.sprintId ?? ""} onChange={(e) => up("sprintId", e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors">
                <option value="">— Không có —</option>
                {sprints.filter((s) => s.status === "active").map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Ngày hết hạn</label>
              <input type="date" value={form.dueDate} onChange={(e) => up("dueDate", e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Trạng thái</label>
              <select value={form.status} onChange={(e) => up("status", e.target.value as TaskStatus)}
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors">
                <option value="todo">Cần làm</option>
                <option value="in_progress">Đang làm</option>
                <option value="done">Hoàn thành</option>
                <option value="cancelled">Huỷ</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Tags (phân cách bằng dấu phẩy)</label>
            <input type="text" value={form.tags} onChange={(e) => up("tags", e.target.value)}
              placeholder="frontend, bug, urgent..."
              className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 placeholder-fortress-silver/30 transition-colors"
            />
          </div>

          {/* Result (only when editing) */}
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Kết quả / Ghi chú hoàn thành</label>
              <textarea value={form.result} onChange={(e) => up("result", e.target.value)} rows={2}
                placeholder="Kết quả đạt được, link PR, ghi chú..."
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 placeholder-fortress-silver/30 resize-none transition-colors"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 border border-white/10 text-fortress-silver/70 text-sm font-semibold hover:border-white/20 hover:text-fortress-ivory transition-all rounded-xl">
              Huỷ
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-all rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-fortress-navy/30 border-t-fortress-navy rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Đang lưu…" : isEdit ? "Cập nhật" : "Tạo task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sprint Modal ─────────────────────────────────────────────────────────────

function SprintModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", project: "all", startDate: "", endDate: "", goal: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      toast.error("Vui lòng điền đầy đủ tên, ngày bắt đầu và kết thúc");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/workspace/sprints", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Lỗi");
      toast.success("Đã tạo sprint");
      onSaved(); onClose();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Lỗi"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#07111D] border border-fortress-gold/20 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-fortress-ivory">Tạo Sprint mới</h2>
          <button onClick={onClose} className="p-1.5 text-fortress-silver/40 hover:text-fortress-ivory rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Tên Sprint *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              placeholder="Sprint tháng 7, Q3 2025..."
              className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 placeholder-fortress-silver/30 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Dự án</label>
              <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors">
                {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Ngày bắt đầu *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Ngày kết thúc *</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required
              className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-fortress-silver/60 mb-1.5 uppercase tracking-wide">Mục tiêu Sprint</label>
            <textarea value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} rows={2}
              placeholder="Mục tiêu hoàn thành trong sprint này..."
              className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 placeholder-fortress-silver/30 resize-none transition-colors"
            />
          </div>
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 border border-white/10 text-fortress-silver/70 text-sm font-semibold hover:border-white/20 hover:text-fortress-ivory transition-all rounded-xl">
              Huỷ
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-all rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-fortress-navy/30 border-t-fortress-navy rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? "Đang tạo…" : "Tạo Sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Detail Drawer ───────────────────────────────────────────────────────

function TaskDetail({ task, onClose, onUpdated }: { task: Task; onClose: () => void; onUpdated: () => void }) {
  const [comments, setComments]   = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending]     = useState(false);
  const [fullTask, setFullTask]   = useState<Task & { comments?: Comment[] }>(task);

  useEffect(() => {
    fetch(`/api/admin/workspace/tasks/${task.id}`)
      .then((r) => r.json())
      .then((d) => {
        setFullTask(d);
        setComments(d.comments ?? []);
      })
      .catch(() => {});
  }, [task.id]);

  async function sendComment() {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/workspace/tasks/${task.id}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newComment }),
      });
      if (!res.ok) throw new Error();
      const c = await res.json();
      setComments((p) => [...p, c]);
      setNewComment("");
      onUpdated();
    } catch { toast.error("Không gửi được comment"); }
    finally { setSending(false); }
  }

  async function deleteComment(commentId: number) {
    await fetch(`/api/admin/workspace/tasks/${task.id}/comments/${commentId}`, { method: "DELETE" });
    setComments((p) => p.filter((c) => c.id !== commentId));
    onUpdated();
  }

  const now   = new Date();
  const due   = fullTask.dueDate ? new Date(fullTask.dueDate) : null;
  const overdue = due && fullTask.status !== "done" && due < now;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#07111D] border-l border-fortress-gold/10 w-full max-w-md flex flex-col h-screen shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between shrink-0">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[fullTask.priority]}`}>
                {fullTask.priority}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PROJECT_COLORS[fullTask.project] ?? "bg-white/10 text-white/60 border-white/20"}`}>
                {fullTask.project}
              </span>
            </div>
            <h3 className="text-sm font-bold text-fortress-ivory leading-snug">{fullTask.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-fortress-silver/40 hover:text-fortress-ivory rounded-lg hover:bg-white/5 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: User,     label: "Thực hiện", value: fullTask.assigneeName ?? "Chưa giao" },
              { icon: Calendar, label: "Deadline",  value: fmtDate(fullTask.dueDate) ?? "Không có", extra: overdue ? "text-red-400" : "" },
              { icon: Layers,   label: "Sprint",    value: fullTask.sprint?.name ?? "Ngoài sprint" },
              { icon: Flag,     label: "Tạo lúc",   value: fmtDate(fullTask.createdAt) ?? "" },
            ].map((m) => (
              <div key={m.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className="w-3 h-3 text-fortress-silver/40" />
                  <span className="text-[10px] text-fortress-silver/40 uppercase tracking-wide">{m.label}</span>
                </div>
                <p className={`text-xs font-semibold text-fortress-ivory ${m.extra ?? ""}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {fullTask.description && (
            <div>
              <p className="text-[10px] font-semibold text-fortress-silver/40 uppercase tracking-wide mb-2">Mô tả</p>
              <p className="text-sm text-fortress-silver/80 leading-relaxed whitespace-pre-wrap">{fullTask.description}</p>
            </div>
          )}

          {/* Result */}
          {fullTask.result && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wide mb-1.5">Kết quả</p>
              <p className="text-sm text-green-300/80 leading-relaxed whitespace-pre-wrap">{fullTask.result}</p>
            </div>
          )}

          {/* Tags */}
          {fullTask.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {fullTask.tags.map((tag) => (
                <span key={tag} className="text-[10px] bg-white/5 text-fortress-silver/60 border border-white/10 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-[10px] font-semibold text-fortress-silver/40 uppercase tracking-wide mb-3">
              Ghi chú / Bình luận ({comments.length})
            </p>
            <div className="space-y-2.5">
              {comments.length === 0 && (
                <p className="text-xs text-fortress-silver/30 text-center py-4">Chưa có ghi chú nào.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-fortress-gold">{c.authorName ?? "Admin"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-fortress-silver/30">{timeAgo(c.createdAt)}</span>
                      <button onClick={() => deleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400/50 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-fortress-silver/70 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comment input */}
        <div className="shrink-0 p-4 border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
              placeholder="Thêm ghi chú..."
              className="flex-1 bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-fortress-gold/40 placeholder-fortress-silver/30 transition-colors"
            />
            <button onClick={sendComment} disabled={sending || !newComment.trim()}
              className="p-2.5 bg-fortress-gold hover:bg-fortress-champagne text-fortress-navy rounded-lg transition-colors disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onStatusToggle,
  onEdit,
  onDelete,
  onOpenDetail,
}: {
  task: Task;
  onStatusToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onOpenDetail: (t: Task) => void;
}) {
  const now     = new Date();
  const due     = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = due && task.status !== "done" && due < now;
  const soon    = due && task.status !== "done" && !overdue && due.getTime() - now.getTime() < 2 * 86400000;

  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors group border-b border-white/[0.04] last:border-0 ${task.status === "done" ? "opacity-60" : ""}`}>
      {/* Status toggle */}
      <button onClick={() => onStatusToggle(task)} className="mt-0.5 shrink-0 text-fortress-silver/40 hover:text-fortress-gold transition-colors" title="Đổi trạng thái">
        {task.status === "done"        ? <CheckCircle2 className="w-5 h-5 text-green-400" /> :
         task.status === "in_progress" ? <Clock className="w-5 h-5 text-amber-400 animate-pulse" /> :
         task.status === "cancelled"   ? <X className="w-5 h-5 text-red-400/60" /> :
                                         <Circle className="w-5 h-5" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpenDetail(task)}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={`text-sm font-medium leading-snug ${task.status === "done" ? "line-through text-fortress-silver/40" : "text-fortress-ivory"}`}>
            {task.title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          {/* Priority dot */}
          <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
          {/* Project */}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${PROJECT_COLORS[task.project] ?? "bg-white/10 text-white/60 border-white/20"}`}>
            {task.project}
          </span>
          {/* Assignee */}
          {task.assigneeName && (
            <span className="text-[10px] text-fortress-silver/50 flex items-center gap-0.5">
              <User className="w-2.5 h-2.5" />{task.assigneeName}
            </span>
          )}
          {/* Due date */}
          {due && (
            <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? "text-red-400" : soon ? "text-amber-400" : "text-fortress-silver/40"}`}>
              {overdue && <AlertTriangle className="w-2.5 h-2.5" />}
              <Calendar className="w-2.5 h-2.5" />
              {fmtDate(task.dueDate)}
            </span>
          )}
          {/* Comment count */}
          {(task._count?.comments ?? 0) > 0 && (
            <span className="text-[10px] text-fortress-silver/40 flex items-center gap-0.5">
              <MessageSquare className="w-2.5 h-2.5" />{task._count!.comments}
            </span>
          )}
          {/* Tags */}
          {task.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] bg-white/5 text-fortress-silver/40 border border-white/10 px-1.5 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onEdit(task)} className="p-1.5 text-fortress-silver/40 hover:text-fortress-gold hover:bg-fortress-gold/10 rounded-lg transition-colors" title="Sửa">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(task)} className="p-1.5 text-fortress-silver/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Xoá">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [tasks,    setTasks]    = useState<Task[]>([]);
  const [sprints,  setSprints]  = useState<Sprint[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<FilterType>("all");
  const [project,  setProject]  = useState("all");
  const [sprint,   setSprint]   = useState<number | "all">("all");
  const [modal,    setModal]    = useState<"task" | "sprint" | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [detail,   setDetail]   = useState<Task | null>(null);
  const [total,    setTotal]    = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter  !== "all") params.set("status",  filter);
    if (project !== "all") params.set("project", project);
    if (sprint  !== "all") params.set("sprintId", String(sprint));
    params.set("limit", "100");

    const [tRes, sRes, stRes] = await Promise.all([
      fetch(`/api/admin/workspace/tasks?${params}`),
      fetch("/api/admin/workspace/sprints"),
      fetch("/api/admin/workspace/stats"),
    ]);

    const tData  = tRes.ok  ? await tRes.json()  : { tasks: [], total: 0 };
    const sData  = sRes.ok  ? await sRes.json()  : [];
    const stData = stRes.ok ? await stRes.json() : null;

    setTasks(tData.tasks ?? []);
    setTotal(tData.total ?? 0);
    setSprints(Array.isArray(sData) ? sData : []);
    setStats(stData);
    setLoading(false);
  }, [filter, project, sprint]);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(task: Task) {
    const next = STATUS_NEXT[task.status];
    await fetch(`/api/admin/workspace/tasks/${task.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
    });
    toast.success(next === "done" ? "✅ Đã hoàn thành!" : `Chuyển sang: ${next}`);
    load();
  }

  async function deleteTask(task: Task) {
    if (!confirm(`Xoá task "${task.title}"?`)) return;
    await fetch(`/api/admin/workspace/tasks/${task.id}`, { method: "DELETE" });
    toast.success("Đã xoá task");
    load();
  }

  const activeSprint = sprints.find((s) => s.status === "active");

  const FILTER_TABS: { key: FilterType; label: string; count: number }[] = [
    { key: "all",         label: "Tất cả",       count: stats?.total      ?? 0 },
    { key: "todo",        label: "Cần làm",       count: stats?.todo       ?? 0 },
    { key: "in_progress", label: "Đang làm",      count: stats?.inProgress ?? 0 },
    { key: "done",        label: "Hoàn thành",    count: stats?.done       ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Workspace" />

      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fortress-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

        <AdminNavbar title="Workspace Tracker" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-fortress-ivory tracking-tight flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-fortress-gold" />
                Team Workspace
              </h1>
              <p className="text-fortress-silver/50 text-sm mt-0.5">
                {total} task · {stats?.inProgress ?? 0} đang chạy · {stats?.overdue ?? 0} quá hạn
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} disabled={loading} className="p-2.5 border border-white/10 text-fortress-silver/50 hover:text-fortress-gold hover:border-fortress-gold/30 transition-all rounded-lg disabled:opacity-40">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => setModal("sprint")}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-white/10 text-fortress-silver/70 text-sm font-semibold hover:border-fortress-gold/30 hover:text-fortress-gold transition-all rounded-lg">
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Sprint</span>
              </button>
              <button onClick={() => { setEditTask(null); setModal("task"); }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-all rounded-lg shadow-lg shadow-fortress-gold/10">
                <Plus className="w-4 h-4" />
                Tạo task
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Tổng task",     value: stats?.total      ?? 0, color: "text-fortress-gold",  bg: "bg-fortress-gold/10" },
              { label: "Đang làm",      value: stats?.inProgress ?? 0, color: "text-amber-400",     bg: "bg-amber-500/10" },
              { label: "Hoàn thành",    value: stats?.done       ?? 0, color: "text-green-400",     bg: "bg-green-500/10" },
              { label: "Quá hạn",       value: stats?.overdue    ?? 0, color: "text-red-400",       bg: "bg-red-500/10" },
            ].map((s) => (
              <div key={s.label} className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center ${s.color} shrink-0`}>
                  <span className="text-lg font-extrabold">{loading ? "—" : s.value}</span>
                </div>
                <p className="text-[11px] text-fortress-silver/40 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Active Sprint Bar */}
          {activeSprint && stats?.sprintProgress && (
            <div className="bg-[#07111D]/60 backdrop-blur-xl border border-fortress-gold/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-fortress-gold/10 rounded-lg flex items-center justify-center">
                    <Layers className="w-4 h-4 text-fortress-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-fortress-ivory">{activeSprint.name}</p>
                    {activeSprint.goal && <p className="text-[11px] text-fortress-silver/40 mt-0.5">{activeSprint.goal}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-fortress-gold">{stats.sprintProgress.progress}%</p>
                  <p className="text-[11px] text-fortress-silver/40">{stats.sprintProgress.done}/{stats.sprintProgress.total} task</p>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-fortress-gold to-fortress-champagne transition-all duration-700"
                  style={{ width: `${stats.sprintProgress.progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-fortress-silver/30">
                  {fmtDate(activeSprint.startDate)}
                </span>
                <span className="text-[10px] text-fortress-silver/30">
                  {fmtDate(activeSprint.endDate)}
                </span>
              </div>
            </div>
          )}

          {/* Velocity Sparkline */}
          {stats?.velocity && stats.velocity.some((v) => v.count > 0) && (
            <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl p-5">
              <p className="text-xs font-semibold text-fortress-silver/50 uppercase tracking-wide mb-3">Velocity 7 ngày qua</p>
              <div className="flex items-end gap-1 h-12">
                {stats.velocity.map((v) => {
                  const maxVal = Math.max(...stats!.velocity.map((x) => x.count), 1);
                  const pct = (v.count / maxVal) * 100;
                  return (
                    <div key={v.day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-white/5 rounded-sm relative" style={{ height: 40 }}>
                        <div className="absolute bottom-0 left-0 right-0 bg-fortress-gold/60 rounded-sm transition-all"
                          style={{ height: `${pct}%` }} />
                      </div>
                      <span className="text-[8px] text-fortress-silver/30">{v.day.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl p-4 space-y-3">
            {/* Status tabs */}
            <div className="flex gap-1 flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button key={tab.key} onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filter === tab.key
                      ? "bg-fortress-gold text-fortress-navy"
                      : "text-fortress-silver/50 hover:bg-white/5 hover:text-fortress-ivory"
                  }`}>
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === tab.key ? "bg-fortress-navy/20" : "bg-white/10"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Project + Sprint filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-3.5 h-3.5 text-fortress-silver/30 shrink-0" />
              <select value={project} onChange={(e) => setProject(e.target.value)}
                className="bg-white/5 border border-white/10 text-fortress-silver/70 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-fortress-gold/30 transition-colors">
                <option value="all">Tất cả dự án</option>
                {PROJECTS.filter((p) => p !== "all").map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={sprint} onChange={(e) => setSprint(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="bg-white/5 border border-white/10 text-fortress-silver/70 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-fortress-gold/30 transition-colors">
                <option value="all">Tất cả sprint</option>
                {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-[#07111D]/80 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-fortress-gold animate-spin" />
                <span className="ml-2 text-sm text-fortress-silver/50">Đang tải...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <ListTodo className="w-10 h-10 text-fortress-silver/20 mb-3" />
                <p className="text-fortress-ivory/50 font-medium text-sm mb-1">Chưa có task nào</p>
                <p className="text-fortress-silver/30 text-xs">Nhấn "Tạo task" để bắt đầu.</p>
              </div>
            ) : (
              <div>
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onStatusToggle={toggleStatus}
                    onEdit={(t) => { setEditTask(t); setModal("task"); }}
                    onDelete={deleteTask}
                    onOpenDetail={setDetail}
                  />
                ))}
                {total > tasks.length && (
                  <div className="px-4 py-3 border-t border-white/5 text-xs text-fortress-silver/30 text-center">
                    Hiển thị {tasks.length} / {total} task
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {modal === "task" && (
        <TaskModal task={editTask} sprints={sprints} onClose={() => { setModal(null); setEditTask(null); }} onSaved={load} />
      )}
      {modal === "sprint" && (
        <SprintModal onClose={() => setModal(null)} onSaved={load} />
      )}
      {detail && (
        <TaskDetail task={detail} onClose={() => setDetail(null)} onUpdated={load} />
      )}
    </div>
  );
}
