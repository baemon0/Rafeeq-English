import React, { useState, useEffect, useCallback } from 'react';
import {
  AppMode,
  CloudUser,
  DailyQuizState,
  ModeCloudProfile,
  PastTranslationItem,
  TabType,
  VocabularyWord,
  WeeklyTracker
} from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { TranslatorTab } from './components/TranslatorTab';
import { SmartLensTab } from './components/SmartLensTab';
import { AiChatTab } from './components/AiChatTab';
import { PracticeTab } from './components/PracticeTab';
import { StoriesTab } from './components/StoriesTab';
import { ProgressTab } from './components/ProgressTab';
import { ShopTab } from './components/ShopTab';
import { WelcomeModeScreen } from './components/WelcomeModeScreen';
import { LeaderboardModal } from './components/LeaderboardModal';
import {
  ActivityType,
  BadgeDefinition,
  INITIAL_PROGRESS,
  UserProgress,
  recordUserActivity,
  saveProgress
} from './utils/progress';
import { Award, RefreshCw, Sparkles, X } from 'lucide-react';

const ACTIVE_MODE_KEY = 'activeMode';
const AUTH_TOKEN_KEY = 'rafeeq_auth_token';

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [restoringSession, setRestoringSession] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
    } catch {
      return false;
    }
  });

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

  const [progress, setProgress] = useState<UserProgress>({
    ...INITIAL_PROGRESS,
    unlockedBadges: {}
  });
  const [badgePopupQueue, setBadgePopupQueue] = useState<BadgeDefinition[]>([]);

  const applyProfileToLocalState = useCallback((user: CloudUser, targetMode: AppMode) => {
    const profile = user.profiles[targetMode];
    setProgress(profile.progress);
    saveProgress(targetMode, profile.progress);
    try {
      localStorage.setItem(ACTIVE_MODE_KEY, targetMode);
      localStorage.setItem(
        `rafeeq_weekly_tracker_${targetMode}`,
        JSON.stringify(profile.weeklyTracker)
      );
      localStorage.setItem(
        `rafeeq_asked_history_${targetMode}`,
        JSON.stringify(profile.askedHistory)
      );
      if (profile.dailyQuiz) {
        localStorage.setItem(
          `rafeeq_daily_quiz_${targetMode}`,
          JSON.stringify(profile.dailyQuiz)
        );
      } else {
        localStorage.removeItem(`rafeeq_daily_quiz_${targetMode}`);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  // Automatically restore active cloud session on mount
  useEffect(() => {
    if (!authToken || cloudUser) {
      setRestoringSession(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/user/state', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!res.ok) {
          throw new Error('Session expired');
        }
        const data = await res.json();
        if (!cancelled && data.user) {
          setCloudUser(data.user);
          const restoredMode: AppMode =
            preferredMode || (data.user.defaultMode === 'kid' ? 'kid' : 'adult');
          applyProfileToLocalState(data.user, restoredMode);
          setMode(restoredMode);
        }
      } catch {
        if (!cancelled) {
          setAuthToken(null);
          try {
            localStorage.removeItem(AUTH_TOKEN_KEY);
          } catch {
            // Ignore
          }
        }
      } finally {
        if (!cancelled) {
          setRestoringSession(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, cloudUser, preferredMode, applyProfileToLocalState]);

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

  const handleAuthSuccess = useCallback(
    (token: string, user: CloudUser, selectedMode: AppMode) => {
      setAuthToken(token);
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } catch {
        // Ignore
      }
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

  const handleVocabularySynced = useCallback(
    (vocabulary: VocabularyWord[]) => {
      if (!mode) return;
      setProgress((prev) => {
        const nextProgress = { ...prev, vocabulary };
        saveProgress(mode, nextProgress);
        return nextProgress;
      });
      setCloudUser((prevUser) =>
        prevUser
          ? {
              ...prevUser,
              profiles: {
                ...prevUser.profiles,
                [mode]: {
                  ...prevUser.profiles[mode],
                  progress: {
                    ...prevUser.profiles[mode].progress,
                    vocabulary
                  }
                }
              }
            }
          : null
      );
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
    setLeaderboardOpen(false);
    setMode(null);
  }, []);

  const handleLogout = useCallback(async () => {
    const tokenToRevoke = authToken;
    setAuthToken(null);
    setCloudUser(null);
    setMode(null);
    setBadgePopupQueue([]);
    setLeaderboardOpen(false);
    try {
      localStorage.removeItem(ACTIVE_MODE_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
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
    (type: ActivityType, points: number) => {
      if (!mode) return;
      setProgress((prev) => {
        const { nextProgress, newlyUnlocked } = recordUserActivity(
          prev,
          type,
          points,
          mode
        );
        saveProgress(mode, nextProgress);
        if (newlyUnlocked.length > 0) {
          setBadgePopupQueue((queue) => [...queue, ...newlyUnlocked]);
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

  const handleUseSecondChanceHeart = useCallback(() => {
    if (!mode) return;
    setProgress((prev) => {
      const nextProgress: UserProgress = {
        ...prev,
        secondChanceHearts: Math.max(0, (prev.secondChanceHearts || 0) - 1)
      };
      saveProgress(mode, nextProgress);
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
  }, [mode, syncModeStateToCloud]);

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

  if (restoringSession) {
    return (
      <div
        className="min-h-screen bg-[#FAF8F5] dark:bg-[#111714] flex flex-col items-center justify-center gap-3 text-[#1B4332] dark:text-[#FAF8F5]"
        dir="rtl"
      >
        <RefreshCw className="w-7 h-7 animate-spin text-[#1B4332] dark:text-[#D4A373]" />
        <p className="text-sm font-semibold">جاري استعادة جلستك السحابية...</p>
      </div>
    );
  }

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
      className={`min-h-screen transition-colors duration-300 relative overflow-x-hidden ${
        isKid
          ? 'bg-[#FFFDF7] dark:bg-[#181512] text-[#1F2933] dark:text-[#FFFDF7]'
          : 'bg-[#FAF8F5] dark:bg-[#111714] text-[#1B4332] dark:text-[#FAF8F5]'
      }`}
      dir="rtl"
    >
      {/* Top Editorial Bar */}
      <Header
        mode={mode}
        username={cloudUser.username}
        onExitMode={handleExitMode}
        onOpenLeaderboard={() => setLeaderboardOpen(true)}
        onOpenShop={() => setActiveTab('shop')}
        stars={progress.stars}
        xp={progress.xp}
      />

      {/* Kids Organic Top Wave Accent */}
      {isKid && (
        <div className="pointer-events-none w-full overflow-hidden leading-none" aria-hidden="true">
          <svg
            className="w-full h-4 text-[#2EC4B6]/10"
            viewBox="0 0 1440 40"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              d="M0,0 L1440,0 L1440,18 C1180,38 920,4 680,22 C440,40 220,8 0,24 Z"
            />
          </svg>
        </div>
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        mode={mode}
        authToken={authToken}
      />

      {/* Celebratory Badge Unlock Notification */}
      {activePopupBadge && (
        <div className="fixed inset-x-0 top-16 z-50 flex justify-center px-4 pointer-events-none">
          <div
            className={`pointer-events-auto max-w-md w-full rounded-3xl p-4 shadow-xl border flex items-center gap-3.5 ${
              isKid
                ? 'bg-[#FFFDF7]/95 border-[#2EC4B6]/40 text-[#1F2933]'
                : 'bg-[#FAF8F5]/95 dark:bg-[#18201C]/95 backdrop-blur-md border-[#D4A373]/50 text-[#1B4332] dark:text-white'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 animate-confetti-sparkle ${
                isKid
                  ? 'bg-[#FF9F1C]/20 text-[#D97706]'
                  : 'bg-[#D4A373]/25 text-[#9C6644] dark:text-[#D4A373]'
              }`}
            >
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#9C6644] dark:text-[#D4A373]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>مبروك! فتحت وساماً جديداً</span>
              </div>
              <h4 className="font-bold text-sm truncate mt-0.5">{activePopupBadge.title}</h4>
              <p className="text-xs text-[#5C665E] dark:text-gray-300 mt-0.5 leading-snug">
                {activePopupBadge.desc}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissPopupBadge}
              className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 text-[#5C665E] dark:text-gray-300 flex items-center justify-center shrink-0"
              aria-label="إغلاق الإشعار"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="transition-all duration-200">
        {activeTab === 'translator' && (
          <TranslatorTab
            mode={mode}
            authToken={authToken}
            onActivity={handleActivity}
            pastTranslations={activeCloudProfile.pastTranslations}
            onSaveTranslation={handleSaveTranslation}
            onVocabularySynced={handleVocabularySynced}
          />
        )}
        {activeTab === 'lens' && (
          <SmartLensTab
            mode={mode}
            authToken={authToken}
            onActivity={handleActivity}
            onVocabularySynced={handleVocabularySynced}
          />
        )}
        {activeTab === 'chat' && (
          <AiChatTab
            mode={mode}
            onActivity={handleActivity}
            unlockedCharacters={progress.unlockedCharacters}
            onOpenShop={() => setActiveTab('shop')}
          />
        )}
        {activeTab === 'practice' && (
          <PracticeTab
            mode={mode}
            onActivity={handleActivity}
            cloudProfile={activeCloudProfile}
            onSyncPractice={handleSyncPractice}
            secondChanceHearts={progress.secondChanceHearts}
            onUseSecondChanceHeart={handleUseSecondChanceHeart}
          />
        )}
        {activeTab === 'stories' && !isKid && (
          <StoriesTab
            authToken={authToken}
            currentUser={cloudUser}
            onUserUpdated={handleStoryUserUpdated}
          />
        )}
        {activeTab === 'shop' && (
          <ShopTab
            mode={mode}
            progress={progress}
            authToken={authToken}
            onUserUpdated={handleStoryUserUpdated}
          />
        )}
        {activeTab === 'progress' && (
          <ProgressTab
            mode={mode}
            progress={progress}
            authToken={authToken}
            onOpenShop={() => setActiveTab('shop')}
          />
        )}
      </main>

      {/* Floating Pill Navigation Dock */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} mode={mode} />
    </div>
  );
}
