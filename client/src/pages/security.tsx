import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, UserPlus, Trash2, KeyRound, ArrowLeft, Eye, EyeOff, RotateCcw, Check, X } from "lucide-react";

type AdminUser = { id: number; email: string; role: string; created_at: string };

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      setMessage({ type: "ok", text: "Hasło zmienione pomyślnie" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => setMessage({ type: "err", text: err.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: "err", text: "Nowe hasła nie są takie same" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "err", text: "Nowe hasło musi mieć minimum 6 znaków" });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="rounded-xl border bg-card p-6" data-testid="section-change-password">
      <div className="flex items-center gap-2 mb-4">
        <KeyRound className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Zmiana hasła</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <div className="relative">
          <Input
            type={showPasswords ? "text" : "password"}
            placeholder="Obecne hasło"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            data-testid="input-current-password"
          />
        </div>
        <Input
          type={showPasswords ? "text" : "password"}
          placeholder="Nowe hasło (min. 6 znaków)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          data-testid="input-new-password"
        />
        <Input
          type={showPasswords ? "text" : "password"}
          placeholder="Powtórz nowe hasło"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          data-testid="input-confirm-password"
        />
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            {showPasswords ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPasswords ? "Ukryj hasła" : "Pokaż hasła"}
          </button>
        </div>
        {message && (
          <p className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-500"}`} data-testid="text-password-message">
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={mutation.isPending} className="rounded-xl" data-testid="button-change-password">
          <KeyRound className="mr-2 h-4 w-4" />
          Zmień hasło
        </Button>
      </form>
    </div>
  );
}

function AdminUserRow({ user: u, onDelete, onUpdate }: { user: AdminUser; onDelete: (id: number) => void; onUpdate: () => void }) {
  const [resetting, setResetting] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPw }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      setMsg({ type: "ok", text: "Hasło zmienione" });
      setNewPw("");
      setResetting(false);
      onUpdate();
      setTimeout(() => setMsg(null), 3000);
    },
    onError: (err: Error) => setMsg({ type: "err", text: err.message }),
  });

  const handleReset = () => {
    if (newPw.length < 6) {
      setMsg({ type: "err", text: "Minimum 6 znaków" });
      return;
    }
    resetMutation.mutate();
  };

  return (
    <div className="rounded-lg border bg-muted px-4 py-3" data-testid={`admin-user-${u.id}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="font-medium text-sm">{u.email}</span>
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "super_admin" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}>
            {u.role === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setResetting(!resetting); setNewPw(""); setMsg(null); }}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-500"
            title="Resetuj hasło"
            data-testid={`button-reset-pw-${u.id}`}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Czy na pewno chcesz usunąć ${u.email}?`)) onDelete(u.id);
            }}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            data-testid={`button-delete-user-${u.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {resetting && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            type="password"
            placeholder="Nowe hasło (min. 6 znaków)"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="flex-1 h-8 text-sm"
            autoFocus
            data-testid={`input-reset-pw-${u.id}`}
          />
          <button
            type="button"
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="rounded-lg p-1.5 text-green-500 transition hover:bg-green-50"
            data-testid={`button-confirm-reset-${u.id}`}
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => { setResetting(false); setNewPw(""); setMsg(null); }}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100"
            data-testid={`button-cancel-reset-${u.id}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {msg && (
        <p className={`mt-1 text-xs ${msg.type === "ok" ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>
      )}
    </div>
  );
}

function AdminUsersPanel() {
  const qc = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setNewEmail("");
      setNewPassword("");
      setNewRole("admin");
      setSuccess("Użytkownik dodany");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: Error) => { setError(err.message); setSuccess(""); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => { setError(err.message); },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newEmail || !newPassword) {
      setError("Email i hasło są wymagane");
      return;
    }
    if (newPassword.length < 6) {
      setError("Hasło musi mieć minimum 6 znaków");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="rounded-xl border bg-card p-6" data-testid="section-admin-users">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Użytkownicy admin</h2>
      </div>

      <div className="space-y-2 mb-6">
        {users.map((u) => (
          <AdminUserRow key={u.id} user={u} onDelete={(id) => deleteMutation.mutate(id)} onUpdate={() => qc.invalidateQueries({ queryKey: ["admin-users"] })} />
        ))}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-foreground/80 mb-3">Dodaj nowego admina</h3>
        <form onSubmit={handleAdd} className="space-y-3 max-w-md">
          <Input
            type="email"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            data-testid="input-new-user-email"
          />
          <Input
            type="password"
            placeholder="Hasło (min. 6 znaków)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            data-testid="input-new-user-password"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            data-testid="select-new-user-role"
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          {error && <p className="text-sm text-red-500" data-testid="text-users-error">{error}</p>}
          {success && <p className="text-sm text-green-600" data-testid="text-users-success">{success}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="rounded-xl" data-testid="button-add-user">
            <UserPlus className="mr-2 h-4 w-4" />
            Dodaj admina
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const { isAdmin, isSuperAdmin, adminEmail } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Musisz być zalogowany, aby zobaczyć tę stronę.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4" /> Wróć na stronę
          </button>
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-foreground" />
            <div>
              <h1 className="text-2xl font-bold">Bezpieczeństwo</h1>
              <p className="text-sm text-muted-foreground">
                Zalogowany jako: <strong>{adminEmail}</strong>
                {isSuperAdmin && <span className="ml-1 text-yellow-600">(Super Admin)</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ChangePasswordForm />
          {isSuperAdmin && <AdminUsersPanel />}
        </div>
      </div>
    </div>
  );
}
