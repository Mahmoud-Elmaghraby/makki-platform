import { createContext, useContext, useState, type ReactNode } from "react";
import { apiClient, getToken, setToken, clearToken } from "../lib/apiClient";
import type { AdminUser } from "../types/api";

interface LoginResponse {
  access_token: string;
  user: AdminUser;
}

interface AdminAuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const USER_STORAGE_KEY = "makki_admin_user";

function readStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() =>
    getToken() ? readStoredUser() : null,
  );

  async function login(email: string, password: string) {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    setToken(data.access_token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    clearToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }

  return (
    <AdminAuthContext.Provider
      value={{ user, isAuthenticated: !!user, isBootstrapping: false, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth لازم يتستخدم جوه AdminAuthProvider");
  return ctx;
}
