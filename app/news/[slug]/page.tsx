import { notFound } from "next/navigation";
import { getAllNews, getNewsBySlug } from "@/lib/news";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function generateStaticParams() {
  return getAllNews().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const item = getNewsBySlug(slug);
  if (!item) return {};
  return {
    title: `${item.title} - Panwoo Security Lab`,
    description: item.summary,
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = getNewsBySlug(slug);
  if (!item) notFound();

  return (
    <article className="article news-article">
      <header className="article-header">
        <p className="eyebrow">{item.region === "domestic" ? "Domestic News" : "Global News"}</p>
        <h1>{item.title}</h1>
        <div className="article-meta">
          <span>{item.source}</span>
          <time>{formatDate(item.published)}</time>
        </div>
      </header>

      <div className="mdx-content">
        {item.summary ? <p>{item.summary}</p> : <p>저장된 RSS 요약이 없는 기사다.</p>}
      </div>

      <div className="news-detail-actions">
        <a className="button primary" href={item.url} target="_blank" rel="noreferrer">
          원문 보기
        </a>
        {item.translateUrl ? (
          <a className="button" href={item.translateUrl} target="_blank" rel="noreferrer">
            한국어 번역본 보기
          </a>
        ) : null}
      </div>
    </article>
  );
}
