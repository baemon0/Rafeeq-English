import React, { useState, useEffect, useCallback } from 'react';
import {
  AppMode,
  CloudUser,
  DailyQuizState,
  ModeCloudProfile,
  PastTranslationItem,
  ResourceType,
  TabType,
  WeeklyTracker
} from './types';
import { EMPTY_RESOURCES, hasActiveEnchantedItem } from './data/avatarCatalog';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { TranslatorTab } from './components/TranslatorTab';
import { SmartLensTab } from './components/SmartLensTab';
import { AiChatTab } from './components/AiChatTab';
import { PracticeTab } from './components/PracticeTab';
import { StoriesTab } from './components/StoriesTab';
import { ProgressTab } from './components/ProgressTab';
import { WelcomeModeScreen } from './components/WelcomeModeScreen';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AvatarShopModal } from './components/AvatarShopModal';
import { CraftingWorkshopModal } from './components/CraftingWorkshopModal';
import { MyIslandTab } from './components/MyIslandTab';
import { FriendIslandModal } from './components/FriendIslandModal';
import { DEFAULT_ISLAND_DATA } from './data/islandCatalog';
import {
  ActivityType,
  BadgeDefinition,
  INITIAL_PROGRESS,
  UserProgress,
  recordUserActivity,
  saveProgress
} from './utils/progress';
import { Award, Camera, Sparkles, X } from 'lucide-react';

