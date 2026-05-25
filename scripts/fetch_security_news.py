#!/usr/bin/env python3
import email.utils
import hashlib
import html
import json
import re
import sys
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

FEEDS = [
    ("KISA 보안공지", "https://www.boho.or.kr/kr/rss.do?bbsId=B0000133", "domestic"),
    ("KISA 취약점정보", "https://www.boho.or.kr/kr/rss.do?bbsId=B0000302", "domestic"),
    ("ASEC KR", "https://asec.ahnlab.com/ko/feed/", "domestic"),
    ("보안뉴스", "https://www.boannews.com/media/news_rss.xml", "domestic"),
    ("CISA", "https://www.cisa.gov/cybersecurity-advisories/all.xml", "global"),
    ("BleepingComputer", "https://www.bleepingcomputer.com/feed/", "global"),
    ("The Hacker News", "https://feeds.feedburner.com/TheHackersNews", "global"),
]

OUT = Path("assets/data/security-news.json")
MAX_ITEMS = 60
MAX_ITEMS_PER_FEED = 10
MAX_ARTICLE_BYTES = 1_000_000
MAX_ARTICLE_TEXT = 2600
ALLOWED_ARTICLE_HOSTS = (
    "boho.or.kr",
    "www.boho.or.kr",
    "asec.ahnlab.com",
    "www.boannews.com",
    "cisa.gov",
    "www.cisa.gov",
    "bleepingcomputer.com",
    "www.bleepingcomputer.com",
    "thehackernews.com",
    "www.thehackernews.com",
)


def clean(value):
    value = html.unescape(value or "")
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def first_text(node, names):
    for name in names:
        found = node.find(name)
        if found is not None and found.text:
            return found.text
    return ""


def parsed_date(value):
    if not value:
        return datetime.min.replace(tzinfo=timezone.utc)
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except Exception:
        pass
    for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(value[:10], fmt).replace(tzinfo=timezone.utc)
        except Exception:
            pass
    return datetime.min.replace(tzinfo=timezone.utc)


def translate_url(url, region):
    if region == "domestic":
        return ""
    return f"https://translate.google.com/translate?sl=auto&tl=ko&u={urllib.parse.quote(url, safe='')}"


def slug_for(url):
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]


def is_allowed_article_url(url):
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False

    if parsed.scheme not in ("http", "https"):
        return False

    host = parsed.hostname or ""
    return host in ALLOWED_ARTICLE_HOSTS


def decode_response(data, headers):
    charset = headers.get_content_charset()
    if not charset:
        head = data[:300].decode("ascii", errors="ignore")
        match = re.search(r"charset=['\"]?([A-Za-z0-9._-]+)", head, re.IGNORECASE)
        charset = match.group(1) if match else "utf-8"
    return data.decode(charset, errors="replace")


def clean_article_html(value):
    value = re.sub(r"(?is)<(script|style|noscript|svg|iframe)[^>]*>.*?</\1>", " ", value)
    value = re.sub(r"(?is)<!--.*?-->", " ", value)
    value = re.sub(r"(?i)</(p|div|section|article|li|h[1-6]|br)>", "\n", value)
    value = clean(value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def fetch_article_text(url):
    if not is_allowed_article_url(url):
        return ""

    request = urllib.request.Request(url, headers={"User-Agent": "PanwooSecurityLab/1.0"})
    with urllib.request.urlopen(request, timeout=12) as response:
        content_type = response.headers.get("Content-Type", "")
        if "text/html" not in content_type and "application/xhtml" not in content_type:
            return ""
        data = response.read(MAX_ARTICLE_BYTES + 1)

    html_text = decode_response(data[:MAX_ARTICLE_BYTES], response.headers)
    candidates = []
    for pattern in (
        r"(?is)<article[^>]*>(.*?)</article>",
        r"(?is)<main[^>]*>(.*?)</main>",
        r"(?is)<div[^>]+(?:id|class)=['\"][^'\"]*(?:article|content|view|news|post|entry)[^'\"]*['\"][^>]*>(.*?)</div>",
    ):
        candidates.extend(clean_article_html(match) for match in re.findall(pattern, html_text))

    if not candidates:
        candidates.append(clean_article_html(html_text))

    article_text = max(candidates, key=len, default="")
    return article_text[:MAX_ARTICLE_TEXT]


def fetch_feed(source, url, region):
    request = urllib.request.Request(url, headers={"User-Agent": "PanwooSecurityLab/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        data = response.read()
        charset = response.headers.get_content_charset()

    if not charset:
        head = data[:200].decode("ascii", errors="ignore")
        match = re.search(r"encoding=['\"]([^'\"]+)['\"]", head, re.IGNORECASE)
        charset = match.group(1) if match else "utf-8"

    xml = data.decode(charset, errors="replace")
    xml = re.sub(r"^\s*<\?xml[^>]*\?>", "", xml)
    root = ET.fromstring(xml)
    items = []

    for item in root.findall(".//item")[:MAX_ITEMS_PER_FEED]:
        title = clean(first_text(item, ["title"]))
        link = clean(first_text(item, ["link"]))
        published = clean(first_text(item, ["pubDate", "date", "{http://purl.org/dc/elements/1.1/}date"]))
        summary = clean(first_text(item, ["description", "summary"]))
        if title and link:
            article_text = ""
            try:
                article_text = fetch_article_text(link)
            except Exception:
                article_text = ""
            items.append(
                {
                    "source": source,
                    "region": region,
                    "slug": slug_for(link),
                    "title": title,
                    "url": link,
                    "translateUrl": translate_url(link, region),
                    "published": published,
                    "summary": summary[:220],
                    "articleText": article_text,
                    "_date": parsed_date(published).isoformat(),
                }
            )

    return items


def main():
    all_items = []
    errors = []
    for source, url, region in FEEDS:
        try:
            all_items.extend(fetch_feed(source, url, region))
        except Exception as exc:
            errors.append(f"{source}: {exc}")

    all_items.sort(key=lambda item: (item["region"] != "domestic", item["_date"]), reverse=False)
    domestic = [item for item in all_items if item["region"] == "domestic"]
    global_items = [item for item in all_items if item["region"] != "domestic"]
    domestic.sort(key=lambda item: item["_date"], reverse=True)
    global_items.sort(key=lambda item: item["_date"], reverse=True)
    all_items = domestic + global_items
    for item in all_items:
        item.pop("_date", None)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": all_items[:MAX_ITEMS],
        "errors": errors,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} with {len(payload['items'])} items")
    if errors:
        print("feed errors:", "; ".join(errors), file=sys.stderr)


if __name__ == "__main__":
    main()
