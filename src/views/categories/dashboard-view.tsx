import { Navigate, useParams } from "react-router-dom";
import { useEnabledCategoriesStore } from "@/stores/enabled-categories";
import { CategoryAddPage } from "./components/category-add-page";
import { CategoryPage } from "./components/category-page";
import { CATEGORIES, isCategoryId } from "./config";

export function CategoryDashboardView() {
  const { categoryId } = useParams();
  const enabledIds = useEnabledCategoriesStore((state) => state.enabledIds);

  if (!categoryId || !isCategoryId(categoryId)) {
    return <Navigate to="/" replace />;
  }

  const item = CATEGORIES.find((category) => category.id === categoryId);
  if (!item) {
    return <Navigate to="/" replace />;
  }

  if (!enabledIds.includes(categoryId)) {
    return <CategoryAddPage item={item} />;
  }

  return <CategoryPage />;
}
