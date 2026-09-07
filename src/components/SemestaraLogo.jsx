import React from 'react';

export default function SemestaraLogo({ size = 32, className = '', glow = true, idPrefix = 'slogo' }) {
  const gradId = `${idPrefix}-grad`;
  const glowId = `${idPrefix}-glow`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id={gradId} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#00FFF5" />
          <stop offset="50%" stopColor="#00ADB5" />
          <stop offset="100%" stopColor="#007f87" />
        </linearGradient>

        <linearGradient id={`${gradId}-light`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#00FFF5" />
          <stop offset="100%" stopColor="#00ADB5" />
        </linearGradient>

        {glow && (
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Orbit Ring Background Arc */}
      <ellipse
        cx="50"
        cy="50"
        rx="38"
        ry="19"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="145 35"
        transform="rotate(-32 50 50)"
        opacity="0.85"
      />

      {/* Top Half of 'S' Flow */}
      <path
        d="M 68 33 C 68 21, 58 14, 46 14 C 33 14, 25 23, 25 35 C 25 48, 38 52, 50 55"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Bottom Half of 'S' Flow */}
      <path
        d="M 50 55 C 62 58, 75 62, 75 75 C 75 87, 67 96, 54 96 C 42 96, 32 89, 32 77"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Inner Cosmic Arcs */}
      <path
        d="M 44 25 A 13 13 0 0 0 35 38"
        fill="none"
        stroke="#00FFF5"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M 56 85 A 13 13 0 0 0 65 72"
        fill="none"
        stroke="#00ADB5"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Radiant Central Polaris Star */}
      <path
        d="M 50 37 Q 50 50 63 50 Q 50 50 50 63 Q 50 50 37 50 Q 50 50 50 37 Z"
        fill="#00FFF5"
        filter={glow ? `url(#${glowId})` : undefined}
      />

      {/* Core Center White Gleam */}
      <path
        d="M 50 43 Q 50 50 57 50 Q 50 50 50 57 Q 50 50 43 50 Q 50 50 50 43 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
