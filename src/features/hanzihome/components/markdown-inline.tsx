import type { ReactNode } from "react";

export function renderMarkdownInline(text: string) {
 const parts: ReactNode[] = [];
 const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_)/g;
 let lastIndex = 0;
 let match: RegExpExecArray | null;

 while ((match = pattern.exec(text)) !== null) {
  const token = match[0];
  if (match.index > lastIndex) {
   parts.push(text.slice(lastIndex, match.index));
  }

  const key = `${match.index}-${token}`;
  if (token.startsWith("`")) {
   parts.push(
    <code
     key={key}
     className="rounded bg-bg-subtle px-1 py-0.5 font-mono text-[0.95em] text-text-primary"
    >
     {token.slice(1, -1)}
    </code>,
   );
  } else if (token.startsWith("**") || token.startsWith("__")) {
   parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
  } else {
   parts.push(<em key={key}>{token.slice(1, -1)}</em>);
  }

  lastIndex = match.index + token.length;
 }

 if (lastIndex < text.length) {
  parts.push(text.slice(lastIndex));
 }

 return parts;
}
