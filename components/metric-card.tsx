export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[#d8e8e5] bg-white/78 p-4 shadow-[0_14px_34px_rgba(20,83,78,0.06)] backdrop-blur-xl">
      <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-[48px] bg-[#e9fbf7]" />
      <div className="relative text-xs font-extrabold uppercase tracking-wide text-[#0f766e]">
        {label}
      </div>
      <div className="relative font-display mt-2.5 text-2xl font-bold leading-none text-[#10201f]">
        {value}
      </div>
      <div className="relative mt-3 text-xs font-semibold text-[#647876]">{helper}</div>
    </div>
  );
}
