"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Shield,
  ShieldCheck,
  RefreshCw,
  Clock,
  X,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  lastLogin: string | null;
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: "admin" | "superadmin";
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) {
    const hrs = Math.floor(diff / 3600000);
    if (hrs === 0) return "Just now";
    return `${hrs}h ago`;
  }
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

/* ─── Create / Edit Modal ───────────────────────────────────── */
function UserModal({
  editUser,
  onClose,
  onSaved,
}: {
  editUser: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editUser;
  const [form, setForm] = useState<UserFormData>({
    name: editUser?.name ?? "",
    email: editUser?.email ?? "",
    password: "",
    role: editUser?.role ?? "admin",
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  function up<K extends keyof UserFormData>(k: K, v: UserFormData[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!isEdit && !form.password) { toast.error("Password is required"); return; }
    setSaving(true);
    try {
      const body: Partial<UserFormData> = { name: form.name, role: form.role };
      if (!isEdit) { body.email = form.email; body.password = form.password; }
      else if (form.password) body.password = form.password;

      const url = isEdit ? `/api/admin/users/${editUser!.id}` : "/api/admin/users";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Operation failed");
      }
      toast.success(isEdit ? "User updated" : "User created");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#07111D] border border-fortress-gold/20 rounded-2xl shadow-2xl shadow-black/60 w-full max-w-md p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-fortress-silver/40 hover:text-fortress-ivory transition-colors rounded-lg hover:bg-white/5">
          <X className="w-4 h-4" />
        </button>
        <div className="w-10 h-10 bg-fortress-gold/10 border border-fortress-gold/20 rounded-xl flex items-center justify-center mb-4">
          <Users className="w-5 h-5 text-fortress-gold" />
        </div>
        <h2 className="text-lg font-bold text-fortress-ivory mb-5">{isEdit ? "Edit User" : "Create Admin User"}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-fortress-silver/60 mb-1.5">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => up("name", e.target.value)} required
              className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors" />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-fortress-silver/60 mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={(e) => up("email", e.target.value)} required
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-fortress-silver/60 mb-1.5">
              {isEdit ? "New Password (leave blank to keep)" : "Password"}
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => up("password", e.target.value)}
                placeholder={isEdit ? "Leave blank to keep current" : "Min. 8 characters"}
                className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-3 pr-10 rounded-lg focus:outline-none focus:border-fortress-gold/40 transition-colors"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-fortress-silver/40 hover:text-fortress-ivory transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-fortress-silver/60 mb-1.5">Role</label>
            <div className="flex gap-2">
              {(["admin", "superadmin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => up("role", r)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold border rounded-lg transition-all ${
                    form.role === r
                      ? r === "superadmin"
                        ? "bg-fortress-gold/20 text-fortress-gold border-fortress-gold/30"
                        : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "border-white/10 text-fortress-silver/50 hover:border-white/20 hover:text-fortress-ivory"
                  }`}
                >
                  {r === "superadmin" ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {r === "superadmin" ? "Super Admin" : "Admin"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 border border-white/10 text-fortress-silver/70 text-sm font-semibold hover:border-white/20 hover:text-fortress-ivory transition-all rounded-xl">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-all rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-fortress-navy/30 border-t-fortress-navy rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : isEdit ? "Update" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [modal, setModal] = useState<"create" | AdminUser | null>(null);

  function load() {
    setLoading(true);
    // Also check current session role
    fetch("/api/admin-session")
      .then((r) => r.json())
      .then((d) => { if (d?.role === "superadmin") setIsSuperAdmin(true); })
      .catch(() => {});
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { setUsers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(user: AdminUser) {
    if (!confirm(`Delete user "${user.name}" (${user.email})? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("User deleted");
      load();
    } catch {
      toast.error("Failed to delete user");
    }
  }

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Users" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fortress-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <AdminNavbar title="Admin Users" />

        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 relative z-10 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-fortress-ivory">Admin Users</h1>
              <p className="text-fortress-silver/50 text-sm mt-0.5">
                {isSuperAdmin ? "Manage admin access — superadmin only" : "View admin users (read-only)"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} disabled={loading} className="p-2.5 border border-white/10 text-fortress-silver/50 hover:text-fortress-gold hover:border-fortress-gold/30 transition-all rounded-lg">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => setModal("create")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-all rounded-lg shadow-lg shadow-fortress-gold/10"
                >
                  <Plus className="w-4 h-4" /> New User
                </button>
              )}
            </div>
          </div>

          {!isSuperAdmin && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              You need superadmin role to create or edit users.
            </div>
          )}

          {/* User List */}
          <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
            {loading ? (
              <div className="space-y-px p-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-10 h-10 text-fortress-silver/20 mb-3" />
                <p className="text-fortress-ivory/60 font-medium mb-1">No admin users found</p>
                <p className="text-fortress-silver/30 text-sm">Create the first admin user to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group">
                    <div className="w-10 h-10 bg-gradient-to-br from-fortress-gold/20 to-transparent border border-fortress-gold/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-fortress-gold">
                        {u.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-fortress-ivory">{u.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          u.role === "superadmin"
                            ? "bg-fortress-gold/15 text-fortress-gold border-fortress-gold/25"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}>
                          {u.role === "superadmin" ? "Super Admin" : "Admin"}
                        </span>
                      </div>
                      <p className="text-xs text-fortress-silver/50 mt-0.5">{u.email}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end text-right">
                      <div className="flex items-center gap-1 text-[10px] text-fortress-silver/40">
                        <Clock className="w-3 h-3" />
                        Last login: {timeAgo(u.lastLogin)}
                      </div>
                      <p className="text-[10px] text-fortress-silver/30 mt-0.5">
                        Created {timeAgo(u.createdAt)}
                      </p>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setModal(u)}
                          className="p-2 text-fortress-silver/40 hover:text-fortress-gold transition-colors rounded-lg hover:bg-fortress-gold/10"
                          title="Edit user"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-2 text-fortress-silver/40 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {users.length > 0 && (
              <div className="px-4 py-3 border-t border-white/5">
                <p className="text-xs text-fortress-silver/30">
                  {users.length} user{users.length !== 1 ? "s" : ""} total
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {modal && (
        <UserModal
          editUser={typeof modal === "string" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
