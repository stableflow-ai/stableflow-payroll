import type { IconProps } from "./types";

export const IconBack = (props: IconProps) => {
  const { className, style } = props;

  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M16 9L12 14.1724L16 19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        opacity="0.1"
        x="0.5"
        y="0.5"
        width="27"
        height="27"
        rx="13.5"
        stroke="black"
      />
    </svg>
  );
};

export default IconBack;
