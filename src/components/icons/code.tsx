import type { IconProps } from "./types";

export const IconCode = (props: IconProps) => {
  const {
    className,
    style,
  } = props;

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M8.3 4.2998L7.3 11.0874M10.8 5.21619L12.2434 8.00812L10.8 10.8001M4.8 4.94515L3.3 7.84661L4.8 10.7481M3.8 14.7998H11.8C13.4569 14.7998 14.8 13.4567 14.8 11.7998V3.7998C14.8 2.14295 13.4569 0.799805 11.8 0.799805H3.8C2.14315 0.799805 0.799999 2.14295 0.8 3.7998L0.8 11.7998C0.8 13.4567 2.14315 14.7998 3.8 14.7998Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconCode;
