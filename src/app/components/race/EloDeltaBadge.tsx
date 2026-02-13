import { FC } from "react";

interface EloDeltaBadgeProps {
  delta: number | null | undefined;
  size?: "sm" | "md";
}

const EloDeltaBadge: FC<EloDeltaBadgeProps> = ({ delta, size = "sm" }) => {
  if (delta == null) return null;

  const isPositive = delta >= 0;
  const arrow = isPositive ? "\u25B2" : "\u25BC";
  const sign = isPositive ? "+" : "";
  const colorClasses = isPositive
    ? "bg-success-500/10 text-success-400"
    : "bg-error-500/10 text-error-400";
  const sizeClasses = size === "md" ? "px-2.5 py-0.5 text-sm" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full tabular-nums font-medium ${colorClasses} ${sizeClasses}`}
    >
      {arrow} {sign}{delta.toFixed(1)}
    </span>
  );
};

export default EloDeltaBadge;
