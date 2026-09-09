import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconBack } from "@/components/icons/back";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { Switch } from "@/components/ui/switch/Switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { useEnabledCategoriesStore } from "@/stores/enabled-categories";
import { CategoryTemplatePreview } from "./components/category-template-preview";
import {
  CATEGORIES,
  CATEGORIES_DRAWER_DESKTOP_QUERY,
  categoryPath,
  type CategoryItem
} from "./config";

export function CategoriesDrawer(props: {
  open: boolean;
  onClose: () => void;
  onNavigate?: () => void;
}) {
  const { open, onClose, onNavigate } = props;
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(CATEGORIES_DRAWER_DESKTOP_QUERY);
  const [previewItem, setPreviewItem] = useState<CategoryItem | null>(null);
  const setEnabled = useEnabledCategoriesStore((state) => state.setEnabled);

  useEffect(() => {
    if (!open) setPreviewItem(null);
  }, [open]);

  function handleClose() {
    setPreviewItem(null);
    onClose();
  }

  function handleAddCategory() {
    if (!previewItem) {
      handleClose();
      return;
    }
    setEnabled(previewItem.id, true);
    const to = categoryPath(previewItem.id);
    handleClose();
    onNavigate?.();
    navigate(to);
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      side={isDesktop ? DRAWER_SIDE.Right : DRAWER_SIDE.Bottom}
      title={
        previewItem ? (
          <span className="flex min-w-0 items-center gap-5">
            <button
              type="button"
              aria-label="Back"
              onClick={() => setPreviewItem(null)}
              className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center text-[#606060]"
            >
              <IconBack className="size-7" />
            </button>
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="size-8 shrink-0 overflow-clip">
                <img src={previewItem.iconSrc} alt="" className="size-8" />
              </span>
              <span className="truncate capitalize">{previewItem.title}</span>
            </span>
          </span>
        ) : (
          "Categories"
        )
      }
      titleClassName={
        previewItem ? "flex min-w-0 flex-1 items-center" : undefined
      }
      panelClassName={isDesktop ? "w-[min(100%,928px)]" : undefined}
      cardClassName={cn(
        "h-full gap-8 p-6 md:px-[50px] md:pt-[46px] md:pb-[50px]",
        !isDesktop && "w-full max-h-[90vh] rounded-b-none"
      )}
    >
      {previewItem ? (
        <CategoryTemplatePreview
          item={previewItem}
          onBack={() => setPreviewItem(null)}
          onAdd={handleAddCategory}
        />
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
          {CATEGORIES.map((item) => (
            <CategoryCard
              key={item.id}
              item={item}
              onPreview={() => setPreviewItem(item)}
            />
          ))}
        </div>
      )}
    </Drawer>
  );
}

function CategoryCard(props: { item: CategoryItem; onPreview: () => void }) {
  const { item, onPreview } = props;
  const enabled = useEnabledCategoriesStore((state) => state.enabledIds.includes(item.id));
  const setEnabled = useEnabledCategoriesStore((state) => state.setEnabled);

  return (
    <Card
      className="group relative h-[190px] cursor-pointer overflow-hidden px-5 pt-6 pb-0"
      onClick={onPreview}
    >
      <div className="flex items-start gap-2.5">
        <span className="size-8 shrink-0 overflow-clip">
          <img src={item.iconSrc} alt="" className="size-8" />
        </span>
        <div className="min-w-0 flex-1 pt-1.5">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate font-montserrat text-base font-semibold capitalize text-black">
              {item.title}
            </p>
            <Switch
              checked={enabled}
              aria-label={item.title}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onCheckedChange={(checked) => setEnabled(item.id, checked)}
            />
          </div>
          <p className="mt-3 line-clamp-2 whitespace-pre-line font-montserrat text-sm font-normal leading-[1.5] text-[#606060]">
            {item.description}
          </p>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-7 bottom-0 h-[77px] overflow-hidden">
        <img
          src={item.previewSrc}
          alt=""
          className="h-[134px] w-full max-w-none object-cover object-top"
        />
      </div>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 flex h-[77px] items-center justify-center",
          "bg-gradient-to-t from-[#fdfdfd] to-[rgba(255,255,255,0)] to-[88%]",
          "opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100"
        )}
      >
        <Button
          className="pointer-events-auto h-[42px] w-[150px] rounded-[12px] border border-[#e0e0e0] px-5 text-[14px] leading-normal shadow-none md:h-[42px] md:px-5 md:text-[14px]"
          onClick={(event) => {
            event.stopPropagation();
            onPreview();
          }}
        >
          View Template
        </Button>
      </div>
    </Card>
  );
}

export default CategoriesDrawer;
