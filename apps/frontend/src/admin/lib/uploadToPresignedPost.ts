/**
 * رفع ملف مباشرة لـ B2 عن طريق presigned **POST** (مش PUT). السبب: طلب PUT
 * من المتصفح بيفرض preflight (OPTIONS) دايمًا، وB2 (على عكس Amazon S3
 * الأصلي) بيرفض طلب الـ OPTIONS ده بـ 403 قبل حتى ما يوصل لمرحلة تقييم قاعدة
 * الـ CORS بتاعة الـ bucket — قيد موثّق في B2 مفيش منه حل من ناحية إعدادات
 * الـ bucket نفسها. رفع POST بصيغة FormData (من غير هيدرز مخصّصة) بيتصنّف
 * "طلب بسيط" عند المتصفح، فمش بيحتاج preflight خالص، وبكده بيتجنب المشكلة
 * من أساسها.
 *
 * الحقول (fields) لازم تتحط في الـ FormData الأول، وملف الرفع نفسه ("file")
 * آخر حقل — ده شرط من S3/B2 لصلاحية الـ policy الموقّع.
 */
export function uploadToPresignedPost(
  uploadUrl: string,
  fields: Record<string, string>,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error("فشل الرفع، حاول تاني"));
      }
    };
    xhr.onerror = () => reject(new Error("فشل الرفع، حاول تاني"));
    xhr.send(formData);
  });
}
