import { ReactNode } from "react";

export function PageTitle({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <div className="mb-2 h-1 w-10 rounded-full bg-[#14b8a6]" />
        <h1 className="font-display text-2xl font-bold leading-tight text-[#10201f]">
          {title}
        </h1>
        <p className="mt-1.5 text-sm font-semibold text-[#647876]">{description}</p>
      </div>
      {children}
    </div>
  );
}
