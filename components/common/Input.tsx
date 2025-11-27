"use client";

import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  small?: boolean;
}

export default function Input({ label, small, className, ...rest }: Props) {
  return (
    <label className={clsx("flex flex-1 flex-col text-sm", small && "text-xs")}>
      {label && <span className="mb-1 text-gray-700">{label}</span>}
      <input
        {...rest}
        className={clsx(
          "rounded border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none",
          className
        )}
      />
    </label>
  );
}
