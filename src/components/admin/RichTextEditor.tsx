"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

const buttons: {
  label: string;
  title: string;
  isActive: (e: Editor | null) => boolean;
  run: (e: Editor) => void;
}[] = [
  {
    label: "G",
    title: "Gras",
    isActive: (e) => !!e?.isActive("bold"),
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    label: "I",
    title: "Italique",
    isActive: (e) => !!e?.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: "H2",
    title: "Titre",
    isActive: (e) => !!e?.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "H3",
    title: "Sous-titre",
    isActive: (e) => !!e?.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: "• Liste",
    title: "Liste à puces",
    isActive: (e) => !!e?.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "1. Liste",
    title: "Liste numérotée",
    isActive: (e) => !!e?.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "❝",
    title: "Citation",
    isActive: (e) => !!e?.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
];

export function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, defaultProtocol: "https" }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-article min-h-[360px] p-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL du lien :", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="nb-card overflow-hidden p-0">
      <div className="flex flex-wrap gap-1 border-b-2 border-ink bg-[var(--cream-2)] p-2">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            title={btn.title}
            onClick={() => editor && btn.run(editor)}
            className={`border-2 border-ink px-2.5 py-1 text-xs font-bold transition-colors ${
              btn.isActive(editor) ? "bg-[var(--sunshine)]" : "bg-[var(--cream)] hover:bg-[var(--sunshine)]"
            }`}
          >
            {btn.label}
          </button>
        ))}
        <button
          type="button"
          title="Lien"
          onClick={setLink}
          className={`border-2 border-ink px-2.5 py-1 text-xs font-bold transition-colors ${
            editor?.isActive("link") ? "bg-[var(--sunshine)]" : "bg-[var(--cream)] hover:bg-[var(--sunshine)]"
          }`}
        >
          Lien
        </button>
        <span className="mx-1 w-px bg-ink/20" />
        <button
          type="button"
          title="Annuler"
          onClick={() => editor?.chain().focus().undo().run()}
          className="border-2 border-ink bg-[var(--cream)] px-2.5 py-1 text-xs font-bold hover:bg-[var(--sunshine)]"
        >
          ↩
        </button>
        <button
          type="button"
          title="Rétablir"
          onClick={() => editor?.chain().focus().redo().run()}
          className="border-2 border-ink bg-[var(--cream)] px-2.5 py-1 text-xs font-bold hover:bg-[var(--sunshine)]"
        >
          ↪
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
