import React from "react";

interface DirhamIconProps {
  className?: string;
  size?: number | string;
  strokeWidth?: number | string;
}

const DirhamIcon = ({
  className,
  size = 24,
  strokeWidth = 2.5,
}: DirhamIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M7 4H12C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20H7V4Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 10H16"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M4 14H16"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

export default DirhamIcon;
