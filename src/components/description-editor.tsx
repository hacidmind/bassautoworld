"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function DescriptionEditor({
  html,
  text,
  disabled,
  onChange,
}: {
  html?: string;
  text: string;
  disabled: boolean;
  onChange: (html: string, text: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
    ],
    immediatelyRender: false,
    content: html || {
      type: "doc",
      content: (text || "")
        .split("\n")
        .map((line) => ({
          type: "paragraph",
          content: line ? [{ type: "text", text: line }] : [],
        })),
    },
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Vehicle description *",
        "aria-multiline": "true",
        "aria-required": "true",
        "aria-describedby": "description-help",
        class: "rich-description description-input",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML(), editor.getText()),
  });
  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold"),
      italic: editor?.isActive("italic"),
      underline: editor?.isActive("underline"),
      quote: editor?.isActive("blockquote"),
      bullet: editor?.isActive("bulletList"),
      ordered: editor?.isActive("orderedList"),
      block: editor?.isActive("heading", { level: 2 })
        ? "h2"
        : editor?.isActive("heading", { level: 3 })
          ? "h3"
          : "p",
      length: editor?.getText().length || 0,
    }),
  });
  return (
    <div className="field full">
      <span>Vehicle description *</span>
      <div className="rich-editor">
        <div
          className="description-toolbar"
          role="group"
          aria-label="Description formatting"
        >
          <select
            aria-label="Text style"
            disabled={!editor || disabled}
            value={state?.block || "p"}
            onChange={(e) => {
              if (e.target.value === "p")
                editor?.chain().focus().setParagraph().run();
              else
                editor
                  ?.chain()
                  .focus()
                  .setHeading({ level: e.target.value === "h2" ? 2 : 3 })
                  .run();
            }}
          >
            <option value="p">Paragraph</option>
            <option value="h2">Heading</option>
            <option value="h3">Sub-heading</option>
          </select>
          {[
            {
              label: "Bold",
              active: state?.bold,
              action: () => editor?.chain().focus().toggleBold().run(),
            },
            {
              label: "Italic",
              active: state?.italic,
              action: () => editor?.chain().focus().toggleItalic().run(),
            },
            {
              label: "Underline",
              active: state?.underline,
              action: () => editor?.chain().focus().toggleUnderline().run(),
            },
            {
              label: "Quote",
              active: state?.quote,
              action: () => editor?.chain().focus().toggleBlockquote().run(),
            },
            {
              label: "Bullet list",
              active: state?.bullet,
              action: () => editor?.chain().focus().toggleBulletList().run(),
            },
            {
              label: "Numbered list",
              active: state?.ordered,
              action: () => editor?.chain().focus().toggleOrderedList().run(),
            },
            {
              label: "Clear formatting",
              active: undefined,
              action: () =>
                editor?.chain().focus().unsetAllMarks().clearNodes().run(),
            },
            {
              label: "Undo",
              active: undefined,
              action: () => editor?.chain().focus().undo().run(),
            },
            {
              label: "Redo",
              active: undefined,
              action: () => editor?.chain().focus().redo().run(),
            },
          ].map((button) => (
            <button
              key={button.label}
              type="button"
              disabled={!editor || disabled}
              aria-pressed={button.active}
              onClick={button.action}
            >
              {button.label}
            </button>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
      <span id="description-help" className="muted">
        Select text to format it. Formatting appears on the listing; vehicle
        cards show a plain-text preview. {state?.length || 0}/15,000 characters.
      </span>
    </div>
  );
}
