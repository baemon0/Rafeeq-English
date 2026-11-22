import React, { useEffect, useState } from 'react';
import { AppMode, LeaderboardEntry } from '../types';
import { hasActiveEnchantedItem } from '../data/avatarCatalog';
import { PixelAvatar } from './PixelAvatar';
import { Crown, Flame, Medal, RefreshCw, Sparkles, Star, Trophy, X, Zap } from 'lucide-react';

interface LeaderboardPanelProps {
  mode: AppMode;
  authToken: string | null;
  onVisitIsland?: (userId: string, username: string) => void;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  mode,
  authToken,
  onVisitIsland
}) => {
  const [viewMode, setViewMode] = useState<AppMode>(mode);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setViewMode(mode);
  }, [mode]);

  const fetchLeaderboard = async (targetMode: AppMode) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch(`/api/leaderboard?mode=${targetMode}`, { headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر تحميل لوحة المتصدرين.');
      }
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(viewMode);
  }, [viewMode, authToken]);

  const isKidView = viewMode === 'kid';

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black shadow-xs shrink-0">
          <Crown className="w-4 h-4 fill-amber-500 text-amber-500" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black shrink-0">
          <Medal className="w-4 h-4 text-slate-500" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black shrink-0">
          <Medal className="w-4 h-4 text-orange-600" />
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs font-black tabular-nums shrink-0">
        #{rank}
      </span>
    );
  };

  return (
    <div>
      {/* Mode Switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('kid')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              isKidView
                ? 'bg-rose-500 text-white shadow'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            متصدرو الصغار 🧸 (النجوم)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('adult')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              !isKidView
                ? 'bg-[#2D6A4F] text-white shadow'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            متصدرو الكبار 🎓 (XP)
          </button>
        </div>

        <button
          type="button"
          onClick={() => fetchLeaderboard(viewMode)}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-10 text-center text-sm text-gray-500 animate-pulse">
          جاري تحميل ترتيب أفضل 10 متعلمين...
        </div>
      )}

      {/* Error */}
      {!loading && errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-bold text-center">
          {errorMsg}
        </div>
      )}

      {/* Empty */}
      {!loading && !errorMsg && entries.length === 0 && (
        <div className="py-10 text-center">
          <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-500">لا يوجد متصدرون بعد في هذا القسم.</p>
          <p className="text-xs text-gray-400 mt-1">كن أول من يجمع النقاط ويتصدر القائمة!</p>
        </div>
      )}

      {/* Top 10 List */}
      {!loading && !errorMsg && entries.length > 0 && (
        <div className="space-y-2.5">
          {entries.map((entry) => (
            <div
              key={`${entry.rank}-${entry.username}`}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                entry.isCurrentUser
                  ? isKidView
                    ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 shadow-sm'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-sm'
                  : 'bg-gray-50/80 dark:bg-gray-900/70 border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {getRankBadge(entry.rank)}
                <div className="p-0.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0 shadow-xs">
                  <PixelAvatar config={entry.avatar} size={42} className="rounded-lg overflow-hidden" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-sm text-gray-900 dark:text-white truncate">
                      {entry.username}
                    </span>
                    {entry.isCurrentUser && (
                      <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                        (أنت)
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold whitespace-nowrap ${entry.role.pillClass}`}
                      dir="ltr"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${entry.role.dotClass}`} />
                      <span>{entry.role.nameEn}</span>
                    </span>
                    {hasActiveEnchantedItem(entry.avatar) && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 text-white text-[9px] font-black shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>مطور</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>مستوى {entry.level}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-0.5 tabular-nums">
                      <Flame className="w-3 h-3 text-rose-500" />
                      {entry.streak} يوم
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onVisitIsland && entry.userId && (
                  <button
                    type="button"
                    onClick={() => onVisitIsland(entry.userId!, entry.username)}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                    title="زيارة الجزيرة البكسلية"
                  >
                    <span>🏝️</span>
                    <span className="hidden sm:inline">زيارة الجزيرة</span>
                    {typeof entry.islandTilesCount === 'number' && entry.islandTilesCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-white text-[10px] tabular-nums font-bold">
                        {entry.islandTilesCount}
                      </span>
                    )}
                  </button>
                )}

                <div className="shrink-0 text-left" dir="ltr">
                  {isKidView ? (
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-black text-xs tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{entry.stars}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-[#2D6A4F] dark:text-emerald-300 font-black text-xs tabular-nums">
                      <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{entry.xp} XP</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AppMode;
  authToken: string | null;
  onVisitIsland?: (userId: string, username: string) => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  mode,
  authToken,
  onVisitIsland
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full max-w-xl max-h-[85vh] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                لوحة المتصدرين (أفضل 10)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                الترتيب السحابي المباشر حسب النجوم ونقاط الخبرة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors"
            aria-label="إغلاق لوحة المتصدرين"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <LeaderboardPanel mode={mode} authToken={authToken} onVisitIsland={onVisitIsland} />
        </div>
      </div>
    </div>
  );
};
