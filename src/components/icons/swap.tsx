import type { IconProps } from "./types";

export const IconSwap = (props: IconProps) => {
  const {
    className,
    style,
  } = props;

  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M2.85352 0.707092V10.2071M5.35352 3.20709L2.85352 0.707092L0.353516 3.20709"
        stroke="currentColor"
      />
      <path
        d="M7.85352 10.2071V0.707092M10.3535 7.70709L7.85352 10.2071L5.35352 7.70709"
        stroke="currentColor"
      />
    </svg>
  );
};

export default IconSwap;