const ACTIVE_MODE_KEY = 'activeMode';

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);

  const [preferredMode] = useState<AppMode | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_MODE_KEY);
      return saved === 'kid' || saved === 'adult' ? saved : null;
    } catch {
      return null;
    }
  });

  const [mode, setMode] = useState<AppMode | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('translator');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [workshopOpen, setWorkshopOpen] = useState(false);
  const [explorerRewardPopup, setExplorerRewardPopup] = useState(false);
  const [visitingFriend, setVisitingFriend] = useState<{ userId: string; username: string } | null>(null);

  const handleVisitFriendIsland = useCallback((userId: string, username: string) => {
    setVisitingFriend({ userId, username });
  }, []);

  const [progress, setProgress] = useState<UserProgress>({
    ...INITIAL_PROGRESS,
    resources: { ...EMPTY_RESOURCES },
    scannedObjects: [],
    unlockedBadges: {}
  });
  const [badgePopupQueue, setBadgePopupQueue] = useState<BadgeDefinition[]>([]);

  const syncModeStateToCloud = useCallback(
    async (targetMode: AppMode, patch: Partial<ModeCloudProfile>) => {
      if (!authToken) return;
      try {
        const res = await fetch('/api/user/state', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ mode: targetMode, ...patch })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCloudUser(data.user);
          }
        }
      } catch (err) {
        console.warn('Cloud sync failed:', err);
      }
    },
    [authToken]
  );

  const applyProfileToLocalState = useCallback((user: CloudUser, targetMode: AppMode) => {
    const profile = user.profiles[targetMode];
    setProgress(profile.progress);
    saveProgress(targetMode, profile.progress);
    try {
      localStorage.setItem(ACTIVE_MODE_KEY, targetMode);
      localStorage.setItem(`rafeeq_weekly_tracker_${targetMode}`, JSON.stringify(profile.weeklyTracker));
      localStorage.setItem(`rafeeq_asked_history_${targetMode}`, JSON.stringify(profile.askedHistory));
      if (profile.dailyQuiz) {
        localStorage.setItem(`rafeeq_daily_quiz_${targetMode}`, JSON.stringify(profile.dailyQuiz));
      } else {
        localStorage.removeItem(`rafeeq_daily_quiz_${targetMode}`);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const handleAuthSuccess = useCallback(
    (token: string, user: CloudUser, selectedMode: AppMode) => {
      setAuthToken(token);
      setCloudUser(user);
      applyProfileToLocalState(user, selectedMode);
      setBadgePopupQueue([]);
      setActiveTab('translator');
      setMode(selectedMode);
    },
    [applyProfileToLocalState]
  );

  const handleSelectModeWhileLoggedIn = useCallback(
    (selectedMode: AppMode) => {
      if (!cloudUser) return;
      applyProfileToLocalState(cloudUser, selectedMode);
      setBadgePopupQueue([]);
      setActiveTab('translator');
      setMode(selectedMode);
    },
    [cloudUser, applyProfileToLocalState]
  );

  const handleStoryUserUpdated = useCallback(
    (updatedUser: CloudUser) => {
      setCloudUser(updatedUser);
      if (mode) {
        setProgress(updatedUser.profiles[mode].progress);
        saveProgress(mode, updatedUser.profiles[mode].progress);
      }
    },
    [mode]
  );

  const handleExitMode = useCallback(() => {
    try {
      localStorage.removeItem(ACTIVE_MODE_KEY);
    } catch (err) {
      console.warn('Could not remove activeMode from localStorage:', err);
    }
    setBadgePopupQueue([]);
    setExplorerRewardPopup(false);
    setLeaderboardOpen(false);
    setShopOpen(false);
    setWorkshopOpen(false);
    setMode(null);
  }, []);

  const handleLogout = useCallback(async () => {
    const tokenToRevoke = authToken;
    setAuthToken(null);
    setCloudUser(null);
    setMode(null);
    setBadgePopupQueue([]);
    setExplorerRewardPopup(false);
    setLeaderboardOpen(false);
    setShopOpen(false);
    setWorkshopOpen(false);
    try {
      localStorage.removeItem(ACTIVE_MODE_KEY);
    } catch {
      // Ignore
    }
    if (tokenToRevoke) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenToRevoke}` }
        });
      } catch {
        // Ignore network errors on logout
      }
    }
  }, [authToken]);

  const handleActivity = useCallback(
    (
      type: ActivityType,
      points: number,
      scannedObjectName?: string,
      resourceDrop?: { type: ResourceType; amount: number }
    ) => {
      if (!mode) return;
      setProgress((prev) => {
        const { nextProgress, newlyUnlocked, unlockedCameraExplorer } = recordUserActivity(
          prev,
          type,
          points,
          mode,
          scannedObjectName,
          resourceDrop
        );
        saveProgress(mode, nextProgress);
        if (newlyUnlocked.length > 0) {
          setBadgePopupQueue((queue) => [...queue, ...newlyUnlocked]);
        }
        if (unlockedCameraExplorer) {
          setExplorerRewardPopup(true);
        }
        setCloudUser((prevUser) =>
          prevUser
            ? {
                ...prevUser,
                profiles: {
                  ...prevUser.profiles,
                  [mode]: {
                    ...prevUser.profiles[mode],
                    progress: nextProgress
                  }
                }
              }
            : null
        );
        void syncModeStateToCloud(mode, { progress: nextProgress });
        return nextProgress;
      });
    },
    [mode, syncModeStateToCloud]
  );

  const handleSaveTranslation = useCallback(
    (item: PastTranslationItem) => {
      if (!mode) return;
      setCloudUser((prevUser) => {
        if (!prevUser) return null;
        const existing = prevUser.profiles[mode].pastTranslations || [];
        const updated = [...existing, item].slice(-100);
        void syncModeStateToCloud(mode, { pastTranslations: updated });
        return {
          ...prevUser,
          profiles: {
            ...prevUser.profiles,
            [mode]: {
              ...prevUser.profiles[mode],
              pastTranslations: updated
            }
          }
        };
      });
    },
    [mode, syncModeStateToCloud]
  );

  const handleSyncPractice = useCallback(
    (patch: {
      weeklyTracker?: WeeklyTracker;
      dailyQuiz?: DailyQuizState | null;
      askedHistory?: string[];
    }) => {
      if (!mode) return;
      setCloudUser((prevUser) => {
        if (!prevUser) return null;
        const currentProf = prevUser.profiles[mode];
        const nextProf: ModeCloudProfile = {
          ...currentProf,
          ...(patch.weeklyTracker ? { weeklyTracker: patch.weeklyTracker } : {}),
          ...(patch.dailyQuiz !== undefined ? { dailyQuiz: patch.dailyQuiz } : {}),
          ...(patch.askedHistory ? { askedHistory: patch.askedHistory } : {})
        };
        void syncModeStateToCloud(mode, patch);
        return {
          ...prevUser,
          profiles: {
            ...prevUser.profiles,
            [mode]: nextProf
          }
        };
      });
    },
    [mode, syncModeStateToCloud]
  );

  const activePopupBadge = badgePopupQueue[0] || null;

  const dismissPopupBadge = () => {
    setBadgePopupQueue((queue) => queue.slice(1));
  };

  useEffect(() => {
    if (!activePopupBadge) return;
    const timer = setTimeout(() => {
      dismissPopupBadge();
    }, 6000);
    return () => clearTimeout(timer);
  }, [activePopupBadge]);

  if (!cloudUser || !mode) {
    return (
      <WelcomeModeScreen
        currentUser={cloudUser}
        initialMode={preferredMode}
        onAuthSuccess={handleAuthSuccess}
        onSelectModeWhileLoggedIn={handleSelectModeWhileLoggedIn}
        onLogout={handleLogout}
      />
    );
  }

  const isKid = mode === 'kid';
  const activeCloudProfile = cloudUser.profiles[mode];

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        isKid
          ? 'bg-gradient-to-br from-amber-50 via-rose-50/50 to-teal-50/50 text-gray-900'
          : 'bg-[#F4F8F6] dark:bg-gray-950 text-gray-900 dark:text-gray-100'
      }`}
      dir="rtl"
    >
      {/* Top Header */}
      <Header
        mode={mode}
        username={cloudUser.username}
        avatar={progress.avatar}
        langCoins={progress.langCoins}
        onExitMode={handleExitMode}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenShop={() => setShopOpen(true)}
        onOpenWorkshop={() => setWorkshopOpen(true)}
        stars={progress.stars}
        xp={progress.xp}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        mode={mode}
        authToken={authToken}
        onVisitIsland={handleVisitFriendIsland}
      />

      {/* Friend Island Visit Modal */}
      <FriendIslandModal
        isOpen={Boolean(visitingFriend)}
        onClose={() => setVisitingFriend(null)}
        targetUserId={visitingFriend?.userId || null}
        targetUsername={visitingFriend?.username}
        mode={mode}
        authToken={authToken}
      />

      {/* Pixel Avatar Shop Modal */}
      <AvatarShopModal
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        mode={mode}
        progress={progress}
        authToken={authToken}
        onUserUpdated={handleStoryUserUpdated}
        onGoToLens={() => setActiveTab('lens')}
        onGoToChat={() => setActiveTab('chat')}
      />

      {/* Crafting & Enchanting Workshop Modal */}
      <CraftingWorkshopModal
        isOpen={workshopOpen}
        onClose={() => setWorkshopOpen(false)}
        mode={mode}
        progress={progress}
        authToken={authToken}
        onUserUpdated={handleStoryUserUpdated}
        onGoToLens={() => setActiveTab('lens')}
        onGoToChat={() => setActiveTab('chat')}
      />

      {/* Camera Explorer 10-Object Milestone Popup */}
      {explorerRewardPopup && (
        <div className="fixed inset-x-0 top-16 z-50 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto max-w-md w-full rounded-3xl p-4 shadow-2xl border-2 bg-gradient-to-r from-amber-100 via-yellow-50 to-emerald-100 border-amber-400 text-gray-900 flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md shrink-0">
              <Camera className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs font-extrabold text-amber-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>إنجاز مستكشف الكاميرا (10/10) 🎉</span>
              </div>
              <h4 className="font-black text-sm mt-0.5">
                تم فتح قبعة المستكشف والكاميرا الذهبية!
              </h4>
              <button
                type="button"
                onClick={() => {
                  setExplorerRewardPopup(false);
                  setShopOpen(true);
                }}
                className="mt-1.5 px-3 py-1 rounded-xl bg-amber-600 text-white text-xs font-extrabold hover:bg-amber-700"
              >
                ارتدِ الجوائز الآن في المتجر 🛍️
              </button>
            </div>
            <button
              type="button"
              onClick={() => setExplorerRewardPopup(false)}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 shrink-0"
              aria-label="إغلاق الإشعار"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Celebratory Badge Unlock Notification */}
      {activePopupBadge && !explorerRewardPopup && (
        <div className="fixed inset-x-0 top-16 z-50 flex justify-center px-4 pointer-events-none">
          <div
            className={`pointer-events-auto max-w-md w-full rounded-3xl p-4 shadow-2xl border-2 flex items-center gap-3.5 animate-bounce ${
              isKid
                ? 'bg-gradient-to-r from-amber-100 via-rose-100 to-teal-100 border-amber-400 text-gray-900'
                : 'bg-white dark:bg-gray-800 border-emerald-400 text-gray-900 dark:text-white'
            }`}
          >
            <div className="p-3 rounded-2xl bg-amber-400 text-white shadow-md shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>مبروك! فتحت وساماً جديداً 🎉</span>
              </div>
              <h4 className="font-black text-sm sm:text-base truncate mt-0.5">
                {activePopupBadge.title}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">
                {activePopupBadge.desc}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissPopupBadge}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 dark:text-gray-200 shrink-0"
              aria-label="إغلاق الإشعار"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content View based on activeTab */}
      <main className="transition-all duration-300">
        {activeTab === 'translator' && (
          <TranslatorTab
            mode={mode}
            onActivity={handleActivity}
            pastTranslations={activeCloudProfile.pastTranslations}
            onSaveTranslation={handleSaveTranslation}
          />
        )}
        {activeTab === 'lens' && (
          <SmartLensTab
            mode={mode}
            onActivity={handleActivity}
            scannedObjectsCount={progress.scannedObjects?.length || 0}
            hasEnchantedAura={hasActiveEnchantedItem(progress.avatar)}
            resources={progress.resources}
            onOpenWorkshop={() => setWorkshopOpen(true)}
          />
        )}
        {activeTab === 'chat' && (
          <AiChatTab
            mode={mode}
            onActivity={handleActivity}
            chatXp={progress.chatXp}
            onOpenWorkshop={() => setWorkshopOpen(true)}
          />
        )}
        {activeTab === 'practice' && (
          <PracticeTab
            mode={mode}
            onActivity={handleActivity}
            cloudProfile={activeCloudProfile}
            onSyncPractice={handleSyncPractice}
          />
        )}
        {activeTab === 'stories' && !isKid && (
          <StoriesTab
            authToken={authToken}
            currentUser={cloudUser}
            onUserUpdated={handleStoryUserUpdated}
          />
        )}
        {activeTab === 'island' && (
          <MyIslandTab
            mode={mode}
            authToken={authToken}
            cloudUser={cloudUser}
            islandData={activeCloudProfile.island || DEFAULT_ISLAND_DATA}
            resources={progress.resources || EMPTY_RESOURCES}
            langCoins={progress.langCoins || 0}
            onUserUpdated={handleStoryUserUpdated}
            onOpenLeaderboard={() => setLeaderboardOpen(true)}
            onOpenWorkshop={() => setWorkshopOpen(true)}
          />
        )}
        {activeTab === 'progress' && (
          <ProgressTab
            mode={mode}
            progress={progress}
            authToken={authToken}
            onUserUpdated={handleStoryUserUpdated}
            onGoToLens={() => setActiveTab('lens')}
            onGoToChat={() => setActiveTab('chat')}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} mode={mode} />
    </div>
  );
}
