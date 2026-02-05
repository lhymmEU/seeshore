"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { useCallback, useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Table as TableIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

function MenuButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        isActive
          ? "bg-zinc-200 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      HorizontalRule,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: parseContent(content),
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(JSON.stringify(json));
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-zinc prose-sm max-w-none focus:outline-none min-h-[120px]",
          "prose-headings:font-semibold prose-headings:text-zinc-900",
          "prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6",
          "prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5",
          "prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4",
          "prose-p:text-zinc-700 prose-p:leading-relaxed prose-p:my-2",
          "prose-ul:my-2 prose-ol:my-2",
          "prose-li:text-zinc-700 prose-li:my-0.5",
          "prose-hr:my-4 prose-hr:border-zinc-200",
          "prose-table:border-collapse prose-table:w-full",
          "prose-th:border prose-th:border-zinc-300 prose-th:bg-zinc-50 prose-th:p-2 prose-th:text-left",
          "prose-td:border prose-td:border-zinc-300 prose-td:p-2",
          "[&_.is-editor-empty:first-child::before]:text-zinc-400 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:h-0"
        ),
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content) {
      try {
        const parsed = JSON.parse(content);
        const currentContent = editor.getJSON();
        if (JSON.stringify(currentContent) !== JSON.stringify(parsed)) {
          editor.commands.setContent(parsed);
        }
      } catch {
        // If content is not valid JSON, treat as plain text
        if (editor.getText() !== content) {
          editor.commands.setContent(content);
        }
      }
    }
  }, [content, editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addDivider = useCallback(() => {
    editor?.chain().focus().setHorizontalRule().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 mb-3 p-2 bg-zinc-50 rounded-xl border border-zinc-200">
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={18} />
          </MenuButton>
          
          <div className="w-px h-5 bg-zinc-300 mx-1" />
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough size={18} />
          </MenuButton>
          
          <div className="w-px h-5 bg-zinc-300 mx-1" />
          
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List size={18} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered size={18} />
          </MenuButton>
          
          <div className="w-px h-5 bg-zinc-300 mx-1" />
          
          <MenuButton onClick={addDivider} title="Add Divider">
            <Minus size={18} />
          </MenuButton>
          <MenuButton onClick={addTable} title="Add Table">
            <TableIcon size={18} />
          </MenuButton>

          {/* Table controls when table is selected */}
          {editor.isActive("table") && (
            <>
              <div className="w-px h-5 bg-zinc-300 mx-1" />
              <MenuButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Add Column"
              >
                <Plus size={18} />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Add Row"
              >
                <Plus size={18} className="rotate-90" />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Delete Table"
              >
                <Trash2 size={18} />
              </MenuButton>
            </>
          )}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

// Component to render rich text content (read-only)
export function RichTextRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      HorizontalRule,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: parseContent(content),
    editable: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-zinc prose-sm max-w-none",
          "prose-headings:font-semibold prose-headings:text-zinc-900",
          "prose-h1:text-xl prose-h1:mb-3 prose-h1:mt-4",
          "prose-h2:text-lg prose-h2:mb-2 prose-h2:mt-3",
          "prose-h3:text-base prose-h3:mb-2 prose-h3:mt-3 prose-h3:font-medium",
          "prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:my-1.5",
          "prose-ul:my-1.5 prose-ol:my-1.5",
          "prose-li:text-zinc-600 prose-li:my-0.5",
          "prose-hr:my-3 prose-hr:border-zinc-200",
          "prose-table:border-collapse prose-table:w-full prose-table:text-xs",
          "prose-th:border prose-th:border-zinc-300 prose-th:bg-zinc-50 prose-th:p-1.5 prose-th:text-left prose-th:font-medium",
          "prose-td:border prose-td:border-zinc-300 prose-td:p-1.5",
          "prose-strong:font-semibold",
          className
        ),
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(parseContent(content));
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
}

// Helper function to parse content
function parseContent(content: string) {
  if (!content) return "";
  
  try {
    return JSON.parse(content);
  } catch {
    // If it's not JSON, treat it as plain text
    return content;
  }
}
