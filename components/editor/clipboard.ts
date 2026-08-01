import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Slice } from "@tiptap/pm/model";

function serializeListForClipboard(list: ProseMirrorNode, depth = 0): string {
  const indent = "  ".repeat(depth);
  let index = typeof list.attrs.start === "number" ? list.attrs.start : 1;
  let out = "";

  list.forEach((listItem) => {
    const marker = list.type.name === "orderedList" ? `${index}.` : "-";
    let itemText = "";
    let nested = "";

    listItem.forEach((child) => {
      if (child.type.name === "bulletList" || child.type.name === "orderedList") {
        nested += serializeListForClipboard(child, depth + 1);
      } else {
        itemText += child.textContent;
      }
    });

    out += `${indent}${marker} ${itemText}\n${nested}`;
    index++;
  });

  return out;
}

export function clipboardTextSerializer(slice: Slice): string {
  let text = "";
  slice.content.forEach((node) => {
    if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      text += serializeListForClipboard(node);
    } else {
      text += `${node.textContent}\n`;
    }
  });
  return text.trim();
}
