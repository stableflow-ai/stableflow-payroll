import type { IconProps } from "./types";

export const IconPayoutPending = (props: IconProps) => {
  const { className, style } = props;

  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <circle opacity="0.2" cx="13" cy="13" r="13" fill="currentColor" />
      <path
        d="M17.875 13C17.875 10.3076 15.6924 8.125 13 8.125C10.3076 8.125 8.125 10.3076 8.125 13C8.125 15.6924 10.3076 17.875 13 17.875"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const IconPayoutFailed = (props: IconProps) => {
  const { className, style } = props;

  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <circle opacity="0.2" cx="13" cy="13" r="13" fill="currentColor" />
      <path
        d="M13 16.3555C12.569 16.3555 12.1557 16.5211 11.851 16.816C11.5462 17.1108 11.375 17.5107 11.375 17.9277C11.375 18.3447 11.5462 18.7446 11.851 19.0395C12.1557 19.3343 12.569 19.5 13 19.5C13.431 19.5 13.8443 19.3343 14.149 19.0395C14.4538 18.7446 14.625 18.3447 14.625 17.9277C14.625 17.5107 14.4538 17.1108 14.149 16.816C13.8443 16.5211 13.431 16.3555 13 16.3555ZM13 7.31392C12.1019 7.31392 11.375 8.01726 11.375 8.88618L11.375 13.211C11.375 13.6279 11.5462 14.0279 11.851 14.3227C12.1557 14.6176 12.569 14.7832 13 14.7832C13.431 14.7832 13.8443 14.6176 14.149 14.3227C14.4538 14.0279 14.625 13.6279 14.625 13.211V8.88476C14.625 8.01584 13.8981 7.3125 13.0015 7.3125L13 7.31392Z"
        fill="currentColor"
      />
    </svg>
  );
};

export const IconPayoutPaid = (props: IconProps) => {
  const { className, style } = props;

  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        opacity="0.2"
        d="M13 0C5.84999 0 2.91488e-08 5.84999 0 13C0 20.15 5.84999 26 13 26C20.15 26 26 20.15 26 13C26 5.84999 20.15 0 13 0Z"
        fill="currentColor"
      />
      <path
        d="M12.6425 17.4851C12.4041 17.7451 12.0919 17.875 11.7797 17.875C11.4674 17.875 11.1551 17.7451 10.9169 17.4851L6.84911 13.0491C6.59805 12.7754 6.48757 12.4133 6.50111 12.0553C6.51306 11.733 6.62348 11.4134 6.84911 11.1674C7.07471 10.9212 7.36782 10.8008 7.6634 10.7877C7.99157 10.7731 8.32367 10.8935 8.57467 11.1674L11.7797 14.6624L17.4253 8.50572C17.6763 8.23193 18.0085 8.11144 18.3366 8.12621C18.6322 8.13932 18.9253 8.25966 19.1509 8.50572C19.3766 8.75174 19.4869 9.07153 19.4989 9.39372C19.5124 9.75159 19.402 10.1138 19.1509 10.3875L12.6425 17.4851Z"
        fill="currentColor"
      />
    </svg>
  );
};
