import { CategoryDashboardTemplate } from "./category-dashboard-template";
import {
  CATEGORY_DASHBOARD_BY_ID,
  DEFAULT_CATEGORY_DASHBOARD,
  type CategoryItem,
} from "../config";

export function CategoryTemplatePreview(props: {
  item: CategoryItem;
  onBack?: () => void;
  onAdd?: () => void;
}) {
  const { item, onBack, onAdd } = props;
  const dashboard = CATEGORY_DASHBOARD_BY_ID[item.category] ?? DEFAULT_CATEGORY_DASHBOARD;

  return (
    <CategoryDashboardTemplate
      samplePayment={dashboard.samplePayment}
      groupedPayment={dashboard.groupedPayment}
      chartHighlightLabel={dashboard.chartHighlightLabel}
      onBack={onBack}
      onAdd={onAdd}
    />
  );
}
