import axios from "axios";

// عميل عام لصفحات الموقع العامة (زي "تواصل معنا") اللي مش محتاجة تسجيل
// دخول — من غير أي interceptor بتاع توكن أدمن/طالب.
export const publicApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4001",
});

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join("، ");
    if (typeof data?.message === "string") return data.message;
    if (error.message) return error.message;
  }
  return "حصل خطأ غير متوقع، حاول تاني";
}
