import type { IconProps } from "./types";

export const IconRecords = (props: IconProps) => {
  const {
    className,
    style,
  } = props;

  return (
    <svg
      width="14"
      height="15"
      viewBox="0 0 14 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M6.8 4.30005H3.8M9.8 7.30005H3.8M9.8 10.4248H3.8M3.8 13.8H9.8C11.4569 13.8 12.8 12.4569 12.8 10.8V3.80005C12.8 2.14319 11.4569 0.800049 9.8 0.800049H3.8C2.14315 0.800049 0.799999 2.14319 0.799999 3.80005V10.8C0.799999 12.4569 2.14315 13.8 3.8 13.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconRecords;
