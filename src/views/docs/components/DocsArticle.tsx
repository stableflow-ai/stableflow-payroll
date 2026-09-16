import type { MouseEvent } from "react";
import enHtml from "../content/en.html?raw";
import { isDocsTocId, type DocsTocId } from "../config";
import "../docs-article.css";

export function DocsArticle(props: {
  onNavigate: (id: DocsTocId) => void;
}) {
  const { onNavigate } = props;

  function handleClick(event: MouseEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") ?? "";
    if (!href.startsWith("#")) return;
    const id = href.slice(1);
    if (!isDocsTocId(id)) return;
    event.preventDefault();
    onNavigate(id);
  }

  return (
    <article
      className="docs-article min-w-0 overflow-x-auto"
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: enHtml }}
    />
  );
}
