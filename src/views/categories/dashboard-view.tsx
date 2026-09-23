import { Navigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { useOperationCatalogQuery } from "@/hooks/use-operation-api";
import { CategoryAddPage } from "./components/category-add-page";
import { CategoryPage } from "./components/category-page";
import {
  catalogToCategoryItem,
  isCategoryNavEnabled,
  payCategoryFromPath,
} from "./config";

export function CategoryDashboardView() {
  const { categoryId } = useParams();
  const catalogQuery = useOperationCatalogQuery();
  const category = categoryId?.trim() ?? "";

  if (!category || payCategoryFromPath(`/pay/${category}`) !== category) {
    return <Navigate to="/" replace />;
  }

  if (catalogQuery.isLoading) {
    return <Skeleton className="h-[360px] w-full" />;
  }

  if (catalogQuery.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {catalogQuery.error instanceof Error
          ? catalogQuery.error.message
          : "Failed to load category"}
      </p>
    );
  }

  const raw = (catalogQuery.data ?? []).find((item) => item.category === category);
  if (!raw) {
    return <Navigate to="/" replace />;
  }

  const item = catalogToCategoryItem(raw);
  if (!isCategoryNavEnabled(item)) {
    return <CategoryAddPage item={item} />;
  }

  return <CategoryPage item={item} />;
}
