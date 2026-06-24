"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { RawEmbed } from "./extensions/RawEmbed";

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
  {
    label: "</>",
    title: "Bloc de code",
    isActive: (e) => !!e?.isActive("codeBlock"),
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
];

export function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) {
  const [embedOpen, setEmbedOpen] = useState(false);
  const [embedCode, setEmbedCode] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, defaultProtocol: "https" }),
      RawEmbed,
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

  function openEmbed() {
    if (!editor) return;
    const current = editor.isActive("rawEmbed")
      ? (editor.getAttributes("rawEmbed").html as string) ?? ""
      : "";
    setEmbedCode(current);
    setEmbedOpen(true);
  }

  function applyEmbed() {
    if (!editor) return;
    const code = embedCode.trim();
    if (!code) {
      setEmbedOpen(false);
      return;
    }
    if (editor.isActive("rawEmbed")) {
      editor.chain().focus().updateAttributes("rawEmbed", { html: code }).run();
    } else {
      editor.chain().focus().setRawEmbed(code).run();
    }
    setEmbedOpen(false);
  }

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
        <button
          type="button"
          title="Schéma (HTML/SVG)"
          onClick={openEmbed}
          className={`border-2 border-ink px-2.5 py-1 text-xs font-bold transition-colors ${
            editor?.isActive("rawEmbed") ? "bg-[var(--sunshine)]" : "bg-[var(--cream)] hover:bg-[var(--sunshine)]"
          }`}
        >
          Schéma
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

      {embedOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEmbedOpen(false)}
        >
          <div
            className="nb-card flex w-full max-w-[680px] flex-col gap-3 bg-[var(--cream)] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-bold">Schéma — HTML / SVG brut</div>
            <p className="text-xs opacity-70">
              Colle ici le code d&apos;un schéma (SVG ou HTML). Il est stocké dans l&apos;article
              (aucun fichier) et préservé à l&apos;édition.
            </p>
            <textarea
              className="min-h-[280px] w-full border-2 border-ink bg-[var(--cream-2)] p-3 font-mono text-xs"
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              placeholder="<figure>…<svg>…</svg></figure>"
              spellCheck={false}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEmbedOpen(false)}
                className="border-2 border-ink bg-[var(--cream)] px-3 py-1 text-xs font-bold hover:bg-[var(--sunshine)]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={applyEmbed}
                className="border-2 border-ink bg-[var(--sunshine)] px-3 py-1 text-xs font-bold"
              >
                Insérer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
