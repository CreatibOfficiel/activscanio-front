'use client';

import { FC, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useUser, useClerk } from '@clerk/nextjs';
import { toast } from 'sonner';
import { UserStats, UserAchievement, StreakWarningStatus } from '../models/Achievement';
import { AchievementsRepository } from '../repositories/AchievementsRepository';
import { UsersRepository } from '../repositories/UsersRepository';
import { CompetitorsRepository } from '../repositories/CompetitorsRepository';
import type { Competitor } from '../models/Competitor';
import { PersonalBestsSection, ConsecutiveSeasonsSection } from '../components/profile';
import {
  ProfileHeader,
  ProfileTabs,
  ProfileTab,
  OverviewTab,
  StatsTab,
  AchievementsTab,
  RacesTab,
  PingpongTab,
  CharacterSelectModal,
} from '../components/profile';
import { StreakWarningBanner } from '../components/achievements';
import { formatCompetitorName } from '../utils/formatters';
import { AppContext } from '../context/AppContext';
import { computeRanksWithTies } from '../utils/rankings';
import { useSportPreference } from '../hooks/useSportPreference';
import { usePingpongLeaderboard } from '../hooks/usePingpongLeaderboard';
import { useCurrentUserData, useSetCachedUserData } from '../hooks/useCurrentUserData';

// Type for competitor stats used in profile
export interface CompetitorStats {
  conservativeScore: number;
  raceCount: number;
  avgRank12: number;
  totalWins: number;
  winStreak: number;
  bestWinStreak: number;
  playStreak: number;
  bestPlayStreak: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ProfilePage: FC = () => {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const { openUserProfile } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allCompetitors } = useContext(AppContext);
  const { showsPingpong } = useSportPreference();
  // The board is public and already cached by the ping-pong screens; the tab
  // below fetches this player's own record separately for its detailed stats.
  const { players: pingpongPlayers } = usePingpongLeaderboard();

