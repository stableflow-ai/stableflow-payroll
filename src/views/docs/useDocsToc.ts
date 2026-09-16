import { useCallback, useEffect, useRef, useState } from "react";
import { DOCS_SPY_VIEWPORT_RATIO, DOCS_TOC_IDS, isDocsTocId, type DocsTocId } from "./config";

const DEFAULT_ID: DocsTocId = DOCS_TOC_IDS[0];

function readHashId(): DocsTocId | null {
  const raw = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  if (!raw) return null;
  return isDocsTocId(raw) ? raw : null;
}

function scrollToId(id: DocsTocId, behavior: ScrollBehavior) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior, block: "start" });
}

export function pickLastHeadingPastOffset<T extends string>(
  headings: ReadonlyArray<{ id: T; top: number }>,
  offset: number,
  fallback: T,
): T {
  let current = fallback;
  for (const heading of headings) {
    if (heading.top <= offset) current = heading.id;
  }
  return current;
}

function headingIdAtScroll(): DocsTocId {
  const offset = window.innerHeight * DOCS_SPY_VIEWPORT_RATIO;
  const headings = DOCS_TOC_IDS.flatMap((id) => {
    const el = document.getElementById(id);
    return el ? [{ id, top: el.getBoundingClientRect().top }] : [];
  });
  return pickLastHeadingPastOffset(headings, offset, DEFAULT_ID);
}

export function useDocsToc() {
  const [activeId, setActiveId] = useState<DocsTocId>(DEFAULT_ID);
  const scrollingRef = useRef(false);
  const scrollTimerRef = useRef<number | null>(null);

  const applySpy = useCallback(() => {
    if (scrollingRef.current) return;
    const id = headingIdAtScroll();
    setActiveId((current) => {
      if (current === id) return current;
      const url = `${window.location.pathname}${window.location.search}#${id}`;
      window.history.replaceState(null, "", url);
      return id;
    });
  }, []);

  const navigateTo = useCallback((id: DocsTocId, behavior: ScrollBehavior = "smooth") => {
    scrollingRef.current = true;
    if (scrollTimerRef.current != null) {
      window.clearTimeout(scrollTimerRef.current);
    }
    setActiveId(id);
    const url = `${window.location.pathname}${window.location.search}#${id}`;
    window.history.pushState(null, "", url);
    scrollToId(id, behavior);
    scrollTimerRef.current = window.setTimeout(() => {
      scrollingRef.current = false;
      scrollTimerRef.current = null;
    }, 800);
  }, []);

  useEffect(() => {
    const applyHash = (behavior: ScrollBehavior) => {
      const hashId = readHashId();
      if (!hashId) {
        applySpy();
        return;
      }
      setActiveId(hashId);
      scrollToId(hashId, behavior);
    };

    const frame = window.requestAnimationFrame(() => {
      applyHash("auto");
      window.setTimeout(() => applyHash("auto"), 50);
    });

    const onHashChange = () => applyHash("smooth");
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [applySpy]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        applySpy();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    applySpy();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [applySpy]);

  return { activeId, navigateTo };
}
