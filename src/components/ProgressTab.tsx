import React, { useState } from 'react';
import { AppMode, CloudUser } from '../types';
import {
  UserProgress,
  getBadgeDefinitions,
  getDiscordRoleInfo,
  getEffectiveStreak,
  getSkillLevelInfo
} from '../utils/progress';
import { LeaderboardPanel } from './LeaderboardModal';
import { AvatarShopPanel } from './AvatarShopModal';
import { PixelAvatar } from './PixelAvatar';
import { Award, Star, Flame, CheckCircle, ShieldCheck, Zap, Lock, Trophy, ShoppingBag, Coins } from 'lucide-react';

interface ProgressTabProps {
  mode: AppMode;
  progress: UserProgress;
  authToken: string | null;
  onUserUpdated: (updatedUser: CloudUser) => void;
  onGoToLens?: () => void;
  onGoToChat?: () => void;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({
  mode,
  progress,
  authToken,
  onUserUpdated,
  onGoToLens,
  onGoToChat
}) => {
  const [subTab, setSubTab] = useState<'achievements' | 'shop' | 'leaderboard'>('achievements');
  const isKid = mode === 'kid';
  const effectiveStreak = getEffectiveStreak(progress);
  const levelInfo = getSkillLevelInfo(progress.xp);
  const discordRole = getDiscordRoleInfo(progress.xp, mode);
  const badges = getBadgeDefinitions(mode);

  const streakLabel =
    effectiveStreak === 1 ? '1 يوم' : `${effectiveStreak} أيام`;

  const getBadgeProgressLabel = (id: string): string => {
    switch (id) {
      case 'hero_translator': {
        const tDone = progress.translationsCount >= 1 ? 1 : 0;
        const cDone = progress.challengeQuestionsCount >= 1 ? 1 : 0;
        return `ترجمة ${tDone}/1 • تحدي ${cDone}/1`;
      }
      case 'lens_explorer':
        return `مسح العدسة ${Math.min(progress.lensScansCount, 1)}/1`;
      case 'astronaut_friend':
        return `الرسائل ${Math.min(progress.chatMessagesCount, 3)}/3`;
      case 'golden_castle':
        return isKid
          ? `النجوم ${Math.min(progress.stars, 100)}/100`
          : `النقاط ${Math.min(progress.xp, 100)}/100`;
      default:
        return '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28">
      {/* Header Banner with PixelAvatar */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-6 text-center">
        <div className="inline-flex p-1.5 rounded-3xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 mb-3 shadow-inner">
          <PixelAvatar config={progress.avatar} size={84} className="rounded-2xl overflow-hidden" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">
          {subTab === 'leaderboard'
            ? 'لوحة المتصدرين (أفضل 10) 🏆'
            : subTab === 'shop'
              ? 'استوديو ومتجر الشخصية البكسل 🛍️'
              : isKid
                ? 'لوحة إنجازات النجوم السحرية 🌟'
                : 'إنجازات وتقدم التعلم'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {subTab === 'leaderboard'
            ? 'تنافس مع المتعلمين الآخرين وارتقِ برتبتك في القائمة السحابية.'
            : subTab === 'shop'
              ? 'صمم شخصيتك البكسل مجاناً أو اشترِ إكسسوارات وخلفيات بعملات LangCoins.'
              : isKid
                ? 'أكمل الترجمات، العدسة السحرية، ومحادثة نجم لفتح الأوسمة المقفلة!'
                : 'تتبع سلسلة تعلمك اليومي الحقيقية، مستوى مهارتك، والأوسمة التي فتحتها.'}
        </p>

        {/* Achievements vs Shop vs Leaderboard Switcher */}
        <div className="mt-5 inline-flex p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl gap-1 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => setSubTab('achievements')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              subTab === 'achievements'
                ? isKid
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-[#2D6A4F] text-white shadow'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>إنجازاتي ورتبتي</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('shop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              subTab === 'shop'
                ? isKid
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-[#2D6A4F] text-white shadow'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>المتجر ({progress.langCoins} 🪙)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('leaderboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              subTab === 'leaderboard'
                ? isKid
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-[#2D6A4F] text-white shadow'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>لوحة المتصدرين</span>
          </button>
        </div>
      </div>

      {subTab === 'shop' ? (
        <AvatarShopPanel
          mode={mode}
          progress={progress}
          authToken={authToken}
          onUserUpdated={onUserUpdated}
          onGoToLens={onGoToLens}
          onGoToChat={onGoToChat}
        />
      ) : subTab === 'leaderboard' ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
          <LeaderboardPanel mode={mode} authToken={authToken} />
        </div>
      ) : (
        <>
          {/* Real Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div
                className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center mb-2 ${
                  isKid
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-[#2D6A4F]'
                }`}
              >
                {isKid ? (
                  <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                ) : (
                  <Trophy className="w-6 h-6" />
                )}
              </div>
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                {isKid ? progress.stars : progress.xp}
              </span>
              <p className="text-xs font-bold text-gray-400 mt-1">
                {isKid ? 'إجمالي النجوم ⭐' : 'نقاط الخبرة (XP)'}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                <Coins className="w-6 h-6" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                {progress.langCoins}
              </span>
              <p className="text-xs font-bold text-gray-400 mt-1">عملات LangCoins 🪙</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                {streakLabel}
              </span>
              <p className="text-xs font-bold text-gray-400 mt-1">سلسلة التعلم 🔥</p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 text-center flex flex-col items-center justify-between">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center mb-2">
                <Zap className="w-6 h-6" />
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold whitespace-nowrap ${discordRole.pillClass}`}
                dir="ltr"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${discordRole.dotClass}`} />
                <span>{discordRole.nameEn}</span>
              </div>

              <p className="text-xs font-black text-gray-900 dark:text-white mt-1.5">
                مستوى {levelInfo.level} · {discordRole.nameAr}
              </p>

              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isKid ? 'bg-rose-500' : 'bg-[#2D6A4F]'
                  }`}
                  style={{ width: `${levelInfo.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 tabular-nums">
                {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
              </p>
            </div>
          </div>

      {/* Badges Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
        <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2D6A4F]" />
          <span>الأوسمة والشارات المتاحة</span>
        </h3>

        <div className="space-y-3">
          {badges.map((badge) => {
            const isUnlocked = Boolean(progress.unlockedBadges[badge.id]);
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isUnlocked
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-sm'
                    : 'bg-gray-100/70 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800 opacity-65 grayscale'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2.5 rounded-2xl ${
                      isUnlocked
                        ? 'bg-amber-100 text-amber-600 shadow-sm'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                    }`}
                  >
                    {isUnlocked ? (
                      <Award className="w-6 h-6" />
                    ) : (
                      <Lock className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {badge.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{badge.desc}</p>
                    {!isUnlocked && (
                      <div className="mt-1.5">
                        <p className="text-[11px] font-semibold text-gray-400">
                          التقدم: {getBadgeProgressLabel(badge.id)}
                        </p>
                        {badge.id === 'golden_castle' && (
                          <div className="mt-1.5 w-44 max-w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isKid ? 'bg-amber-400' : 'bg-[#2D6A4F]'
                              }`}
                              style={{
                                width: `${Math.min(100, isKid ? progress.stars : progress.xp)}%`
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-full shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>مفتوح</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-200 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                      <span>🔒 مقفل</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
