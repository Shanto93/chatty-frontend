"use client";

import type { TextareaHTMLAttributes } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export default function Textarea(props: Props) {
  return (
    <textarea
      {...props}
      className="w-full resize-none rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
    />
  );
}
