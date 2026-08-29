type IconProps = {
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

function Base({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Base>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </Base>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M20 6 9 17l-5-5" />
    </Base>
  );
}

export function CircleCheckIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </Base>
  );
}

export function EarthIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" />
      <path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" />
      <path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" />
      <circle cx="12" cy="12" r="10" />
    </Base>
  );
}

export function FileTextIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </Base>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Base>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </Base>
  );
}

export function SparklesIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </Base>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <Base className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Base>
  );
}