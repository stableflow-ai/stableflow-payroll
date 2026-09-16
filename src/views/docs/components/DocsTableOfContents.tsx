import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { DOCS_TOC, type DocsTocId } from "../config";

type DocsTableOfContentsProps = {
  activeId: DocsTocId;
  onNavigate: (id: DocsTocId) => void;
};

export function DocsTableOfContents(props: DocsTableOfContentsProps) {
  const { activeId, onNavigate } = props;
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = navRef.current?.querySelector(`[data-toc-id="${CSS.escape(activeId)}"]`);
    if (!(el instanceof HTMLElement) || el.getClientRects().length === 0) return;
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  return (
    <nav ref={navRef} aria-label="Page sections" className="flex flex-col gap-1">
      {DOCS_TOC.map((section) => {
        const sectionActive = activeId === section.id;
        return (
          <div key={section.id}>
            <a
              href={`#${section.id}`}
              data-toc-id={section.id}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(section.id);
              }}
              className={cn(
                "block rounded-[6px] px-3 py-2.5 font-montserrat text-[14px] leading-snug transition-colors",
                sectionActive
                  ? "bg-[#ebebeb] font-medium text-black"
                  : "font-normal text-[#606060] hover:text-black",
              )}
            >
              <span className="line-clamp-2">{section.label}</span>
            </a>
            {section.children?.length ? (
              <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-[#e3e3e3] pl-2">
                {section.children.map((child) => {
                  const childActive = activeId === child.id;
                  return (
                    <a
                      key={child.id}
                      href={`#${child.id}`}
                      data-toc-id={child.id}
                      onClick={(event) => {
                        event.preventDefault();
                        onNavigate(child.id);
                      }}
                      className={cn(
                        "block rounded-[6px] px-3 py-1.5 font-montserrat text-[13px] leading-snug transition-colors",
                        childActive
                          ? "bg-[#ebebeb] font-medium text-black"
                          : "font-normal text-[#606060] hover:text-black",
                      )}
                    >
                      <span className="line-clamp-2">{child.label}</span>
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
