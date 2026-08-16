import { ReactNode } from "react";

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-[#d8e8e5] bg-white/78 p-4 shadow-[0_14px_34px_rgba(20,83,78,0.06)] backdrop-blur-xl">
      <h2 className="font-display mb-3 text-lg font-bold text-[#10201f]">{title}</h2>
      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}
