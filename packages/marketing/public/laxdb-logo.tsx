import type { SVGProps } from "react";

export function LaxDBLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Lacrosse stick head with database stripes */}
      <g>
        {/* Stick head outline */}
        <path
          d="M6 8C6 5.79086 7.79086 4 10 4H18C20.2091 4 22 5.79086 22 8V20C22 24.4183 18.4183 28 14 28C9.58172 28 6 24.4183 6 20V8Z"
          stroke="#0f172a"
          strokeWidth="2"
          fill="none"
        />
        {/* Database stripes inside */}
        <line x1="8" y1="10" x2="20" y2="10" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="8" y1="15" x2="20" y2="15" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="9" y1="20" x2="19" y2="20" stroke="#0f172a" strokeWidth="1.5" />
        {/* Handle hint */}
        <line
          x1="14"
          y1="28"
          x2="14"
          y2="32"
          stroke="#0f172a"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      {/* Text */}
      <text
        x="30"
        y="22"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill="#0f172a"
        letterSpacing="-0.02em"
      >
        LaxDB
      </text>
    </svg>
  );
}

export function LaxDBMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Lacrosse stick head with database stripes */}
      <path
        d="M2 8C2 4.68629 4.68629 2 8 2H20C23.3137 2 26 4.68629 26 8V22C26 29.1797 20.1797 35 14 35C7.82029 35 2 29.1797 2 22V8Z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Database stripes */}
      <line x1="5" y1="11" x2="23" y2="11" stroke="currentColor" strokeWidth="2" />
      <line x1="5" y1="18" x2="23" y2="18" stroke="currentColor" strokeWidth="2" />
      <line x1="6" y1="25" x2="22" y2="25" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
