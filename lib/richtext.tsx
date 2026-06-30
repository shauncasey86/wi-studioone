import { type ReactNode } from "react";

/**
 * Renders the editable rich-text convention (CLAUDE.md §5): plain text with
 * *italic* (the marigold <em> accent) and **bold** (<strong>), plus inline
 * [label](href) links (needed for copy like the rates note). HTML escaping is
 * handled by construction — React escapes any string rendered as a child, so we
 * only ever emit text nodes plus <em>/<strong>/<a> elements, never raw HTML.
 * Link hrefs are scheme-checked; anything unexpected renders as plain text.
 *
 * Bold is parsed before italic; links are parsed first. Markers do not nest in
 * the source copy, but italics inside bold/links are tolerated.
 */
function safeHref(href: string): string | null {
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href) ? href : null;
}

function splitItalic(text: string, keyBase: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<em key={`${keyBase}-i${i}`}>{m[1]}</em>);
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function inline(text: string, keyBase: string): ReactNode[] {
  // bold first, italic within the rest
  const parts: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last)
      parts.push(...splitItalic(text.slice(last, m.index), `${keyBase}p${i}`));
    parts.push(
      <strong key={`${keyBase}b${i}`}>
        {splitItalic(m[1], `${keyBase}bi${i}`)}
      </strong>,
    );
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length)
    parts.push(...splitItalic(text.slice(last), `${keyBase}t`));
  return parts;
}

export function rich(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g; // [label](href)
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last)
      parts.push(...inline(text.slice(last, m.index), `a${i}`));
    const href = safeHref(m[2]);
    if (href) {
      parts.push(
        <a key={`a${i}`} href={href}>
          {inline(m[1], `al${i}`)}
        </a>,
      );
    } else {
      parts.push(...inline(m[1], `al${i}`)); // unsafe href → plain text
    }
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) parts.push(...inline(text.slice(last), "tail"));
  return parts;
}
