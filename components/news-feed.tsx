"use client";

import { useEffect, useState } from "react";

type NewsItem = {
  source: string;
  region: "domestic" | "global";
  slug: string;
  title: string;
  url: string;
  translateUrl: string;
  published: string;
  summary: string;
};

type Props = {
  limit?: number;
  title?: string;
  label?: string;
  className?: string;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko", { month: "short", day: "numeric" }).format(date);
}

export function NewsFeed({ limit = 12, title = "Security News", label = "Intel", className = "" }: Props) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/news")
      .then((response) => response.json())
      .then((payload) => setItems(payload.items || []))
      .catch(() => setFailed(true));
  }, []);

  return (
    <section className={`panel news-panel ${className}`} id="security-news">
      <div className="panel-heading">
        <div>
          <span className="panel-label">{label}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="news-list">
        {failed ? <p className="empty-state">Security news is unavailable.</p> : null}
        {!failed && items.length === 0 ? <p className="empty-state">Loading security news...</p> : null}
        {items.slice(0, limit).map((item) => (
          <article className="news-item" key={`${item.source}-${item.url}`}>
            <div>
              <span>
                {item.source}
                <em>{item.region === "domestic" ? "국내" : "해외"}</em>
              </span>
              <time>{formatDate(item.published)}</time>
            </div>
            <a href={`/news/${item.slug}`}>
              {item.title}
            </a>
            {item.summary ? <p>{item.summary}</p> : null}
            {item.translateUrl ? (
              <a className="translate-link" href={item.translateUrl} target="_blank" rel="noreferrer">
                한국어 번역본 보기
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
