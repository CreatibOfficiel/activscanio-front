import { FC } from 'react';
import Skeleton from '../ui/Skeleton';

const SkeletonPodium: FC = () => {
  return (
    <div className="space-y-4">
      {/* Title skeleton */}
      <Skeleton variant="text" width={200} height={32} className="mx-auto" />

      {/* Podium cards skeleton */}
      <div className="flex flex-col md:flex-row md:justify-center md:items-end gap-4">
        {/* 2nd place */}
        <div className="flex-1 max-w-sm">
          <Skeleton variant="rounded" height={140} />
        </div>

        {/* 1st place */}
        <div className="flex-1 max-w-sm">
          <Skeleton variant="rounded" height={180} />
        </div>

        {/* 3rd place */}
        <div className="flex-1 max-w-sm">
          <Skeleton variant="rounded" height={120} />
        </div>
      </div>
    </div>
  );
};

export default SkeletonPodium;
