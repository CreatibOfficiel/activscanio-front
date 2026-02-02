"use client";

import { FC, useEffect, useState } from "react";

interface Props {
  duration: number; // in milliseconds
  onComplete?: () => void;
  className?: string;
}

const TVProgressBar: FC<Props> = ({ duration, onComplete, className = "" }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const percent = (remaining / duration) * 100;

      setProgress(percent);

      if (percent > 0) {
        requestAnimationFrame(updateProgress);
      } else {
        onComplete?.();
      }
    };

    const frameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(frameId);
  }, [duration, onComplete]);

  return (
    <div
      className={`h-1.5 bg-neutral-700/50 rounded-full overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-none"
        style={{
          width: `${progress}%`,
          transition: "width 100ms linear",
        }}
      />
    </div>
  );
};

export default TVProgressBar;
