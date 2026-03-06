"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
};

const paddingMap: Record<NonNullable<Props["padding"]>, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function GlassPanel({
  children,
  className = "",
  padding = "md",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
