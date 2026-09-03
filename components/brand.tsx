import Image from "next/image";

export default function BrandLogo({
  height = "h-8",
  width,
  className = "",
}: {
  height?: string;
  width?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-2.5 ${height} ${width || ""} ${className}`}>
      <span className="relative h-full aspect-square shrink-0">
        <Image
          alt="LeadMagnets"
          priority
          decoding="async"
          fill
          sizes="60px"
          className="object-contain dark:hidden"
          src="/brand/magnets-mark-dark.png"
        />
        <Image
          alt="LeadMagnets"
          priority
          decoding="async"
          fill
          sizes="60px"
          className="hidden object-contain dark:block"
          src="/brand/magnets-mark.png"
        />
      </span>
      <span className="font-bold text-xl tracking-tight text-ink-950 dark:text-white select-none leading-none">
        Lead<span className="font-medium text-ink-700 dark:text-ink-200">Magnets</span>
      </span>
    </span>
  );
}

export function MagnetsMark({ size = "h-12 w-12" }: { size?: string }) {
  return (
    <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center ${size}`}>
      <Image
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        fill
        sizes="100px"
        className="object-contain"
        src="/brand/magnets-mark.png"
      />
    </span>
  );
}