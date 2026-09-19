import sanitizeHtml from "sanitize-html";
import { Parser } from "htmlparser2";

export function cleanDescription(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "h2", "h3", "blockquote", "ul", "ol", "li"],
    allowedAttributes: {},
  });
}

export function descriptionText(html: string) {
  let text = "";
  const parser = new Parser({
    ontext(value) { text += value; },
    onclosetag(tag) {
      if (["p", "br", "h2", "h3", "li", "blockquote"].includes(tag)) text += "\n";
    },
  }, { decodeEntities: true });
  parser.end(cleanDescription(html));
  return text.replace(/\n{3,}/g, "\n\n").trim();
}
