"use client";

import { FC, useEffect, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Spinner } from '@/app/components/ui';
import { MdSportsMma } from 'react-icons/md';
import { DuelRepository } from '@/app/repositories/DuelRepository';
import { DuelBalance } from '@/app/models/Duel';
import BalancesBoard from '@/app/components/duel/BalancesBoard';
import MyDuelsSection from '@/app/components/duel/MyDuelsSection';
import DuelFeedSection from '@/app/components/duel/DuelFeedSection';

const DEFAULT_TAB: 'mine' | 'feed' = 'mine';

const DefisPage: FC = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [tab, setTab] = useState<'mine' | 'feed'>(DEFAULT_TAB);
  const [balances, setBalances] = useState<DuelBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBalances = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const token = await getToken();
      if (!token) return;
      const data = await DuelRepository.getBalances(token);
      setBalances(data);
    } catch (err) {
      console.error('Error loading balances:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <MdSportsMma className="text-primary-400" size={26} />
          <h1 className="text-heading text-white">Défis</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : (
          <>
            {/* Splitwise-style debts board */}
            {user && <BalancesBoard balances={balances} />}

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setTab('mine')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  tab === 'mine'
                    ? 'bg-primary-500 text-neutral-900'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Mes défis
              </button>
              <button
                onClick={() => setTab('feed')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  tab === 'feed'
                    ? 'bg-primary-500 text-neutral-900'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                Communauté
              </button>
            </div>

            {tab === 'mine' ? (
              user ? (
                <MyDuelsSection currentUserId={user.id} />
              ) : (
                <p className="text-center text-neutral-500 py-8 text-regular">
                  Connecte-toi pour voir tes défis.
                </p>
              )
            ) : (
              <DuelFeedSection currentUserId={user?.id} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DefisPage;
