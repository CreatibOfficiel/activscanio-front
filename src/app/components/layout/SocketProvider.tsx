'use client';

import { useUser } from '@clerk/nextjs';
import SocketWrapper from './SocketWrapper';

export default function SocketProvider() {
  const { user, isLoaded } = useUser();

  // Only connect WebSocket when user is loaded and authenticated
  if (!isLoaded || !user) {
    return null;
  }

  return <SocketWrapper userId={user.id} />;
}