  // Get initial tab from URL query param
  const getInitialTab = (): ProfileTab => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'stats' || tabParam === 'achievements' || tabParam === 'races') {
      return tabParam;
    }
    // Accepted here so the tab is reachable by link; the render branch below
    // still requires a competitor id before mounting anything.
    if (tabParam === 'ping-pong') {
      return tabParam;
    }
    return 'overview';
  };

  const [stats, setStats] = useState<UserStats | null>(null);
  // Shared with every other `/users/me` reader (OnboardingGuard,
  // useSportPreference, EditCompetitorButton...). This page used to fetch its
  // own copy alongside `useSportPreference`, which is what produced two
  // identical `/users/me` requests ~12ms apart on every cold load of /profile.
  const { userData, loading: userLoading } = useCurrentUserData();
  const setUserData = useSetCachedUserData();
  const [competitorStats, setCompetitorStats] = useState<CompetitorStats | null>(null);
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<UserAchievement[]>([]);
  const [streakWarnings, setStreakWarnings] = useState<StreakWarningStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>(getInitialTab);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);

  // Compute competitor rank from live leaderboard data
  const competitorRank = useMemo(() => {
    if (!userData?.competitorId || allCompetitors.length === 0) return undefined;
    const confirmed = allCompetitors
      .filter((c) => c.raceCount && c.raceCount > 0 && !c.provisional && !c.inactive)
      .sort((a, b) => Math.round(b.conservativeScore ?? 0) - Math.round(a.conservativeScore ?? 0));
    const ranks = computeRanksWithTies(
      confirmed,
      (c) => Math.round(c.conservativeScore ?? 0),
      (c) => c.id,
    );
    return ranks.get(userData.competitorId);
  }, [userData?.competitorId, allCompetitors]);

  // Ping-pong rank, read straight off the board rather than recomputed.
  //
  // The API decides who is ranked and hands back a `rank`, withholding it
  // (null) while a player calibrates — `PingpongTab` reads it the same way.
  // Deriving a rank here from `conservativeScore` would give two sources of
  // truth for one number, and they would disagree the first time a threshold
  // moved on the API side.
  //
  // Gated on `showsPingpong` so the pill follows the sport preference, like
  // the ping-pong tab does.
  const myPingpongPlayer = useMemo(() => {
    if (!showsPingpong || !userData?.competitorId) return null;
    return (
      pingpongPlayers.find((p) => p.competitorId === userData.competitorId) ??
      null
    );
  }, [showsPingpong, userData?.competitorId, pingpongPlayers]);

  // The API withholds a rank while a player calibrates, and the header pill
  // hides itself on undefined — so null and "still calibrating" collapse to
  // the same absent badge here, which is what both mean to a reader.
  const pingpongRank = myPingpongPlayer?.rank ?? undefined;

  // Fetch user stats, achievements, and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          throw new Error('Non authentifié');
        }

        setAuthToken(token);

        // `/users/me` is no longer fetched here — `useCurrentUserData` owns it
        // and shares one request across the whole tree.
        const [statsData, achievementsData] = await Promise.all([
          AchievementsRepository.getMyStats(token),
          AchievementsRepository.getMyAchievements(token),
        ]);

        setStats(statsData);
        setRecentAchievements(achievementsData.slice(0, 6));

        // Fetch streak warnings (non-blocking)
        AchievementsRepository.getStreakWarnings(token)
          .then(setStreakWarnings)
          .catch((err) => console.warn('Could not fetch streak warnings:', err));
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Impossible de charger votre profil');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  // Competitor stats, once the shared user record identifies a linked player.
  // Split out of the effect above because `userData` now arrives from a shared
  // query that may already be warm, so this must react to it rather than to
  // the one-shot fetch that used to produce it.
  const linkedCompetitorId =
    userData?.role === 'player' ? userData.competitorId : undefined;

  useEffect(() => {
    if (!linkedCompetitorId) return;

    let cancelled = false;

    (async () => {
      try {
        const competitorsRepo = new CompetitorsRepository(API_BASE_URL);
        const fetched = await competitorsRepo.fetchCompetitorById(linkedCompetitorId);
        if (cancelled) return;

        // Kept whole as well: PersonalBestsSection reads recentPositions
        // and lifetimeAvgRank, neither of which survives the reduction
        // to CompetitorStats below.
        setCompetitor(fetched);
        setCompetitorStats({
          conservativeScore: fetched.conservativeScore ?? Math.round(fetched.rating - 2 * fetched.rd),
          raceCount: fetched.raceCount || 0,
          avgRank12: fetched.avgRank12 || 0,
          totalWins: fetched.totalWins || 0,
          winStreak: fetched.winStreak || 0,
          bestWinStreak: fetched.bestWinStreak || 0,
          playStreak: fetched.playStreak ?? 0,
          bestPlayStreak: fetched.bestPlayStreak ?? 0,
        });
      } catch (competitorErr) {
        // Non-blocking: competitor stats are optional
        console.warn('Could not fetch competitor stats:', competitorErr);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [linkedCompetitorId]);

  // Build character info from user data
  const getCharacterInfo = () => {
    if (!userData?.competitor?.characterVariant) {
      return null;
    }

    const variant = userData.competitor.characterVariant;
    // Use variant imageUrl, fallback to baseCharacter imageUrl, then first variant imageUrl
    const firstVariantImage = variant.baseCharacter.variants?.find(v => v.imageUrl)?.imageUrl;
    const imageUrl = variant.imageUrl || variant.baseCharacter.imageUrl || firstVariantImage;
    return {
      name: variant.baseCharacter.name,
      variantLabel: variant.label !== 'Default' ? variant.label : undefined,
      imageUrl,
      variantId: variant.id,
    };
  };

  // Handle character change
  const handleChangeCharacter = useCallback(async (variantId: string) => {
    const token = await getToken();
    if (!token) {
      throw new Error('Non authentifié');
    }

    try {
      const updatedUser = await UsersRepository.changeCharacter(variantId, token);
      setUserData(updatedUser);
      toast.success('Personnage changé avec succès !');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du changement';
      toast.error(message);
      throw error;
    }
  }, [getToken, setUserData]);

  // Get user display name
  const getUserName = () => {
    if (userData?.competitor) {
      return formatCompetitorName(userData.competitor.firstName, userData.competitor.lastName);
    }
    if (userData) {
      return formatCompetitorName(userData.firstName, userData.lastName);
    }
    if (clerkUser) {
      return clerkUser.fullName || clerkUser.firstName || 'Utilisateur';
    }
    return 'Utilisateur';
  };

  // Also gates on the shared user query: the header renders the name and
  // character straight off `userData`, so showing the page before it lands
  // would flash a placeholder identity.
  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-neutral-400">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-neutral-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-lg bg-error-500/10 border border-error-500 text-error-400">
            {error || 'Une erreur est survenue'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header with Settings Link */}
        <div className="flex items-center justify-between">
          {/* Invisible spacer to balance the settings icon */}
          <div className="w-8 h-8" aria-hidden="true" />
          <h1 className="text-center text-title">Profil</h1>
          <Link
            href="/profile/settings"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
            aria-label="Paramètres"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </Link>
        </div>

        {/* Profile Header */}
        <ProfileHeader
          stats={stats}
          userName={getUserName()}
          userImageUrl={clerkUser?.imageUrl}
          character={getCharacterInfo()}
          competitorStats={competitorStats}
          competitorRank={competitorRank}
          pingpongRank={pingpongRank}
          streakWarnings={streakWarnings ?? undefined}
          onEditCharacter={userData?.role === 'player' ? () => setIsCharacterModalOpen(true) : undefined}
          onEditName={
            userData?.role === 'player' && userData.competitorId
              ? () => router.push(`/competitors/edit/${userData.competitorId}`)
              : () => openUserProfile()
          }
          onEditAvatar={
            userData?.role !== 'player'
              ? async () => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/jpeg,image/png,image/webp';
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file || !clerkUser) return;
                    try {
                      await clerkUser.setProfileImage({ file });
                      toast.success('Photo de profil mise à jour !');
                    } catch (err) {
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : 'Erreur lors du changement de photo',
                      );
                    }
                  };
                  input.click();
                }
              : undefined
          }
        />

        {/* Streak Warning Banners */}
        {streakWarnings && <StreakWarningBanner warnings={streakWarnings} />}

        {/* Character Selection Modal */}
        {authToken && (
          <CharacterSelectModal
            isOpen={isCharacterModalOpen}
            onClose={() => setIsCharacterModalOpen(false)}
            onSelect={handleChangeCharacter}
            currentVariantId={getCharacterInfo()?.variantId}
            authToken={authToken}
          />
        )}

        {/* Tab Navigation */}
        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showRacesTab={userData?.role === 'player'}
          showPingpongTab={showsPingpong && Boolean(userData?.competitorId)}
        />

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              pingpongPlayer={myPingpongPlayer}
              recentAchievements={recentAchievements}
              competitorStats={competitorStats}
            />
          )}
          {activeTab === 'stats' && (
            // `space-y-6` rather than a bare fragment: the two children are
            // siblings with no margins of their own, so a fragment butted
            // "Mes records" straight up against the cards below it. The gap
            // matches the rhythm StatsTab already uses between its own
            // sections, so the whole tab scrolls at one spacing.
            <div className="space-y-6">
              <PersonalBestsSection
                competitor={competitor}
                stats={competitorStats}
              />
              <StatsTab stats={stats} competitorStats={competitorStats} />
              <ConsecutiveSeasonsSection
                competitorId={userData?.competitorId}
                showsPingpong={showsPingpong}
              />
            </div>
          )}
          {activeTab === 'achievements' && (
            <AchievementsTab
              stats={stats}
              getToken={getToken}
            />
          )}
          {activeTab === 'races' && userData?.competitorId && (
            <RacesTab
              competitorId={userData.competitorId}
              getToken={getToken}
            />
          )}
          {activeTab === 'ping-pong' && userData?.competitorId && (
            <PingpongTab competitorId={userData.competitorId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
