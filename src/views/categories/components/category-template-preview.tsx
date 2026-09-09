import { CategoryDashboardTemplate } from "./category-dashboard-template";
import { CATEGORY_DASHBOARD_BY_ID, type CategoryItem } from "../config";

export function CategoryTemplatePreview(props: {
  item: CategoryItem;
  onBack?: () => void;
  onAdd?: () => void;
}) {
  const { item, onBack, onAdd } = props;
  const dashboard = CATEGORY_DASHBOARD_BY_ID[item.id];

  if (dashboard) {
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

  if (!item.templateSrc) return null;

  return (
    <div className="flex justify-center">
      <img src={item.templateSrc} alt="" className="max-w-full" />
    </div>
  );
}
