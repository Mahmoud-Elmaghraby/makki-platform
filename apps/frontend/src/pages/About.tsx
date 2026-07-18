export default function About() {
  return (
    <div>
      <section className="bg-(--color-paper-alt) px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl bg-(--color-silver-light)">
            {/* TODO: استبدال بصورة حقيقية لمكتب مكي */}
            <img src="/carousel/Slide1.jpg" alt="مكتب مكي للمحاماة" className="h-auto w-full" />
          </div>
          <div>
            <div className="mb-2 text-sm font-bold text-(--color-gold-dim)">من نحن</div>
            <h1 className="text-3xl font-extrabold text-(--color-navy) md:text-4xl">
              شريككم القانوني {/* TODO: تأكيد عدد سنوات الخبرة الحقيقي */}
              منذ أكثر من 10 سنوات
            </h1>
            <p className="mt-6 leading-8 text-(--color-muted)">
              تأسس مكتب مكي للمحاماة على مبدأ بسيط: تقديم استشارة قانونية واضحة، صادقة، وقريبة من
              احتياجات كل عميل، أفرادًا كانوا أو شركات.
            </p>
            <p className="mt-4 leading-8 text-(--color-muted)">
              {/* TODO: نص معتمد من مكي نفسها */}
              يضم فريقنا نخبة من المحامين المتخصصين في مختلف فروع القانون، ملتزمين بأعلى معايير
              المهنية والسرية في التعامل مع كل قضية.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <div className="mb-2 text-sm font-bold text-(--color-gold-dim)">أكاديمية مكي</div>
            <h2 className="text-2xl font-extrabold text-(--color-navy) md:text-3xl">
              تأهيل وتدريب لطلبة الحقوق والمحامين
            </h2>
            <p className="mt-5 leading-8 text-(--color-muted)">
              إلى جانب المحاماة والاستشارات، نقدّم عبر أكاديمية مكي برامج تدريبية متخصصة لطلبة
              كليات الحقوق والمحامين الممارسين.
            </p>
            <p className="mt-4 leading-8 text-(--color-muted)">
              محتوى عملي مبني على خبرة حقيقية، بشهادات إتمام لكل مسار.
            </p>
            <div className="mt-7 flex flex-wrap gap-6">
              {["مسار الطلبة", "مسار المحامين", "تأهيل وتدريب"].map((pt) => (
                <div key={pt} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-(--color-gold)" />
                  <span className="text-sm font-semibold text-(--color-navy)">{pt}</span>
                </div>
              ))}
            </div>
            <a href="/courses" className="mt-6 inline-block text-sm font-bold text-(--color-gold-dim) hover:text-(--color-navy)">
              اكتشف دوراتنا التدريبية ←
            </a>
          </div>
          <div className="order-1 overflow-hidden rounded-xl bg-(--color-silver-light) lg:order-2">
            <img src="/carousel/Slide2.jpg" alt="أكاديمية مكي" className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section className="bg-(--color-paper-alt) px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl bg-(--color-silver-light)">
            <img src="/carousel/Slide3.jpg" alt="عملاؤنا" className="h-auto w-full" />
          </div>
          <div>
            <div className="mb-2 text-sm font-bold text-(--color-gold-dim)">عملاؤنا</div>
            <h2 className="text-2xl font-extrabold text-(--color-navy) md:text-3xl">
              ثقة أفراد وشركات على حد سواء
            </h2>
            <p className="mt-5 leading-8 text-(--color-muted)">
              نتشرف بخدمة قاعدة متنوعة من العملاء، من الأفراد وحتى الشركات الناشئة والمؤسسات
              التجارية.
            </p>
            <div className="mt-7 flex flex-wrap gap-6">
              {["أفراد", "شركات ناشئة", "مؤسسات تجارية"].map((pt) => (
                <div key={pt} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-(--color-gold)" />
                  <span className="text-sm font-semibold text-(--color-navy)">{pt}</span>
                </div>
              ))}
            </div>
            <a href="/contact" className="mt-6 inline-block text-sm font-bold text-(--color-gold-dim) hover:text-(--color-navy)">
              احجز استشارتك الآن ←
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <div className="mb-2 text-sm font-bold text-(--color-gold-dim)">فريقنا</div>
            <h2 className="text-2xl font-extrabold text-(--color-navy) md:text-3xl">محامون يثق بهم عملاؤنا</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* TODO: تأكيد الأسماء والمناصب الحقيقية - القيم دي تقديرية مؤقتة */}
            {[
              { name: "د. يحيى", role: "الشريك المؤسس", image: "/team/DR-Yahya3.jpg" },
              { name: "د. أحمد", role: "مستشار قانون تجاري وشركات", image: "/team/DR-Ahmed3.jpg" },
              { name: "د. حسن", role: "مستشار القانون الجنائي", image: "/team/DR-Hassan3.jpg" },
              { name: "د. مونا", role: "مستشارة الأحوال الشخصية", image: "/team/DR-Mona3.jpg" },
            ].map((m) => (
              <div key={m.name} className="text-center">
                <img src={m.image} alt={m.name} className="aspect-3/4 w-full rounded-lg object-cover" />
                <h3 className="mt-4 font-bold text-(--color-navy)">{m.name}</h3>
                <p className="text-sm text-(--color-gold-dim)">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-(--color-paper-alt) px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "فريق متخصص", desc: "محامون متخصصون في مختلف فروع القانون بخبرة عملية." },
            { title: "متابعة شخصية", desc: "كل قضية بتتابعها معاك بشكل مباشر لحد ما تتحل." },
            { title: "شفافية كاملة", desc: "توضيح كل خطوة وكل تكلفة من غير أي مفاجآت." },
            { title: "تأهيل وتدريب", desc: "برامج تدريبية متخصصة لطلبة الحقوق والمحامين عبر أكاديمية مكي." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-(--color-silver) bg-(--color-paper) p-7">
              <div className="mb-4 h-1 w-8 rounded-full bg-(--color-gold)" />
              <h3 className="font-bold text-(--color-navy)">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-(--color-muted)">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-(--color-navy) px-6 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-white">محتاج استشارة قانونية؟</h2>
        <a href="/contact" className="mt-7 inline-block rounded-md bg-(--color-gold) px-8 py-4 text-sm font-bold text-(--color-navy) hover:bg-(--color-gold-dim)">
          احجز استشارتك الآن
        </a>
      </section>
    </div>
  );
}
