import axios from "axios";

// توكن الطالب منفصل تمامًا عن توكن الأدمن (نظام مصادقة مختلف في الباك إند)،
// فمفتاح التخزين لازم يكون مختلف عشان الاتنين يقدروا يتسجلوا دخول في نفس
// المتصفح من غير ما يبوّظوا بعض.
export const TOKEN_STORAGE_KEY = "makki_student_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url as string | undefined;
    const isAuthRequest = url?.includes("/auth/student/register") || url?.includes("/auth/student/login");
    if (error.response?.status === 401 && !isAuthRequest) {
      clearToken();
      if (!window.location.pathname.startsWith("/student/login")) {
        window.location.href = "/student/login";
      }
    }
    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join("، ");
    if (typeof data?.message === "string") return data.message;
    if (error.message) return error.message;
  }
  return "حصل خطأ غير متوقع، حاول تاني";
}
