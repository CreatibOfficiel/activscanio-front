import { FC } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

const imageSizes = {
  sm: 32,
  md: 40,
  lg: 56,
};

const bgColors = [
  'bg-primary-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

const UserAvatar: FC<UserAvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const sizeClass = sizeClasses[size];
  const imgSize = imageSizes[size];

  if (src) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <Image
          src={src}
          alt={name}
          width={imgSize}
          height={imgSize}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  return (
    <div
      className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white ${className}`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
