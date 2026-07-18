export default function Contact() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <p className="text-sm font-medium text-(--color-bronze)">تواصل معنا</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-(--color-royal)">
        احجز استشارتك القانونية
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-(--color-ink)/65">
        قدّم طلبك وسيتواصل معك أحد محامي الشركة للرد على استشارتك.
        {/* TODO: هذا النموذج شكلي فقط حاليًا — سيتم ربطه بـ Consultations module لاحقًا */}
      </p>

      <form className="mt-10 grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          الاسم
          <input
            type="text"
            className="rounded-lg border border-(--color-silver) px-4 py-2.5 outline-none focus:border-(--color-royal)"
            placeholder="اسمك بالكامل"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          رقم الهاتف
          <input
            type="tel"
            className="rounded-lg border border-(--color-silver) px-4 py-2.5 outline-none focus:border-(--color-royal)"
            placeholder="01xxxxxxxxx"
          />
        </label>
        <label className="col-span-full flex flex-col gap-1.5 text-sm">
          موضوع الاستشارة
          <input
            type="text"
            className="rounded-lg border border-(--color-silver) px-4 py-2.5 outline-none focus:border-(--color-royal)"
            placeholder="مثال: نزاع تجاري، عقد عمل..."
          />
        </label>
        <label className="col-span-full flex flex-col gap-1.5 text-sm">
          تفاصيل الاستشارة
          <textarea
            rows={5}
            className="rounded-lg border border-(--color-silver) px-4 py-2.5 outline-none focus:border-(--color-royal)"
            placeholder="اشرح المسألة القانونية بإيجاز"
          />
        </label>
        <button
          type="submit"
          className="col-span-full w-fit rounded-full bg-(--color-royal) px-7 py-3 text-sm font-medium text-(--color-paper) hover:bg-(--color-royal-light)"
        >
          إرسال الطلب
        </button>
      </form>
    </div>
  );
}
