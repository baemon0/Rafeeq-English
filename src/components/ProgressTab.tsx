import React, { useState } from 'react';
import { AppMode } from '../types';
import { FooterCredits } from './FooterCredits';
import {
  UserProgress,
  getBadgeDefinitions,
  getDiscordRoleInfo,
  getEffectiveStreak,
  getSkillLevelInfo
} from '../utils/progress';
import { LeaderboardPanel } from './LeaderboardModal';
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Flame,
  Lock,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trophy,
  Zap
} from 'lucide-react';

interface ProgressTabProps {
  mode: AppMode;
  progress: UserProgress;
  authToken: string | null;
  onOpenShop?: () => void;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({
  mode,
  progress,
  authToken,
  onOpenShop
}) => {
  const [subTab, setSubTab] = useState<'achievements' | 'leaderboard'>('achievements');
  const isKid = mode === 'kid';
  const effectiveStreak = getEffectiveStreak(progress);
  const levelInfo = getSkillLevelInfo(progress.xp);
  const discordRole = getDiscordRoleInfo(progress.xp, mode);
  const badges = getBadgeDefinitions(mode);

  const streakLabel = effectiveStreak === 1 ? '1 يوم' : `${effectiveStreak} أيام`;

  const masteredWords = (progress.vocabulary || []).filter((v) => v.masteryLevel >= 3);
  const reviewWords = (progress.vocabulary || []).filter((v) => v.masteryLevel < 3);

  const getBadgeProgressLabel = (id: string): string => {
    switch (id) {
      case 'hero_translator': {
        const tDone = progress.translationsCount >= 1 ? 1 : 0;
        const cDone = progress.challengeQuestionsCount >= 1 ? 1 : 0;
        return `ترجمة ${tDone}/1 · تحدي ${cDone}/1`;
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      {/* Header Section */}
      <div className="editorial-card rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
        {isKid && (
          <svg
            className="pointer-events-none absolute bottom-0 left-0 right-0 w-full h-10 text-[#2EC4B6]/10"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M0,48 C220,110 460,5 740,64 C960,110 1100,32 1200,56 L1200,120 L0,120 Z"
            />
          </svg>
        )}

        <div className="relative z-10">
          <div
            className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${
              isKid
                ? 'bg-[#FF9F1C]/15 text-[#D97706]'
                : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
            }`}
          >
            {subTab === 'leaderboard' ? (
              <Trophy className="w-7 h-7" />
            ) : (
              <Award className="w-7 h-7" />
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1B4332] dark:text-[#FAF8F5]">
            {subTab === 'leaderboard'
              ? 'لوحة المتصدرين'
              : isKid
                ? 'إنجازاتي ونجومي'
                : 'سجل التقدم والإنجازات'}
          </h2>
          <p className="text-sm text-[#5C665E] dark:text-gray-400 mt-1.5 max-w-lg mx-auto leading-relaxed">
            {subTab === 'leaderboard'
              ? 'تنافس مع المتعلمين الآخرين وارتقِ برتبتك في القائمة السحابية.'
              : isKid
                ? 'أكمل الترجمات، العدسة الذكية، والمحادثات لفتح جميع الأوسمة.'
                : 'تتبع سلسلة تعلمك، رصيد المفردات المثبتة، والأوسمة التي حققتها.'}
          </p>

          <div className="mt-6 inline-flex p-1 bg-black/[0.04] dark:bg-white/5 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setSubTab('achievements')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                subTab === 'achievements'
                  ? isKid
                    ? 'bg-[#2EC4B6] text-white shadow-xs'
                    : 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                  : 'text-[#5C665E] dark:text-gray-300'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>إنجازاتي ورتبتي</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('leaderboard')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                subTab === 'leaderboard'
                  ? isKid
                    ? 'bg-[#2EC4B6] text-white shadow-xs'
                    : 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                  : 'text-[#5C665E] dark:text-gray-300'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>لوحة المتصدرين</span>
            </button>
          </div>
        </div>
      </div>

      {subTab === 'leaderboard' ? (
        <div className="editorial-card rounded-3xl p-6 sm:p-8">
          <LeaderboardPanel mode={mode} authToken={authToken} />
        </div>
      ) : (
        <>
          {/* Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="editorial-card hover-scale p-6 rounded-3xl text-center">
              <div
                className={`w-11 h-11 mx-auto rounded-full flex items-center justify-center mb-3 ${
                  isKid
                    ? 'bg-[#FF9F1C]/15 text-[#FF9F1C]'
                    : 'bg-[#D4A373]/20 text-[#9C6644] dark:text-[#D4A373]'
                }`}
              >
                {isKid ? (
                  <Star className="w-5 h-5 fill-[#FF9F1C] text-[#FF9F1C]" />
                ) : (
                  <Trophy className="w-5 h-5" />
                )}
              </div>
              <span className="text-3xl font-bold text-[#1B4332] dark:text-white tabular-nums">
                {isKid ? progress.stars : progress.xp}
              </span>
              <p className="text-xs font-medium text-[#5C665E] dark:text-gray-400 mt-1">
                {isKid ? 'إجمالي النجوم' : 'نقاط الخبرة (XP)'}
              </p>
            </div>

            <div className="editorial-card hover-scale p-6 rounded-3xl text-center">
              <div className="w-11 h-11 mx-auto rounded-full bg-[#C87D55]/15 text-[#C87D55] flex items-center justify-center mb-3">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-3xl font-bold text-[#1B4332] dark:text-white tabular-nums">
                {streakLabel}
              </span>
              <p className="text-xs font-medium text-[#5C665E] dark:text-gray-400 mt-1">
                سلسلة التعلم{progress.streakShieldActive ? ' · الدرع مُفعّل' : ''}
              </p>
            </div>

            <div className="editorial-card hover-scale p-6 rounded-3xl text-center flex flex-col items-center justify-between">
              <div
                className={`w-11 h-11 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  isKid
                    ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                    : 'bg-[#1B4332]/10 dark:bg-white/10 text-[#1B4332] dark:text-[#D4A373]'
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-[#1B4332] dark:text-white">
                المستوى {levelInfo.level} · {discordRole.nameAr}
              </p>
              <div className="mt-3 w-full bg-black/[0.06] dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isKid ? 'bg-[#2EC4B6]' : 'bg-[#1B4332] dark:bg-[#D4A373]'
                  }`}
                  style={{ width: `${levelInfo.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-[#6B756D] mt-1.5 tabular-nums" dir="ltr">
                {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
              </p>
            </div>
          </div>

          {/* Rewards Shop Shortcut */}
          <div className="editorial-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  isKid
                    ? 'bg-[#FF9F1C]/15 text-[#D97706]'
                    : 'bg-[#D4A373]/20 text-[#9C6644] dark:text-[#D4A373]'
                }`}
              >
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1B4332] dark:text-white">
                  {isKid
                    ? `قلوب الفرصة الثانية المتاحة: ${progress.secondChanceHearts || 0}`
                    : 'متجر المكافآت ودرع حماية السلسلة'}
                </h3>
                <p className="text-xs sm:text-sm text-[#5C665E] dark:text-gray-400 mt-1 leading-relaxed">
                  {isKid
                    ? 'استخدم نجومك في المتجر لفتح شخصيات Dino Rex و Robo-Z وألقاب التميز.'
                    : progress.streakShieldActive
                      ? 'درع حماية السلسلة مُفعّل وجاهز لحماية سلسلتك. تصفح بقية المكافآت في المتجر.'
                      : 'استبدل نقاط XP في المتجر لفتح موجهي المحادثة، درع حماية السلسلة، وإطار VIP الذهبي.'}
                </p>
              </div>
            </div>

            {onOpenShop && (
              <button
                type="button"
                onClick={onOpenShop}
                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 shrink-0 flex items-center justify-center gap-2 ${
                  isKid
                    ? 'bg-[#2EC4B6] hover:bg-[#24A99D] text-white'
                    : 'bg-[#1B4332] hover:bg-[#143326] text-[#FAF8F5]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>الذهاب للمتجر</span>
              </button>
            )}
          </div>

          {/* Spaced Repetition Vocabulary Mastery */}
          <div className="editorial-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isKid
                    ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                    : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
                }`}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1B4332] dark:text-white">
                  تثبيت المفردات بالتكرار المتباعد
                </h3>
                <p className="text-xs text-[#5C665E] dark:text-gray-400 mt-0.5">
                  تتم مراجعة الكلمات عبر فترات متباعدة حتى تصل لمستوى الإتقان الكامل
                </p>
              </div>
            </div>

            {/* Level 3 Mastered */}
            <div>
              <h4 className="text-xs font-bold text-[#1B4332] dark:text-emerald-300 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>كلمات متقنة فعلياً ({masteredWords.length})</span>
              </h4>
              {masteredWords.length === 0 ? (
                <p className="text-xs text-[#6B756D] py-3 border-t border-[#1B4332]/[0.06] dark:border-white/10">
                  لم تصل أي كلمة لمستوى الإتقان الكامل بعد. واصل الإجابة عن مراجعاتك اليومية لتثبيتها.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {masteredWords.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl bg-[#1B4332]/[0.04] dark:bg-emerald-950/20 border border-[#1B4332]/15 dark:border-emerald-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-[#1B4332] dark:text-white block truncate" dir="ltr">
                          {v.word}
                        </span>
                        <p className="text-xs text-[#5C665E] dark:text-gray-300 mt-0.5 truncate">
                          {v.meaning}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#1B4332] dark:text-emerald-300 shrink-0">
                        متقنة
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Level 1-2 Review */}
            <div className="pt-4 border-t border-[#1B4332]/[0.08] dark:border-white/10">
              <h4 className="text-xs font-bold text-[#9C6644] dark:text-[#D4A373] mb-3 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>قيد المراجعة والتثبيت ({reviewWords.length})</span>
              </h4>
              {reviewWords.length === 0 ? (
                <p className="text-xs text-[#6B756D]">
                  لا توجد كلمات قيد المراجعة حالياً. ترجم كلمات جديدة أو التقط صوراً بالعدسة لإضافتها.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reviewWords.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl bg-black/[0.025] dark:bg-white/[0.03] border border-[#E8E2D9] dark:border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-[#1B4332] dark:text-white block truncate" dir="ltr">
                          {v.word}
                        </span>
                        <p className="text-xs text-[#5C665E] dark:text-gray-400 mt-0.5 truncate">
                          {v.meaning}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-[#9C6644] dark:text-[#D4A373] tabular-nums shrink-0">
                        المستوى {v.masteryLevel}/3
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Badges Section */}
          <div className="editorial-card rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isKid
                    ? 'bg-[#FF9F1C]/15 text-[#D97706]'
                    : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#1B4332] dark:text-white">
                الأوسمة والشارات
              </h3>
            </div>

            <div className="divide-y divide-[#1B4332]/[0.08] dark:divide-white/10">
              {badges.map((badge) => {
                const isUnlocked = Boolean(progress.unlockedBadges[badge.id]);
                return (
                  <div
                    key={badge.id}
                    className={`py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4 ${
                      isUnlocked ? '' : 'opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                          isUnlocked
                            ? isKid
                              ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                              : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
                            : 'bg-black/[0.05] dark:bg-white/5 text-[#7A847C]'
                        }`}
                      >
                        {isUnlocked ? (
                          <Award className="w-5 h-5" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#1B4332] dark:text-white">
                          {badge.title}
                        </h4>
                        <p className="text-xs text-[#5C665E] dark:text-gray-400 mt-0.5 leading-relaxed">
                          {badge.desc}
                        </p>
                        {!isUnlocked && (
                          <p className="text-[11px] font-medium text-[#7A847C] mt-1 tabular-nums">
                            التقدم: {getBadgeProgressLabel(badge.id)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>مفتوح</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[#7A847C]">مقفل</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <FooterCredits isKid={isKid} />
    </div>
  );
};
