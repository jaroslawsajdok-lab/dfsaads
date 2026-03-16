import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AuthContextType = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminEmail: string | null;
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isEditMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setIsAdmin(d.authenticated);
        setIsSuperAdmin(d.role === "super_admin");
        setAdminEmail(d.email || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setIsAdmin(true);
      setIsSuperAdmin(data.role === "super_admin");
      setAdminEmail(data.email || null);
      return { ok: true };
    }
    return { ok: false, error: data.message || "Błąd logowania" };
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setAdminEmail(null);
    setEditMode(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, isSuperAdmin, adminEmail, isEditMode, setEditMode, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
