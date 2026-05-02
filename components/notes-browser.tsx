"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type NoteListItem = {
  slug: string;
  title: string;
  date: string;
  categories: string[];
  tags: string[];
  excerpt: string;
  searchText: string;
};

type Props = {
  notes: NoteListItem[];
  tags: string[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function NotesBrowser({ notes, tags }: Props) {
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

  const filteredNotes = useMemo(() => {
    const normalizedQuery = normalize(query);

    return notes.filter((note) => {
      const matchesTag = selectedTag === "all" || note.tags.includes(selectedTag);
      const matchesQuery = !normalizedQuery || note.searchText.includes(normalizedQuery);
      return matchesTag && matchesQuery;
    });
  }, [notes, query, selectedTag]);

  return (
    <div className="notes-browser">
      <div className="notes-toolbar" aria-label="Notes filters">
        <label className="notes-search">
          <span>Search notes</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, content, tag..."
            type="search"
          />
        </label>

        <div className="tag-filter" aria-label="Filter notes by tag">
          <button
            className={selectedTag === "all" ? "is-active" : ""}
            type="button"
            onClick={() => setSelectedTag("all")}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              className={selectedTag === tag ? "is-active" : ""}
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="notes-result-meta" aria-live="polite">
        <span>{filteredNotes.length} notes</span>
        {selectedTag !== "all" ? <strong>#{selectedTag}</strong> : null}
      </div>

      {filteredNotes.length === 0 ? (
        <p className="empty-state">No notes match this search.</p>
      ) : (
        <div className="note-list">
          {filteredNotes.map((note) => (
            <Link className="note-row" href={`/notes/${note.slug}`} key={note.slug}>
              <div>
                <span>{note.date}</span>
                <h2>{note.title}</h2>
                <p>{note.excerpt}</p>
                {note.tags.length ? (
                  <div className="note-tags" aria-label="Note tags">
                    {note.tags.slice(0, 6).map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <strong>{note.categories.join(", ")}</strong>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
