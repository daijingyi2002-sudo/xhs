"use client";

import Image from "next/image";

type BrandMarkSize = "xs" | "sm" | "md" | "lg" | "xl";

export function BrandMark({
  size = "md",
  className = ""
}: {
  size?: BrandMarkSize;
  className?: string;
}) {
  return (
    <span className={`brand-mark brand-mark-${size} ${className}`} aria-hidden="true">
      <Image src="/brand-mark.png" alt="" width={96} height={96} priority sizes="96px" />
    </span>
  );
}
