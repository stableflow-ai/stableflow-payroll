import type { IconProps } from "./types";

export const IconDuration = (props: IconProps) => {
  const {
    className,
    style,
  } = props;

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M8.8 12.4586C8.17444 12.6797 7.50127 12.8 6.8 12.8C3.48629 12.8 0.799999 10.1138 0.799999 6.80005C0.799999 3.48634 3.48629 0.800049 6.8 0.800049C10.1137 0.800049 12.8 3.48634 12.8 6.80005C12.8 7.42643 12.704 8.03039 12.526 8.59802M6.8 3.80005V7.30005H4.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconDuration;
