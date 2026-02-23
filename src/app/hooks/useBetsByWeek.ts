'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Bet, BetStatus } from '@/app/models/Bet';
import { BettingWeek } from '@/app/models/BettingWeek';
import { BettingRepository, PaginationMeta } from '@/app/repositories/BettingRepository';

const BETS_PER_PAGE = 10;

export interface WeekGroup {
  key: string; // "2026-W08"
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  status: string; // BettingWeekStatus value from bettingWeek
  bets: Bet[];
  totalBets: number;
  totalPoints: number;
  wonCount: number;
  perfectCount: number;
}

interface UseBetsByWeekOptions {
  activeTab: 'all' | 'mine';
  activeStatus: BetStatus | null;
  userId?: string;
  getToken: () => Promise<string | null>;
}

function groupBetsByWeek(bets: Bet[]): Map<string, Bet[]> {
  const groups = new Map<string, Bet[]>();
  for (const bet of bets) {
    const week = bet.bettingWeek;
    if (!week) continue;
    const key = `${week.year}-W${String(week.weekNumber).padStart(2, '0')}`;
    const existing = groups.get(key) ?? [];
    existing.push(bet);
    groups.set(key, existing);
  }
  return groups;
}

function buildWeekGroups(betsMap: Map<string, Bet[]>): WeekGroup[] {
  const groups: WeekGroup[] = [];
  for (const [key, bets] of betsMap) {
    const week = bets[0].bettingWeek!;
    groups.push({
      key,
      weekNumber: week.weekNumber,
      year: week.year,
      startDate: week.startDate,
      endDate: week.endDate,
      status: week.status,
      bets,
      totalBets: bets.length,
      totalPoints: bets
        .filter((b) => b.isFinalized)
        .reduce((sum, b) => sum + (b.pointsEarned ?? 0), 0),
      wonCount: bets.filter((b) => b.isFinalized && (b.pointsEarned ?? 0) > 0).length,
      perfectCount: bets.filter(
        (b) => b.isFinalized && b.picks.every((p) => p.isCorrect === true)
      ).length,
    });
  }
  // Sort by date DESC (most recent first)
  groups.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.weekNumber - a.weekNumber;
  });
  return groups;
}

export function useBetsByWeek({ activeTab, activeStatus, userId, getToken }: UseBetsByWeekOptions) {
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [weekGroups, setWeekGroups] = useState<WeekGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalBets, setTotalBets] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const metaRef = useRef<PaginationMeta | null>(null);

  // Determine current week status
  const [currentWeekKey, setCurrentWeekKey] = useState<string | null>(null);
  const currentWeekDataRef = useRef<BettingWeek | null>(null);

  useEffect(() => {
    BettingRepository.getCurrentWeek().then((week) => {
      if (week) {
        setCurrentWeekKey(`${week.year}-W${String(week.weekNumber).padStart(2, '0')}`);
        currentWeekDataRef.current = week;
      }
    }).catch(() => {});
  }, []);

  const fetchBets = useCallback(async (offset: number, append: boolean) => {
    try {
      if (offset === 0) setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);

      let response;
      if (activeTab === 'all') {
        response = await BettingRepository.getCommunityBets(
          BETS_PER_PAGE,
          offset,
          undefined,
          activeStatus ?? undefined
        );
      } else {
        if (!userId) throw new Error('Utilisateur non connecté');
        const token = await getToken();
        if (!token) throw new Error('Token non disponible');
        response = await BettingRepository.getBetHistory(userId, token, BETS_PER_PAGE, offset);
      }

      const newBets = append ? [...allBets, ...response.data] : response.data;
      setAllBets(newBets);
      metaRef.current = response.meta;
      setHasMore(response.meta.hasMore);
      setTotalBets(response.meta.total);

      // Group by week
      const grouped = groupBetsByWeek(newBets);
      const groups = buildWeekGroups(grouped);

      // Inject empty current week group if not present
      const cw = currentWeekDataRef.current;
      if (cw && currentWeekKey && !groups.some((g) => g.key === currentWeekKey)) {
        groups.unshift({
          key: currentWeekKey,
          weekNumber: cw.weekNumber,
          year: cw.year,
          startDate: cw.startDate,
          endDate: cw.endDate,
          status: cw.status,
          bets: [],
          totalBets: 0,
          totalPoints: 0,
          wonCount: 0,
          perfectCount: 0,
        });
      }

      setWeekGroups(groups);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement.';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeTab, activeStatus, userId, getToken, allBets, currentWeekKey]);

  const loadMore = useCallback(() => {
    const meta = metaRef.current;
    if (!meta?.hasMore || isLoadingMore) return;
    fetchBets(meta.offset + meta.limit, true);
  }, [isLoadingMore, fetchBets]);

  // Reload on tab/filter change
  useEffect(() => {
    if (activeTab === 'mine' && !userId) {
      setError('Vous devez être connecté pour voir vos paris.');
      setIsLoading(false);
      return;
    }
    setAllBets([]);
    metaRef.current = null;
    fetchBets(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeStatus, userId]);

  // Re-group when currentWeekKey resolves (inject empty current week if needed)
  useEffect(() => {
    if (!currentWeekKey || isLoading) return;
    const grouped = groupBetsByWeek(allBets);
    const groups = buildWeekGroups(grouped);
    const cw = currentWeekDataRef.current;
    if (cw && !groups.some((g) => g.key === currentWeekKey)) {
      groups.unshift({
        key: currentWeekKey,
        weekNumber: cw.weekNumber,
        year: cw.year,
        startDate: cw.startDate,
        endDate: cw.endDate,
        status: cw.status,
        bets: [],
        totalBets: 0,
        totalPoints: 0,
        wonCount: 0,
        perfectCount: 0,
      });
    }
    setWeekGroups(groups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekKey]);

  // Stats across all loaded bets (for mine tab)
  const stats = {
    total: totalBets,
    won: allBets.filter((b) => b.isFinalized && (b.pointsEarned ?? 0) > 0).length,
    totalPoints: allBets
      .filter((b) => b.isFinalized)
      .reduce((sum, b) => sum + (b.pointsEarned ?? 0), 0),
    perfectPodiums: allBets.filter(
      (b) => b.isFinalized && b.picks.every((p) => p.isCorrect === true)
    ).length,
  };

  return {
    weekGroups,
    isLoading,
    isLoadingMore,
    hasMore,
    totalBets,
    error,
    stats,
    loadMore,
    currentWeekKey,
  };
}
