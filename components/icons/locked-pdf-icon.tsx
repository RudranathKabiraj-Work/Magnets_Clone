import React from "react";

export default function LockedPdfIcon({
  className = "h-4 w-4",
  ...props
}: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* PDF Red Gradient */}
        <linearGradient id="pdfBadgeGrad" x1="2" y1="2" x2="16" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF416C" />
          <stop offset="1" stopColor="#FF4B2B" />
        </linearGradient>

        {/* Lock Shield Blue Gradient */}
        <linearGradient id="lockShieldGrad" x1="11" y1="11" x2="21" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0052D4" />
          <stop offset="0.5" stopColor="#4364F7" />
          <stop offset="1" stopColor="#6FB1FC" />
        </linearGradient>
      </defs>

      {/* PDF Document Base */}
      <path
        d="M4 4C4 2.89543 4.89543 2 6 2H12.5858C13.1162 2 13.6249 2.21071 14 2.58579L17.4142 6C17.7893 6.3751 18 6.88378 18 7.41421V11.5C18 11.7761 17.7761 12 17.5 12C17.2239 12 17 11.7761 17 11.5V7.5H13C12.4477 7.5 12 7.05228 12 6.5V2.5H6C5.17157 2.5 4.5 3.17157 4.5 4V20C4.5 20.8284 5.17157 21.5 6 21.5H10.5C10.7761 21.5 11 21.7239 11 22C11 22.2761 10.7761 22.5 10.5 22.5H6C4.89543 22.5 4 21.6046 4 20.5V4Z"
        fill="url(#pdfBadgeGrad)"
      />

      {/* Folded Corner */}
      <path
        d="M13 2.8L17.2 7H13.5C13.2239 7 13 6.77614 13 6.5V2.8Z"
        fill="#FF4B2B"
        opacity="0.7"
      />

      {/* PDF Text/Lines inside paper */}
      <rect x="7" y="6" width="3.5" height="1.5" rx="0.5" fill="white" opacity="0.9" />
      <rect x="7" y="9.5" width="7" height="1.2" rx="0.6" fill="white" opacity="0.7" />
      <rect x="7" y="12.5" width="4.5" height="1.2" rx="0.6" fill="white" opacity="0.7" />

      {/* Lock Shield Badge */}
      <rect
        x="11.5"
        y="11.5"
        width="10.5"
        height="11"
        rx="2.5"
        fill="url(#lockShieldGrad)"
        stroke="#FFFFFF"
        strokeWidth="1.2"
      />

      {/* Lock Shackle */}
      <path
        d="M14.2 13.5V12.2C14.2 10.8745 15.2745 9.8 16.6 9.8C17.9255 9.8 19 10.8745 19 12.2V13.5"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Keyhole Dot */}
      <circle cx="16.6" cy="16.8" r="1.1" fill="white" />
      <path d="M16.6 17.5V19.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
