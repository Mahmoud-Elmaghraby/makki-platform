// TODO: استبدال بمقالات حقيقية (سيتم لاحقًا سحبها من الـ CMS module في الـ backend)
const placeholderPosts = Array.from({ length: 6 }).map((_, i) => ({
  title: `عنوان مقال تجريبي رقم ${i + 1}`,
  excerpt: "مقتطف مبدئي من المقال — سيتم استبداله بمحتوى حقيقي.",
}));

export default function Blog() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-sm font-medium text-(--color-bronze)">المدونة</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-(--color-royal)">
        مقالات ورؤى قانونية
      </h1>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {placeholderPosts.map((post) => (
          <article
            key={post.title}
            className="rounded-xl border border-(--color-silver) p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-4 aspect-video rounded-lg bg-(--color-silver-light)" />
            <h3 className="font-medium text-(--color-royal)">{post.title}</h3>
            <p className="mt-2 text-sm leading-7 text-(--color-ink)/65">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
