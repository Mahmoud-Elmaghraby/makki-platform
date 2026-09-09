import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { publicApiClient, extractErrorMessage } from "../lib/apiClient";

type RequestType = "LEGAL_CONSULTATION" | "COURSE_INQUIRY" | "TRAINING_INQUIRY";

function isRequestType(value: string | null): value is RequestType {
  return value === "LEGAL_CONSULTATION" || value === "COURSE_INQUIRY" || value === "TRAINING_INQUIRY";
}

const TYPE_OPTIONS: { value: RequestType; label: string }[] = [
  { value: "LEGAL_CONSULTATION", label: "استشارة قانونية" },
  { value: "COURSE_INQUIRY", label: "استفسار عن كورس" },
  { value: "TRAINING_INQUIRY", label: "استفسار عن دورة تدريبية" },
];

export default function Contact() {
  const [searchParams] = useSearchParams();
  const [type, setType] = useState<RequestType>("LEGAL_CONSULTATION");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // لو الزائر جاي من زرار سياقي (اطلب استشارة/اهتم بالكورس/الدورة ده)،
  // نوع الطلب وموضوعه بيتحددوا تلقائي من الرابط، عشان الزائر ميحتاجش
  // يختارهم بنفسه.
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (isRequestType(typeParam)) setType(typeParam);
    const subjectParam = searchParams.get("subject");
    if (subjectParam) setSubject(subjectParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await publicApiClient.post("/consultations", {
        type,
        name,
        phone,
        email: email || undefined,
        subject: subject || undefined,
        message,
      });
      setSent(true);
      setName("");
      setPhone("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <p className="text-sm font-medium text-(--color-bronze)">تواصل معنا</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-(--color-royal)">
        محتاج استشارة قانونية ولا مهتم بكورس أو دورة؟
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-(--color-ink)/65">
        اختار نوع طلبك وابعتلنا تفاصيله، وهيتواصل معاك فريقنا في أقرب وقت.
      </p>

      {sent ? (
        <div className="mt-10 rounded-xl border border-(--color-royal)/20 bg-(--color-royal)/5 px-6 py-8 text-center">
          <p className="text-lg font-semibold text-(--color-royal)">تم استلام طلبك بنجاح</p>
          <p className="mt-2 text-sm text-(--color-ink)/65">
            هيتواصل معاك فريق مكي وشركاؤه في أقرب وقت.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-5 rounded-full border border-(--color-royal) px-6 py-2 text-sm font-medium text-(--color-royal) hover:bg-(--color-royal)/5"
          >
            إرسال طلب جديد
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 grid gap-5 sm:grid-cols-2">
          <label className="col-span-full flex flex-col gap-1.5 text-sm">
            نوع الطلب
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RequestType)}
              className="rounded-lg border border-(--color-silver) bg-white px-4 py-2.5 outline-none focus:border-(--color-royal)"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            الاسم
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-(--color-silver) px-4 py-2.5 outline-none focus:border-(--color-royal)"
              placeholder="اسمك بالكامل"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            رقم الهاتف
            <input
              type="tel"
              required
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-lg border border-(--color-silver) px-4 py-2.5 outline-none focus:border-(--color-royal)"
              placeholder="01xxxxxxxxx"
            />
          </label>
          <label className="col-span-full flex flex-col gap-1.5 text-sm">
            البريد الإلكتروني <span className="text-(--color-ink)/40">(اختياري)</span>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-(--color-silver) px-4 py-2.5 outline-none focus:border-(--color-royal)"
              placeholder="example@email.com"
            />
          </label>
          <label className="col-span-full flex flex-col gap-1.5 text-sm">
            الموضوع <span className="text-(--color-ink)/40">(اختياري)</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-lg border border-(--color-silver) px-4 py-2.5 outline-none focus:border-(--color-royal)"
              placeholder="مثال: نزاع تجاري، عقد عمل، اسم الكورس..."
            />
          </label>
          <label className="col-span-full flex flex-col gap-1.5 text-sm">
            التفاصيل
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-lg border border-(--color-silver) px-4 py-2.5 outline-none focus:border-(--color-royal)"
              placeholder="اشرح طلبك بإيجاز"
            />
          </label>

          {error && (
            <p className="col-span-full rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="col-span-full w-fit rounded-full bg-(--color-royal) px-7 py-3 text-sm font-medium text-(--color-paper) hover:bg-(--color-royal-light) disabled:opacity-60"
          >
            {loading ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </form>
      )}
    </div>
  );
}
