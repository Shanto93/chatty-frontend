"use client";

interface Props {
  src?: string;
  alt?: string;
  size?: "sm" | "md";
}

export default function Avatar({ src, alt = "Avatar", size = "md" }: Props) {
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-300 text-xs text-gray-700 ${dim}`}
      >
        ?
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`rounded-full ${dim}`} />;
}
