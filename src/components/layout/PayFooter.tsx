import { Link } from "react-router-dom";
import { DOCS_PATH, STABLEFLOW_ABOUT_URL } from "./config";

export function PayFooter() {
  return (
    <footer className="shrink-0 border-t border-[#E3E3E3] bg-[#f6f6f6] pb-[max(0px,env(safe-area-inset-bottom))]">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 font-montserrat text-[10px] font-normal leading-normal text-[#606060] md:px-5 lg:h-8 lg:px-[26px]">
        <p>
          Powered by{" "}
          <a
            href={STABLEFLOW_ABOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium"
          >
            StableFlow
          </a>
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link to={DOCS_PATH}>Docs</Link>
          <span>Terms of Use</span>
          <span>Privacy Policy</span>
        </nav>
      </div>
    </footer>
  );
}
