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
