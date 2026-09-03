import type { IconProps } from "./types";

export const IconPayroll = (props: IconProps) => {
  const {
    className,
    style,
  } = props;

  return (
    <svg
      width="14"
      height="13"
      viewBox="0 0 13.6 12.6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <rect
        x="0.8"
        y="6.8"
        width="12"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.8 3.8H10.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.8 0.8H8.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconPayroll;
