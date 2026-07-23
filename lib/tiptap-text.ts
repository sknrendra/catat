import type { JSONContent } from "@tiptap/core";

export function extractPlainText(content: JSONContent): string {
  let text = "";
  if (content.text) text += content.text;
  for (const child of content.content ?? []) {
    text += (text ? " " : "") + extractPlainText(child);
  }
  return text;
}
