import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { PayLayoutOutletContext } from "@/layouts/PayLayout";
import useToast from "@/hooks/use-toast";
import { CategoryIcon } from "./category-icon";
import { CategoryTemplatePreview } from "./category-template-preview";
import type { CategoryItem } from "../config";
import { useToggleOperationCategory } from "../use-toggle-operation";

export function CategoryAddPage(props: { item: CategoryItem }) {
  const { item } = props;
  const { setHeaderExtra } = useOutletContext<PayLayoutOutletContext>();
  const toast = useToast();
  const { setEnabled, busy } = useToggleOperationCategory();

  useEffect(() => {
    setHeaderExtra(null);
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-2.5">
        <CategoryIcon category={item.category} src={item.iconSrc} />
        <div className="min-w-0 pt-1">
          <p className="font-montserrat text-base font-semibold capitalize text-black">
            Add {item.title} to Operations
          </p>
          <p className="mt-2 whitespace-pre-line font-montserrat text-sm font-normal leading-[1.5] text-[#606060]">
            {item.description}
          </p>
        </div>
      </div>
      <CategoryTemplatePreview
        item={item}
        onAdd={() => {
          if (busy) return;
          void setEnabled(item, true).catch((error: unknown) => {
            toast.fail({
              title: error instanceof Error ? error.message : "Could not add category",
            });
          });
        }}
      />
    </div>
  );
}
