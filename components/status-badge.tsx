type StatusBadgeProps = {
  value?: string | boolean | null;
};

export function StatusBadge({ value }: StatusBadgeProps) {
  const label =
    typeof value === "boolean"
      ? value
        ? "ACTIVE"
        : "INACTIVE"
      : value || "N/A";
  const positive =
    value === true ||
    (typeof value === "string" && ["ACTIVE", "PUBLISHED", "ONLINE"].includes(value));
  const danger =
    value === false ||
    (typeof value === "string" && ["INACTIVE", "REVOKED", "CANCELLED"].includes(value));

  const className = positive
    ? "border-green-100 bg-green-50 text-green-700"
    : danger
      ? "border-red-100 bg-red-50 text-red-700"
      : "border-amber-100 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
