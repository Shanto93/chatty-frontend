"use client";

import clsx from "clsx";

interface Props {
  online: boolean;
  className?: string;
}

export default function PresenceDot({ online, className }: Props) {
  return (
    <span
      className={clsx(
        "inline-block h-2 w-2 rounded-full",
        online ? "bg-green-500" : "bg-gray-400",
        className
      )}
    />
  );
}
