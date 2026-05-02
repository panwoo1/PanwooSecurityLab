import fs from "node:fs";
import path from "node:path";

const newsFile = path.join(process.cwd(), "assets", "data", "security-news.json");

export type NewsItem = {
  source: string;
  region: "domestic" | "global";
  slug: string;
  title: string;
  url: string;
  translateUrl: string;
  published: string;
  summary: string;
};

type NewsPayload = {
  generated_at: string;
  items: NewsItem[];
  errors?: string[];
};

export function getNewsPayload(): NewsPayload {
  return JSON.parse(fs.readFileSync(newsFile, "utf8"));
}

export function getAllNews(): NewsItem[] {
  return getNewsPayload().items;
}

export function getNewsBySlug(slug: string) {
  return getAllNews().find((item) => item.slug === slug);
}
