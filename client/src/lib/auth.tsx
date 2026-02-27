import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AuthContextType = {
  isAdmin: boolean;
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "include" })
      .then(r => r.json())
      .then(d => { setIsAdmin(d.authenticated); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const login = async (password: string) => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      credentials: "include",
    });
    const data = await res.json();
    if (data.ok) { setIsAdmin(true); return true; }
    return false;
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setIsAdmin(false);
    setEditMode(false);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, isEditMode, setEditMode, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
