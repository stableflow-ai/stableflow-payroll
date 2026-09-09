import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { PayLayoutOutletContext } from "@/layouts/PayLayout";
import { useEnabledCategoriesStore } from "@/stores/enabled-categories";
import type { CategoryItem } from "../config";
import { CategoryTemplatePreview } from "./category-template-preview";

export function CategoryAddPage(props: { item: CategoryItem }) {
  const { item } = props;
  const { setHeaderExtra } = useOutletContext<PayLayoutOutletContext>();
  const setEnabled = useEnabledCategoriesStore((state) => state.setEnabled);

  useEffect(() => {
    setHeaderExtra(null);
    return () => setHeaderExtra(null);
  }, [setHeaderExtra]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-2.5">
        <span className="size-8 shrink-0 overflow-clip">
          <img src={item.iconSrc} alt="" className="size-8" />
        </span>
        <div className="min-w-0 pt-1">
          <p className="font-montserrat text-base font-semibold capitalize text-black">
            Add {item.title} to Operations
          </p>
          <p className="mt-2 whitespace-pre-line font-montserrat text-sm font-normal leading-[1.5] text-[#606060]">
            {item.description}
          </p>
        </div>
      </div>
      <CategoryTemplatePreview item={item} onAdd={() => setEnabled(item.id, true)} />
    </div>
  );
}
