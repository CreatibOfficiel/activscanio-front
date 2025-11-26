import { FC } from 'react';
import Skeleton from '../ui/Skeleton';

const SkeletonCompetitorItem: FC = () => {
  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
      <div className="flex items-center gap-4">
        {/* Avatar skeleton */}
        <Skeleton variant="circular" width={48} height={48} />

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </div>

        {/* Stats skeleton */}
        <div className="text-right space-y-2">
          <Skeleton variant="text" width={60} height={20} />
          <Skeleton variant="text" width={80} height={16} />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCompetitorItem;
