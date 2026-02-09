'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { UserStats, UserAchievement } from '../models/Achievement';
import { AchievementsRepository } from '../repositories/AchievementsRepository';
import { UsersRepository, UserData } from '../repositories/UsersRepository';
import { CompetitorsRepository } from '../repositories/CompetitorsRepository';
import {
  ProfileHeader,
  ProfileTabs,
  ProfileTab,
  OverviewTab,
  StatsTab,
  AchievementsTab,
  RacesTab,
  CharacterSelectModal,
} from '../components/profile';
import { formatCompetitorName } from '../utils/formatters';

// Type for competitor stats used in profile
export interface CompetitorStats {
  rating: number;
  raceCount: number;
  avgRank12: number;
  rd: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ProfilePage: FC = () => {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const searchParams = useSearchParams();

  // Get initial tab from URL query param
  const getInitialTab = (): ProfileTab => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'stats' || tabParam === 'achievements' || tabParam === 'races') {
      return tabParam;
    }
    return 'overview';
  };

  const [stats, setStats] = useState<UserStats | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [competitorStats, setCompetitorStats] = useState<CompetitorStats | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>(getInitialTab);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);

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

        // Fetch stats, achievements, and user data in parallel
        const [statsData, achievementsData, userDataResult] = await Promise.all([
          AchievementsRepository.getMyStats(token),
          AchievementsRepository.getMyAchievements(token),
          UsersRepository.getMe(token),
        ]);

        setStats(statsData);
        setRecentAchievements(achievementsData.slice(0, 6));
        setUserData(userDataResult);

        // If user is a player with a linked competitor, fetch competitor stats
        if (userDataResult.competitorId && userDataResult.role === 'player') {
          try {
            const competitorsRepo = new CompetitorsRepository(API_BASE_URL);
            const competitor = await competitorsRepo.fetchCompetitorById(userDataResult.competitorId);
            setCompetitorStats({
              rating: competitor.rating,
              raceCount: competitor.raceCount || 0,
              avgRank12: competitor.avgRank12 || 0,
              rd: competitor.rd,
            });
          } catch (competitorErr) {
            console.warn('Could not fetch competitor stats:', competitorErr);
            // Non-blocking: competitor stats are optional
          }
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Impossible de charger votre profil');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

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
    if (!authToken) {
      throw new Error('Non authentifié');
    }

    try {
      const updatedUser = await UsersRepository.changeCharacter(variantId, authToken);
      setUserData(updatedUser);
      toast.success('Personnage changé avec succès !');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du changement';
      toast.error(message);
      throw error;
    }
  }, [authToken]);

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

  if (loading) {
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
          onEditCharacter={userData?.role === 'player' ? () => setIsCharacterModalOpen(true) : undefined}
        />

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
        />

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              recentAchievements={recentAchievements}
              competitorStats={competitorStats}
            />
          )}
          {activeTab === 'stats' && (
            <StatsTab
              stats={stats}
              authToken={authToken || undefined}
            />
          )}
          {activeTab === 'achievements' && (
            <AchievementsTab
              stats={stats}
              authToken={authToken || undefined}
            />
          )}
          {activeTab === 'races' && userData?.competitorId && (
            <RacesTab
              competitorId={userData.competitorId}
              authToken={authToken || undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
