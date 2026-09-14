import type { NavigateFunction } from "react-router-dom";

export const HISTORY_TAB_ANCHOR_ID = "history-tab";

export function scrollHistoryTabIntoView() {
  document.getElementById(HISTORY_TAB_ANCHOR_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function openHistoryTab(navigate: NavigateFunction, path: string) {
  navigate(path);
  requestAnimationFrame(() => scrollHistoryTabIntoView());
}
