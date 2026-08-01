import type { Editor as TiptapEditor } from "@tiptap/react";

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export function Toolbar({
  editor,
  onRequestImageUpload,
}: {
  editor: TiptapEditor;
  onRequestImageUpload?: () => void;
}) {
  const blockValue = HEADING_LEVELS.find((level) => editor.isActive("heading", { level }))
    ? String(HEADING_LEVELS.find((level) => editor.isActive("heading", { level })))
    : "paragraph";

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-foreground/10 pb-3">
      <select
        value={blockValue}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "paragraph") {
            editor.chain().focus().setParagraph().run();
          } else {
            editor
              .chain()
              .focus()
              .setHeading({ level: Number(value) as (typeof HEADING_LEVELS)[number] })
              .run();
          }
        }}
        className="mr-2 rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm text-foreground"
      >
        <option value="paragraph" className="bg-background text-foreground">
          Paragraph
        </option>
        {HEADING_LEVELS.map((level) => (
          <option key={level} value={level} className="bg-background text-foreground">
            Heading {level}
          </option>
        ))}
      </select>

      <ToolbarButton
        active={editor.isActive("bold")}
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        label="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •≡
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        label="Ordered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1≡
      </ToolbarButton>

      {onRequestImageUpload && (
        <>
          <Divider />
          <ToolbarButton label="Insert image" onClick={onRequestImageUpload}>
            🖼
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-foreground/10" />;
}

function ToolbarButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm hover:bg-foreground/10 ${
        active ? "bg-foreground/10 font-semibold" : ""
      }`}
    >
      {children}
    </button>
  );
}
