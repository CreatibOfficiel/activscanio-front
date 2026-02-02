"use client";

import { FC } from "react";
import { FaArrowUp, FaArrowDown, FaMinus } from "react-icons/fa";

export type TrendDirection = "up" | "down" | "stable";

interface Props {
  direction: TrendDirection;
  value?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

const TrendIndicator: FC<Props> = ({
  direction,
  value,
  size = "md",
  showValue = true,
}) => {
  const sizeClasses = {
    sm: "text-xs gap-0.5",
    md: "text-sm gap-1",
    lg: "text-base gap-1.5",
  };

  const iconSize = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const getConfig = (dir: TrendDirection) => {
    switch (dir) {
      case "up":
        return {
          icon: FaArrowUp,
          color: "text-success-400",
          bgColor: "bg-success-500/10",
          label: "Progression",
        };
      case "down":
        return {
          icon: FaArrowDown,
          color: "text-error-400",
          bgColor: "bg-error-500/10",
          label: "Régression",
        };
      case "stable":
        return {
          icon: FaMinus,
          color: "text-neutral-400",
          bgColor: "bg-neutral-700/30",
          label: "Stable",
        };
    }
  };

  const config = getConfig(direction);
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} ${config.color} ${config.bgColor} px-1.5 py-0.5 rounded-full`}
      title={config.label}
    >
      <Icon className={iconSize[size]} />
      {showValue && value !== undefined && value !== 0 && (
        <span className="font-medium">{Math.abs(value)}</span>
      )}
    </div>
  );
};

export default TrendIndicator;
