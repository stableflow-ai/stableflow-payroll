import type { IconProps } from "./types";

export const Icon2Right = (props: IconProps) => {
  const {
    className,
    style,
  } = props;

  return (
    <svg
      width="13"
      height="9"
      viewBox="0 0 13 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M0.5 4.5H12M8 8.5L12 4.5L8 0.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Icon2Right;
