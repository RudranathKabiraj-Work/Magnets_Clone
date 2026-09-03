import Image from "next/image";

export default function BrandLogo({
  height = "h-9",
  width = "w-[9.45rem]",
}: {
  height?: string;
  width?: string;
}) {
  return (
    <span className={`relative inline-flex ${width} shrink-0 items-center ${height}`}>
      <Image
        alt="LeadMagnets"
        priority
        decoding="async"
        fill
        sizes="160px"
        className="object-contain object-left dark:hidden"
        src="/brand/magnets-logo-dark.png"
      />
      <Image
        alt="LeadMagnets"
        priority
        decoding="async"
        fill
        sizes="160px"
        className="hidden object-contain object-left dark:block"
        src="/brand/magnets-logo-light.png"
      />
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