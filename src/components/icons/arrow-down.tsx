import type { IconProps } from "./types";

export const IconArrowDown = (props: IconProps) => {
  const {
    className,
    style,
  } = props;

  return (
    <svg
      width="11"
      height="6"
      viewBox="0 0 11 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M0.305908 0.395508L5.47832 4.39551L10.3059 0.395508"
        stroke="currentColor"
      />
    </svg>
  );
};

export default IconArrowDown;
