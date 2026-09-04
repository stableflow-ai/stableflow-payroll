import type { IconProps } from "./types";

export const IconSuccess = (props: IconProps) => {
  const { className, style } = props;

  return (
    <svg
      width="54"
      height="54"
      viewBox="0 0 54 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <circle opacity="0.2" cx="27" cy="27" r="27" fill="currentColor" />
      <circle cx="27" cy="27" r="22.8462" fill="currentColor" />
      <path
        d="M26.322 35.3116C25.9215 35.7646 25.3969 35.9911 24.8722 35.9911C24.3474 35.9911 23.8227 35.7646 23.4223 35.3116L16.5867 27.5811C16.1648 27.1041 15.9791 26.473 16.0019 25.8493C16.022 25.2876 16.2075 24.7306 16.5867 24.3019C16.9658 23.8728 17.4583 23.663 17.955 23.6403C18.5065 23.6148 19.0646 23.8245 19.4863 24.3019L24.8722 30.3925L34.3594 19.6635C34.7811 19.1863 35.3393 18.9764 35.8907 19.0021C36.3874 19.0249 36.88 19.2347 37.259 19.6635C37.6383 20.0922 37.8238 20.6495 37.8439 21.211C37.8665 21.8346 37.6809 22.4658 37.259 22.9429L26.322 35.3116Z"
        fill="white"
      />
    </svg>
  );
};

export default IconSuccess;
