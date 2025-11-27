"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "sm" | "md";
}

export default function Button({ children, size = "md", className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={clsx(
        "rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm",
        className
      )}
    >
      {children}
    </button>
  );
}
