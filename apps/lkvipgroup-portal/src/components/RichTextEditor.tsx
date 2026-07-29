"use client";

import { useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Image,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const tools = [
  { icon: Bold, cmd: "bold", label: "Bold" },
  { icon: Italic, cmd: "italic", label: "Italic" },
  { icon: Heading2, cmd: "formatBlock", value: "h2", label: "Heading" },
  { icon: List, cmd: "insertUnorderedList", label: "Bullet List" },
  { icon: ListOrdered, cmd: "insertOrderedList", label: "Numbered List" },
  { icon: Quote, cmd: "formatBlock", value: "blockquote", label: "Quote" },
];

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternal = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || isInternal.current) {
      isInternal.current = false;
      return;
    }
    if (el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        if (data.url) {
          document.execCommand("insertImage", false, data.url);
          if (editorRef.current) onChange(editorRef.current.innerHTML);
          toast.success("Image inserted");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Image upload failed");
      }
    };
    input.click();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternal.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <div className="flex items-center gap-0.5 p-1.5 bg-fortress-deep border-b border-white/10 flex-wrap">
        {tools.map((t) => (
          <button
            key={t.cmd + (t.value || "")}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); exec(t.cmd, t.value); }}
            className="p-1.5 text-fortress-silver hover:text-fortress-ivory hover:bg-fortress-charcoal transition-colors rounded-md"
            title={t.label}
          >
            <t.icon className="w-4 h-4" />
          </button>
        ))}
        <span className="w-px h-5 bg-white/10 mx-1" />
        <button
          type="button"
          onClick={handleImageUpload}
          className="p-1.5 text-fortress-silver hover:text-fortress-ivory hover:bg-fortress-charcoal transition-colors rounded-md"
          title="Insert Image"
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="w-4 h-4" />
        </button>
        <span className="w-px h-5 bg-white/10 mx-1" />
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand("undo"); if (editorRef.current) onChange(editorRef.current.innerHTML); }}
          className="p-1.5 text-fortress-silver hover:text-fortress-ivory hover:bg-fortress-charcoal transition-colors rounded-md"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand("redo"); if (editorRef.current) onChange(editorRef.current.innerHTML); }}
          className="p-1.5 text-fortress-silver hover:text-fortress-ivory hover:bg-fortress-charcoal transition-colors rounded-md"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[300px] p-4 bg-fortress-charcoal text-fortress-ivory text-sm focus:outline-none prose prose-invert max-w-none"
        onInput={handleInput}
      />
    </div>
  );
}
