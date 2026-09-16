import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowDown, IconMenu } from "@/components/icons";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DocsArticle } from "./components/DocsArticle";
import { DocsTableOfContents } from "./components/DocsTableOfContents";
import {
  DOCS_BACK_TO_TOP_SCROLL_PX,
  DOCS_COPY,
  DOCS_TOC_RAIL_QUERY,
  DOCS_WIDE_DRAWER_QUERY,
  type DocsTocId,
} from "./config";
import { useDocsToc } from "./useDocsToc";

function BackButton(props: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="inline-flex items-center gap-2 font-montserrat text-[16px] font-medium text-black transition-opacity hover:opacity-70"
    >
      <span
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white"
        aria-hidden
      >
        <IconArrowDown className="size-3 rotate-90 text-black" />
      </span>
      {props.label}
    </button>
  );
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

function BackToTopButton(props: { label: string; visible: boolean }) {
  if (!props.visible) return null;
  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={props.label}
      className="fixed right-4 shrink-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20 flex min-w-11 min-h-11 w-11 h-11 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-70"
    >
      <IconArrowDown className="size-3 rotate-180" />
    </button>
  );
}

export function DocsView() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const rail = useMediaQuery(DOCS_TOC_RAIL_QUERY);
  const wideDrawer = useMediaQuery(DOCS_WIDE_DRAWER_QUERY);
  const { activeId, navigateTo } = useDocsToc();

  useEffect(() => {
    document.title = DOCS_COPY.documentTitle;
    return () => {
      document.title = "Stableflow Pay";
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > DOCS_BACK_TO_TOP_SCROLL_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }
    navigate("/login");
  };

  function handleNavigate(id: DocsTocId) {
    navigateTo(id);
    setMenuOpen(false);
  }

  const toc = <DocsTableOfContents activeId={activeId} onNavigate={handleNavigate} />;

  return (
    <div className="min-h-svh bg-[#f6f6f6] text-black">
      <div className="mx-auto w-full max-w-[1512px] px-2.5 pb-12 pt-2.5 sm:px-4 md:px-6 lg:px-2.5">
        <div className="mt-2 flex gap-8 lg:mt-4 lg:gap-10 xl:gap-12">
          <aside className="hidden w-[276px] shrink-0 lg:block">
            <div className="sticky top-6 flex max-h-[calc(100svh-3rem)] flex-col overflow-y-auto pr-1">
              <div className="mb-4">
                <BackButton label={DOCS_COPY.back} onClick={goBack} />
              </div>
              {toc}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
              <BackButton label={DOCS_COPY.back} onClick={goBack} />
              <Button
                type="button"
                variant={BUTTON_VARIANT.Normal}
                size={BUTTON_SIZE.Sm}
                className="h-9 w-auto px-3 text-sm"
                onClick={() => setMenuOpen(true)}
              >
                <IconMenu className="size-3.5" />
                {DOCS_COPY.contents}
              </Button>
            </div>
            <DocsArticle onNavigate={handleNavigate} />
          </div>
        </div>
      </div>

      {rail ? null : (
        <Drawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          side={wideDrawer ? DRAWER_SIDE.Left : DRAWER_SIDE.Bottom}
          title={DOCS_COPY.contents}
          cardClassName="max-h-[90vh] overflow-y-auto"
        >
          {toc}
        </Drawer>
      )}

      <BackToTopButton label={DOCS_COPY.backToTop} visible={showBackToTop} />
    </div>
  );
}
