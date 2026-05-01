const searchInput = document.querySelector("[data-post-search]");
const cards = Array.from(document.querySelectorAll("[data-post-card]"));
const chips = Array.from(document.querySelectorAll("[data-category-filter]"));
const emptyState = document.querySelector("[data-empty-state]");

let activeCategory = "all";

function normalize(value) {
  return value.trim().toLowerCase();
}

function applyFilters() {
  const query = normalize(searchInput?.value || "");
  let visibleCount = 0;

  cards.forEach((card) => {
    const categories = card.dataset.categories || "";
    const text = card.dataset.search || "";
    const matchesCategory = activeCategory === "all" || categories.includes(activeCategory);
    const matchesQuery = !query || text.includes(query);
    const shouldShow = matchesCategory && matchesQuery;

    card.hidden = !shouldShow;
    if (shouldShow) visibleCount += 1;
  });

  if (emptyState) {
    emptyState.hidden = visibleCount !== 0;
  }
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeCategory = chip.dataset.categoryFilter || "all";
    chips.forEach((item) => item.classList.toggle("is-active", item === chip));
    applyFilters();
  });
});

searchInput?.addEventListener("input", applyFilters);

const dateEl = document.querySelector("[data-dashboard-date]");
const timeEl = document.querySelector("[data-dashboard-time]");

function updateClock() {
  if (!dateEl || !timeEl) return;
  const now = new Date();
  dateEl.textContent = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(now);
  timeEl.textContent = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(now);
}

updateClock();
setInterval(updateClock, 30000);

const launcher = document.querySelector("[data-proxy-launcher]");
const copyCurlButton = document.querySelector("[data-copy-curl]");

function currentTarget() {
  const value = launcher?.elements.target.value.trim() || "";
  if (!value) return "";
  try {
    return new URL(value).toString();
  } catch {
    return "";
  }
}

launcher?.addEventListener("submit", (event) => {
  event.preventDefault();
  const target = currentTarget();
  if (target) window.open(target, "_blank", "noopener");
});

copyCurlButton?.addEventListener("click", async () => {
  const target = currentTarget();
  if (!target) return;
  const command = `curl -x http://127.0.0.1:8080 -k -i ${JSON.stringify(target)}`;
  await navigator.clipboard?.writeText(command);
  copyCurlButton.textContent = "Copied";
  setTimeout(() => {
    copyCurlButton.textContent = "Copy curl";
  }, 1400);
});

const newsList = document.querySelector("[data-news-list]");

function formatPublished(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function renderNews(items) {
  if (!newsList) return;
  newsList.innerHTML = "";
  items.slice(0, 9).forEach((item) => {
    const article = document.createElement("article");
    article.className = "news-item";
    article.innerHTML = `
      <div>
        <span>${item.source || "Security"}</span>
        <time>${formatPublished(item.published)}</time>
      </div>
      <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>
      ${item.summary ? `<p>${item.summary}</p>` : ""}
    `;
    newsList.append(article);
  });
}

if (newsList) {
  fetch(`${document.body.dataset.baseurl || ""}/assets/data/security-news.json`, { cache: "no-store" })
    .then((response) => response.json())
    .then((payload) => renderNews(payload.items || []))
    .catch(() => {
      newsList.innerHTML = '<p class="empty-state">Security news is unavailable.</p>';
    });
}
