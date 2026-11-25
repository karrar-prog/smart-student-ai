import React, { useId } from 'react';

export default function SmartBookIcon({ className = 'w-7 h-7' }) {
  const uid = useId().replace(/:/g, '');
  const leftGradId = `bk10L_${uid}`;
  const rightGradId = `bk10R_${uid}`;

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={leftGradId}
          x1="2"
          y1="5"
          x2="12"
          y2="19"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient
          id={rightGradId}
          x1="12"
          y1="5"
          x2="22"
          y2="19"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path
        d="M2.5 6.2C2.5 5.2 3.3 4.4 4.3 4.5C7.3 4.7 9.9 5.7 11.5 7.4V19.6C9.8 18.1 7.3 17.1 4.2 16.9C3.2 16.8 2.5 16 2.5 15V6.2Z"
        fill={`url(#${leftGradId})`}
      />
      <path
        d="M21.5 6.2C21.5 5.2 20.7 4.4 19.7 4.5C16.7 4.7 14.1 5.7 12.5 7.4V19.6C14.2 18.1 16.7 17.1 19.8 16.9C20.8 16.8 21.5 16 21.5 15V6.2Z"
        fill={`url(#${rightGradId})`}
      />
    </svg>
  );
}
