import type { IconProps } from "./types";

export const IconUp = (props: IconProps) => {
  const { className, style } = props;

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
        d="M6.8 10.2286V0.800049M11.4154 5.57556L6.8 0.800049L2.18461 5.57556M0.799999 12.8H12.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconUp;

export const IconBatchUp = (props: IconProps) => {
  const { className, style } = props;

  return (
    <svg
      width="14"
      height="12"
      viewBox="0 0 14 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M4.11376 10.8V0.800049L0.800026 4.86955M12.8 2.26014H6.80003M12.8 6.00377H6.80003M12.8 9.62856H6.80003"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
