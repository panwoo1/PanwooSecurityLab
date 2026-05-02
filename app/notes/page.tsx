import { NotesBrowser } from "@/components/notes-browser";
import { getAllNotes } from "@/lib/notes";

export const metadata = {
  title: "Notes - Panwoo Security Lab",
};

export default function NotesPage() {
  const notes = getAllNotes();
  const tags = Array.from(new Set(notes.flatMap((note) => note.tags))).sort((a, b) => a.localeCompare(b));
  const noteItems = notes.map((note) => ({
    slug: note.slug,
    title: note.title,
    date: note.date,
    categories: note.categories,
    tags: note.tags,
    excerpt: note.excerpt,
    searchText: [
      note.title,
      note.excerpt,
      note.content,
      note.categories.join(" "),
      note.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase(),
  }));

  return (
    <section className="page-stack">
      <div className="page-heading">
        <p className="eyebrow">Notes</p>
        <h1>Writeups and Research Notes</h1>
        <p>CTF 풀이, 보안 학습, 알고리즘과 리버싱 기록을 모아둔 공간이다.</p>
      </div>
      <NotesBrowser notes={noteItems} tags={tags} />
    </section>
  );
}
