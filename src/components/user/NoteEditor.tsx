"use client";

// src/components/user/NoteEditor.tsx
import { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Heading,
  Quote,
  List,
  ListOrdered,
  Minus,
  RemoveFormatting,
} from "lucide-react";
import { saveNote } from "@/actions/learning-note";
import { cn } from "@/lib/utils";

type Props = {
  sopDocumentId: string;
  initialContent: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function NoteEditor({ sopDocumentId, initialContent }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [charCount, setCharCount] = useState(0);

  // Set initial content (only once on mount)
  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
      updateCharCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateCharCount() {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    setCharCount(text.replace(/\n/g, "").length);
  }

  function exec(cmd: string, value?: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
    triggerSave();
  }

  function applyHighlight() {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("hiliteColor", false, "#fef08a");
    triggerSave();
  }

  function applyHeading() {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("formatBlock", false, "<h3>");
    triggerSave();
  }

  function applyQuote() {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("formatBlock", false, "<blockquote>");
    triggerSave();
  }

  function clearFormat() {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("removeFormat");
    document.execCommand("formatBlock", false, "<p>");
    triggerSave();
  }

  function handleInput() {
    updateCharCount();
    triggerSave();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Shortcut: Ctrl+B / Ctrl+I / Ctrl+U
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") {
        e.preventDefault();
        exec("bold");
      } else if (e.key === "i") {
        e.preventDefault();
        exec("italic");
      } else if (e.key === "u") {
        e.preventDefault();
        exec("underline");
      }
    }
  }

  function triggerSave() {
    setSaveStatus("saving");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (!editorRef.current) return;
      const html = editorRef.current.innerHTML;
      try {
        await saveNote(sopDocumentId, html);
        setSaveStatus("saved");
      } catch (e) {
        console.error("Save note error:", e);
        setSaveStatus("error");
      }
    }, 1000); // debounce 1 detik
  }

  // Cleanup pending save on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const tools = [
    { icon: Bold, cmd: "bold", title: "Bold (Ctrl+B)" },
    { icon: Italic, cmd: "italic", title: "Italic (Ctrl+I)" },
    { icon: Underline, cmd: "underline", title: "Underline (Ctrl+U)" },
    { icon: Highlighter, action: applyHighlight, title: "Highlight" },
    { icon: Heading, action: applyHeading, title: "Heading" },
    { icon: Quote, action: applyQuote, title: "Quote" },
    { icon: List, cmd: "insertUnorderedList", title: "Bullet list" },
    { icon: ListOrdered, cmd: "insertOrderedList", title: "Numbered list" },
    { icon: Minus, cmd: "insertHorizontalRule", title: "Horizontal rule" },
    { icon: RemoveFormatting, action: clearFormat, title: "Clear format" },
  ];

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 border-b bg-muted/40">
        {tools.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <button
              key={i}
              type="button"
              title={tool.title}
              onClick={() =>
                tool.action ? tool.action() : exec(tool.cmd!)
              }
              className="w-7 h-7 rounded flex items-center justify-center text-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
            >
              <Icon size={13} />
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={cn(
          "px-3 py-3 text-sm min-h-[180px] max-h-[280px] overflow-y-auto outline-none",
          "[&_b]:font-bold [&_strong]:font-bold",
          "[&_i]:italic [&_em]:italic",
          "[&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1",
          "[&_h4]:text-sm [&_h4]:font-bold [&_h4]:mt-2 [&_h4]:mb-1",
          "[&_ul]:pl-5 [&_ul]:list-disc [&_ul]:my-1.5",
          "[&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:my-1.5",
          "[&_li]:mb-1",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_hr]:my-3 [&_hr]:border-border",
          "[&_mark]:bg-yellow-200 [&_mark]:rounded-sm [&_mark]:px-0.5",
          "data-[empty=true]:before:content-[attr(data-placeholder)] data-[empty=true]:before:text-muted-foreground data-[empty=true]:before:pointer-events-none"
        )}
        data-placeholder="Tulis catatan Anda di sini..."
        data-empty={charCount === 0}
      />

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/40 text-[11px]">
        <span className="text-muted-foreground">
          {charCount.toLocaleString("id-ID")} karakter
        </span>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Tips */}
      <div className="px-3 py-2 bg-amber-50 text-[11px] text-amber-700 border-t border-amber-200">
        💡 Catatan tersimpan otomatis. Akses kapan saja saat membuka SOP ini.
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const map = {
    idle: { color: "text-muted-foreground", text: "Belum ada perubahan" },
    saving: { color: "text-amber-600", text: "Menyimpan..." },
    saved: { color: "text-green-600", text: "✓ Tersimpan" },
    error: { color: "text-destructive", text: "✗ Gagal simpan" },
  };
  const conf = map[status];
  return <span className={conf.color}>{conf.text}</span>;
}
