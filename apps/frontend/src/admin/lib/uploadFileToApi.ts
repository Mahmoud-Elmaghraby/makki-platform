import { apiClient } from "./apiClient";

/**
 * رفع ملف عن طريق الـ API بتاعنا (نفس دومين الفرونت إند، مفيش CORS خالص)
 * بدل الرفع المباشر من المتصفح لـ B2 (presigned PUT/POST) — B2 بترفض
 * preflight الـ CORS بتاعها بـ 403 لأي طريقة رفع مباشرة من المتصفح، فالحل
 * الوحيد المضمون هو إن الملف يعدي على السيرفر بتاعنا الأول وهو اللي يرفعه
 * لـ B2 من جواه (server-to-server، من غير متصفح في النص).
 */
export async function uploadFileToApi<T = unknown>(
  url: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<T>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return data;
}
