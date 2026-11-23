import React, { useEffect, useState } from 'react';
import { AppMode, LeaderboardEntry } from '../types';
import { Crown, Flame, Medal, Orbit, RefreshCw, Star, Trophy, X, Zap } from 'lucide-react';

interface LeaderboardPanelProps {
  mode: AppMode;
  authToken: string | null;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  mode,
  authToken
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
        <span className="w-9 h-9 rounded-full bg-[#FF9F1C]/15 text-[#D97706] flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4 fill-[#FF9F1C] text-[#FF9F1C]" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-9 h-9 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
          <Medal className="w-4 h-4" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-9 h-9 rounded-full bg-[#D4A373]/20 text-[#9C6644] dark:text-[#D4A373] flex items-center justify-center shrink-0">
          <Medal className="w-4 h-4" />
        </span>
      );
    }
    return (
      <span className="w-9 h-9 rounded-full bg-black/[0.04] dark:bg-white/5 text-[#5C665E] dark:text-gray-300 flex items-center justify-center text-xs font-bold tabular-nums shrink-0">
        {rank}
      </span>
    );
  };

  return (
    <div>
      {/* Segmented Mode Filter & Refresh */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div className="bg-black/[0.04] dark:bg-white/5 p-1 rounded-2xl inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('kid')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              isKidView
                ? 'bg-[#2EC4B6] text-white shadow-xs'
                : 'text-[#5C665E] dark:text-gray-300 hover:text-[#1B4332]'
            }`}
          >
            متصدرو الصغار
          </button>
          <button
            type="button"
            onClick={() => setViewMode('adult')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              !isKidView
                ? 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                : 'text-[#5C665E] dark:text-gray-300 hover:text-[#1B4332]'
            }`}
          >
            متصدرو الكبار
          </button>
        </div>

        <button
          type="button"
          onClick={() => fetchLeaderboard(viewMode)}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.08] text-xs font-semibold text-[#3C4A40] dark:text-gray-200 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      {loading && (
        <div className="py-10 text-center text-sm text-[#6B756D]">
          جاري تحميل ترتيب أفضل 10 متعلمين...
        </div>
      )}

      {!loading && errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-semibold text-center">
          {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && entries.length === 0 && (
        <div className="py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-black/[0.04] dark:bg-white/5 text-[#8A948C] flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-[#4F5B53] dark:text-gray-300">
            لا يوجد متصدرون بعد في هذا القسم.
          </p>
          <p className="text-xs text-[#7A847C] mt-1">كن أول من يجمع النقاط ويتصدر القائمة.</p>
        </div>
      )}

      {!loading && !errorMsg && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={`${entry.rank}-${entry.username}`}
              className={`p-4 rounded-2xl flex items-center justify-between gap-3 transition-all border ${
                entry.goldenVipFrame && !isKidView
                  ? 'border-[#D4A373] bg-[#D4A373]/10 dark:bg-[#D4A373]/15'
                  : entry.isCurrentUser
                    ? isKidView
                      ? 'bg-[#2EC4B6]/10 border-[#2EC4B6]/40'
                      : 'bg-[#1B4332]/[0.06] border-[#1B4332]/30 dark:bg-emerald-950/30 dark:border-emerald-700/50'
                    : 'bg-white/70 dark:bg-white/[0.03] border-[#E8E2D9] dark:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {getRankBadge(entry.rank)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#1B4332] dark:text-white truncate">
                      {entry.username}
                    </span>

                    {entry.goldenVipFrame && !isKidView && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9C6644] dark:text-[#E9C46A]">
                        <Crown className="w-3.5 h-3.5 text-[#D4A373]" />
                        <span>VIP</span>
                      </span>
                    )}

                    {entry.galaxyChampion && isKidView && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2EC4B6]">
                        <Orbit className="w-3.5 h-3.5" />
                        <span>بطل المجرة</span>
                      </span>
                    )}

                    {entry.isCurrentUser && (
                      <span className="text-[11px] font-semibold text-[#1B4332] dark:text-emerald-300">
                        (أنت)
                      </span>
                    )}
                  </div>

                  {/* Clean Unboxed Metadata */}
                  <div className="flex items-center gap-2 text-xs text-[#5C665E] dark:text-gray-400 mt-0.5 flex-wrap">
                    <span>{entry.role.nameAr}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">المستوى {entry.level}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Flame className="w-3 h-3 text-[#C87D55]" />
                      {entry.streak} يوم
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-left" dir="ltr">
                {isKidView ? (
                  <div className="inline-flex items-center gap-1.5 text-[#B45309] dark:text-[#FBBF24] font-bold text-xs tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-[#FF9F1C] text-[#FF9F1C]" />
                    <span>{entry.stars}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-[#1B4332] dark:text-[#D4A373] font-bold text-xs tabular-nums">
                    <Zap className="w-3.5 h-3.5 text-[#D4A373]" />
                    <span>{entry.xp} XP</span>
                  </div>
                )}
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
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  mode,
  authToken
}) => {
  if (!isOpen) return null;
  const isKid = mode === 'kid';

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1B4332]/35 dark:bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-xl max-h-[85vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${
          isKid
            ? 'bg-[#FFFDF7] dark:bg-[#1E1A16] border-[#EFE5D1] dark:border-white/10'
            : 'bg-[#FAF8F5] dark:bg-[#161E1A] border-[#E5DEC9] dark:border-white/10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#1B4332]/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isKid ? 'bg-[#FF9F1C]/15 text-[#D97706]' : 'bg-[#D4A373]/20 text-[#9C6644] dark:text-[#D4A373]'
              }`}
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1B4332] dark:text-[#FAF8F5]">
                لوحة المتصدرين
              </h3>
              <p className="text-xs text-[#5C665E] dark:text-gray-400">
                الترتيب السحابي المباشر لأفضل 10 متعلمين
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 text-[#5C665E] dark:text-gray-300 flex items-center justify-center transition-colors"
            aria-label="إغلاق لوحة المتصدرين"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <LeaderboardPanel mode={mode} authToken={authToken} />
        </div>
      </div>
    </div>
  );
};
