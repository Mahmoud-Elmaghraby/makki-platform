import { createContext, useContext, useState, type ReactNode } from "react";
import { apiClient, getToken, setToken, clearToken } from "../lib/apiClient";
import type { StudentProfile } from "../types/api";

interface AuthResponse {
  access_token: string;
  student: { id: string; phone: string };
}

interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

interface StudentAuthContextValue {
  student: StudentProfile | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  completeGoogleLogin: (token: string) => Promise<void>;
  logout: () => void;
}

const StudentAuthContext = createContext<StudentAuthContextValue | null>(null);

const PROFILE_STORAGE_KEY = "makki_student_profile";

function readStoredProfile(): StudentProfile | null {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

export function StudentAuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<StudentProfile | null>(() =>
    getToken() ? readStoredProfile() : null,
  );

  async function afterAuth(data: AuthResponse) {
    setToken(data.access_token);
    // بيانات التوكن نفسها ناقصة (بس id/phone)، فبنجيب البروفايل الكامل
    // (بالاسم والإيميل والاشتراكات) فورًا بعد الدخول/التسجيل.
    const { data: profile } = await apiClient.get<StudentProfile>("/auth/student/me");
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setStudent(profile);
  }

  async function login(phone: string, password: string) {
    const { data } = await apiClient.post<AuthResponse>("/auth/student/login", { phone, password });
    await afterAuth(data);
  }

  async function register(payload: RegisterPayload) {
    const { data } = await apiClient.post<AuthResponse>("/auth/student/register", payload);
    await afterAuth(data);
  }

  // بعد ريدايركت جوجل، الباك إند بيرجع التوكن جاهز في الـ query string —
  // مفيش حاجة نبعتها هنا، بس لسه محتاجين نجيب البروفايل ونحفظه زي أي دخول عادي.
  async function completeGoogleLogin(token: string) {
    await afterAuth({ access_token: token, student: { id: "", phone: "" } });
  }

  function logout() {
    clearToken();
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    setStudent(null);
  }

  return (
    <StudentAuthContext.Provider
      value={{ student, isAuthenticated: !!student, login, register, completeGoogleLogin, logout }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const ctx = useContext(StudentAuthContext);
  if (!ctx) throw new Error("useStudentAuth لازم يتستخدم جوه StudentAuthProvider");
  return ctx;
}
