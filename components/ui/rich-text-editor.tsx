"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
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
  Pilcrow,
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
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

// Editor styles as a CSS string to inject
const editorStyles = `
  .rich-text-editor h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #18181b;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    line-height: 1.3;
  }
  .rich-text-editor h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #18181b;
    margin-top: 0.875rem;
    margin-bottom: 0.375rem;
    line-height: 1.4;
  }
  .rich-text-editor h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #27272a;
    margin-top: 0.75rem;
    margin-bottom: 0.25rem;
    line-height: 1.4;
  }
  .rich-text-editor p {
    color: #3f3f46;
    line-height: 1.6;
    margin: 0.5rem 0;
  }
  .rich-text-editor ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  .rich-text-editor ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  .rich-text-editor li {
    color: #3f3f46;
    margin: 0.25rem 0;
  }
  .rich-text-editor hr {
    border: none;
    border-top: 1px solid #e4e4e7;
    margin: 1rem 0;
  }
  .rich-text-editor strong {
    font-weight: 600;
  }
  .rich-text-editor em {
    font-style: italic;
  }
  .rich-text-editor s {
    text-decoration: line-through;
  }
  .rich-text-editor .is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    color: #a1a1aa;
    pointer-events: none;
    float: left;
    height: 0;
  }
`;

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
        horizontalRule: {},
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: parseContent(content),
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(JSON.stringify(json));
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

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
      
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 mb-3 p-2 bg-secondary rounded-xl border border-border">
          <MenuButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive("paragraph") && !editor.isActive("heading")}
            title="Paragraph"
          >
            <Pilcrow size={18} />
          </MenuButton>
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
          
          <div className="w-px h-5 bg-muted mx-1" />
          
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
          
          <div className="w-px h-5 bg-muted mx-1" />
          
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
          
          <div className="w-px h-5 bg-muted mx-1" />
          
          <MenuButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Add Divider"
          >
            <Minus size={18} />
          </MenuButton>
        </div>
      )}

      <EditorContent 
        editor={editor} 
        className="rich-text-editor focus:outline-none min-h-[120px]"
      />
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
        horizontalRule: {},
      }),
    ],
    content: parseContent(content),
    editable: false,
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(parseContent(content));
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
      <EditorContent 
        editor={editor} 
        className={cn("rich-text-editor", className)}
      />
    </>
  );
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
