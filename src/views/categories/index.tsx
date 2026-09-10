import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconBack } from "@/components/icons/back";
import { IconLoading } from "@/components/icons/loading";
import { Button } from "@/components/ui/button/Button";
import { Card } from "@/components/ui/card/Card";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { Switch } from "@/components/ui/switch/Switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useOperationCatalogQuery } from "@/hooks/use-operation-api";
import useToast from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./components/category-icon";
import { CategoryTemplatePreview } from "./components/category-template-preview";
import {
  CATEGORIES_DRAWER_DESKTOP_QUERY,
  catalogToCategoryItem,
  categoryPath,
  isCategoryNavEnabled,
  type CategoryItem,
} from "./config";
import { useToggleOperationCategory } from "./use-toggle-operation";

export function CategoriesDrawer(props: {
  open: boolean;
  onClose: () => void;
  onNavigate?: () => void;
}) {
  const { open, onClose, onNavigate } = props;
  const navigate = useNavigate();
  const toast = useToast();
  const isDesktop = useMediaQuery(CATEGORIES_DRAWER_DESKTOP_QUERY);
  const catalogQuery = useOperationCatalogQuery();
  const items = useMemo(
    () => (catalogQuery.data ?? []).map(catalogToCategoryItem),
    [catalogQuery.data],
  );
  const [previewItem, setPreviewItem] = useState<CategoryItem | null>(null);
  const { setEnabled, busy } = useToggleOperationCategory();

  useEffect(() => {
    if (!open) setPreviewItem(null);
  }, [open]);

  useEffect(() => {
    if (!previewItem) return;
    const next = items.find((item) => item.category === previewItem.category);
    if (next) setPreviewItem(next);
  }, [items, previewItem]);

  function handleClose() {
    setPreviewItem(null);
    onClose();
  }

  async function handleAddCategory() {
    if (!previewItem) {
      handleClose();
      return;
    }
    try {
      await setEnabled(previewItem, true);
      const to = categoryPath(previewItem.category);
      handleClose();
      onNavigate?.();
      navigate(to);
    } catch (error) {
      toast.fail({
        title: error instanceof Error ? error.message : "Could not add category",
      });
    }
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
              <CategoryIcon category={previewItem.category} src={previewItem.iconSrc} />
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
        !isDesktop && "w-full max-h-[90vh] rounded-b-none",
      )}
    >
      {previewItem ? (
        <CategoryTemplatePreview
          item={previewItem}
          onBack={() => setPreviewItem(null)}
          onAdd={() => {
            void handleAddCategory();
          }}
        />
      ) : catalogQuery.isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <IconLoading className="size-5 animate-spin text-[#909090]" />
        </div>
      ) : catalogQuery.isError ? (
        <p className="font-montserrat text-sm text-danger">
          {catalogQuery.error instanceof Error
            ? catalogQuery.error.message
            : "Failed to load categories"}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">
          {items.map((item) => (
            <CategoryCard
              key={item.category}
              item={item}
              busy={busy}
              onPreview={() => setPreviewItem(item)}
              onToggle={async (checked) => {
                try {
                  await setEnabled(item, checked);
                } catch (error) {
                  toast.fail({
                    title:
                      error instanceof Error ? error.message : "Could not update category",
                  });
                }
              }}
            />
          ))}
        </div>
      )}
    </Drawer>
  );
}

function CategoryCard(props: {
  item: CategoryItem;
  busy: boolean;
  onPreview: () => void;
  onToggle: (checked: boolean) => void | Promise<void>;
}) {
  const { item, busy, onPreview, onToggle } = props;
  const enabled = isCategoryNavEnabled(item);

  return (
    <Card
      className="group relative h-[190px] cursor-pointer overflow-hidden px-5 pt-6 pb-0"
      onClick={onPreview}
    >
      <div className="flex items-start gap-2.5">
        <CategoryIcon category={item.category} src={item.iconSrc} />
        <div className="min-w-0 flex-1 pt-1.5">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate font-montserrat text-base font-semibold capitalize text-black">
              {item.title}
            </p>
            <Switch
              checked={enabled}
              disabled={busy}
              aria-label={item.title}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onCheckedChange={(checked) => {
                void onToggle(checked);
              }}
            />
          </div>
          <p className="mt-3 line-clamp-2 whitespace-pre-line font-montserrat text-sm font-normal leading-[1.5] text-[#606060]">
            {item.description}
          </p>
        </div>
      </div>
      {item.previewSrc ? (
        <div className="pointer-events-none absolute inset-x-7 bottom-0 h-[77px] overflow-hidden">
          <img
            src={item.previewSrc}
            alt=""
            className="h-[134px] w-full max-w-none object-cover object-top"
          />
        </div>
      ) : null}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 flex h-[77px] items-center justify-center",
          "bg-gradient-to-t from-[#fdfdfd] to-[rgba(255,255,255,0)] to-[88%]",
          "opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100",
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
