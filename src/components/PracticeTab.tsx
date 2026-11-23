import React, { useState, useEffect, useCallback } from 'react';
import {
  AppMode,
  DailyQuizState,
  ModeCloudProfile,
  PracticeQuestion,
  WeeklyTracker
} from '../types';
import { speakText } from '../utils/speech';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Sparkles,
  Volume2,
  ArrowLeft,
  Clock,
  RefreshCw,
  Star,
  TrendingUp,
  Heart
} from 'lucide-react';

interface PracticeTabProps {
  mode: AppMode;
  onActivity: (type: 'challenge', points: number) => void;
  cloudProfile?: ModeCloudProfile;
  secondChanceHearts?: number;
  onUseSecondChanceHeart?: () => void;
  onSyncPractice?: (patch: {
    weeklyTracker?: WeeklyTracker;
    dailyQuiz?: DailyQuizState | null;
    askedHistory?: string[];
  }) => void;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function getDailyStorageKey(mode: AppMode): string {
  return `rafeeq_daily_quiz_${mode}`;
}

function getHistoryStorageKey(mode: AppMode): string {
  return `rafeeq_asked_history_${mode}`;
}

function getWeeklyStorageKey(mode: AppMode): string {
  return `rafeeq_weekly_tracker_${mode}`;
}

function loadOrInitWeeklyTracker(mode: AppMode): WeeklyTracker {
  try {
    const raw = localStorage.getItem(getWeeklyStorageKey(mode));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.firstUsedDate === 'number' &&
        parsed.firstUsedDate > 0 &&
        typeof parsed.completedDailySets === 'number' &&
        parsed.completedDailySets >= 0
      ) {
        return parsed;
      }
    }
  } catch {
    // Fallback
  }
  const initial: WeeklyTracker = {
    firstUsedDate: Date.now(),
    completedDailySets: 0
  };
  try {
    localStorage.setItem(getWeeklyStorageKey(mode), JSON.stringify(initial));
  } catch (err) {
    console.warn('Could not save weekly tracker:', err);
  }
  return initial;
}

function saveWeeklyTracker(mode: AppMode, tracker: WeeklyTracker): void {
  try {
    localStorage.setItem(getWeeklyStorageKey(mode), JSON.stringify(tracker));
  } catch (err) {
    console.warn('Could not persist weekly tracker:', err);
  }
}

function calculateWeekNumber(tracker: WeeklyTracker): number {
  const daysElapsed = Math.max(
    0,
    Math.floor((Date.now() - tracker.firstUsedDate) / TWENTY_FOUR_HOURS_MS)
  );
  const weekByTime = Math.floor(daysElapsed / 7) + 1;
  const weekByMilestones = Math.floor(tracker.completedDailySets / 7) + 1;
  return Math.max(1, weekByTime, weekByMilestones);
}

function getWeekBadgeInfo(
  weekNumber: number,
  isKid: boolean
): { badgeLabel: string; focusLabel: string } {
  if (weekNumber === 1) {
    return {
      badgeLabel: 'الأسبوع 1 · مبتدئ',
      focusLabel: isKid
        ? 'كلمات أساسية، ألوان، وأشياء يومية بسيطة'
        : 'عبارات المحادثة اليومية والتعبيرات الشائعة'
    };
  }
  if (weekNumber === 2) {
    return {
      badgeLabel: isKid ? 'الأسبوع 2 · متطور' : 'الأسبوع 2 · متوسط',
      focusLabel: isKid
        ? 'عبارات قصيرة من 3 كلمات وأفعال يومية'
        : 'مواقف العمل والسفر والعامية الذكية'
    };
  }
  return {
    badgeLabel: isKid ? `الأسبوع ${weekNumber} · مستكشف متقدم` : `الأسبوع ${weekNumber} · متقدم`,
    focusLabel: isKid
      ? 'جمل يومية بسيطة وتحديات إملاء ذكية'
      : 'تعبيرات أصيلة متقدمة وفروق لغوية دقيقة'
  };
}

function loadAskedHistory(mode: AppMode): string[] {
  try {
    const raw = localStorage.getItem(getHistoryStorageKey(mode));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatRemainingTime(createdAt: number): string {
  const remaining = Math.max(0, createdAt + TWENTY_FOUR_HOURS_MS - Date.now());
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} ساعة و ${minutes} دقيقة`;
}

export const PracticeTab: React.FC<PracticeTabProps> = ({
  mode,
  onActivity,
  cloudProfile,
  secondChanceHearts = 0,
  onUseSecondChanceHeart,
  onSyncPractice
}) => {
  const isKid = mode === 'kid';

  const [quizState, setQuizState] = useState<DailyQuizState | null>(null);
  const [weeklyTracker, setWeeklyTracker] = useState<WeeklyTracker>(
    () => cloudProfile?.weeklyTracker || loadOrInitWeeklyTracker(mode)
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFreshDailyQuiz = useCallback(
    async (targetMode: AppMode, targetWeekNumber?: number) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const localHist = loadAskedHistory(targetMode);
        const cloudHist = cloudProfile?.askedHistory || [];
        const previousQuestions = Array.from(new Set([...localHist, ...cloudHist])).slice(-500);
        const activeTracker = cloudProfile?.weeklyTracker || loadOrInitWeeklyTracker(targetMode);
        const activeWeek =
          typeof targetWeekNumber === 'number'
            ? targetWeekNumber
            : calculateWeekNumber(activeTracker);

        const res = await fetch('/api/practice/daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: targetMode,
            previousQuestions,
            weekNumber: activeWeek
          })
        });
        const data = await res.json();

        if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error(data.error || 'تعذر تحميل تحدي اليوم، يرجى المحاولة مرة أخرى.');
        }

        const freshState: DailyQuizState = {
          createdAt: Date.now(),
          questions: data.questions.slice(0, 5),
          currentIndex: 0,
          selectedOption: null,
          isAnswered: false,
          score: 0,
          correctCount: 0,
          completed: false
        };

        const additions = freshState.questions.map((q) => q.questionAr.trim()).filter(Boolean);
        const mergedHistory = Array.from(new Set([...previousQuestions, ...additions])).slice(-500);

        localStorage.setItem(getDailyStorageKey(targetMode), JSON.stringify(freshState));
        localStorage.setItem(getHistoryStorageKey(targetMode), JSON.stringify(mergedHistory));
        setQuizState(freshState);

        if (onSyncPractice) {
          onSyncPractice({
            dailyQuiz: freshState,
            askedHistory: mergedHistory,
            weeklyTracker: activeTracker
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch daily quiz:', err);
        setErrorMsg(err?.message || 'حدث خطأ أثناء تحميل أسئلة اليوم.');
        setQuizState(null);
      } finally {
        setLoading(false);
      }
    },
    [cloudProfile?.askedHistory, cloudProfile?.weeklyTracker, onSyncPractice]
  );

  useEffect(() => {
    setErrorMsg(null);
    const tracker = cloudProfile?.weeklyTracker || loadOrInitWeeklyTracker(mode);
    setWeeklyTracker(tracker);
    saveWeeklyTracker(mode, tracker);
    const currentWeek = calculateWeekNumber(tracker);

    if (
      cloudProfile?.dailyQuiz &&
      typeof cloudProfile.dailyQuiz.createdAt === 'number' &&
      Date.now() - cloudProfile.dailyQuiz.createdAt < TWENTY_FOUR_HOURS_MS &&
      Array.isArray(cloudProfile.dailyQuiz.questions) &&
      cloudProfile.dailyQuiz.questions.length > 0
    ) {
      setQuizState(cloudProfile.dailyQuiz);
      try {
        localStorage.setItem(getDailyStorageKey(mode), JSON.stringify(cloudProfile.dailyQuiz));
      } catch {
        // Ignore
      }
      setLoading(false);
      return;
    }

    try {
      const raw = localStorage.getItem(getDailyStorageKey(mode));
      if (raw) {
        const parsed: DailyQuizState = JSON.parse(raw);
        const isValid =
          parsed &&
          typeof parsed.createdAt === 'number' &&
          Date.now() - parsed.createdAt < TWENTY_FOUR_HOURS_MS &&
          Array.isArray(parsed.questions) &&
          parsed.questions.length > 0;

        if (isValid) {
          setQuizState(parsed);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Ignore
    }

    fetchFreshDailyQuiz(mode, currentWeek);
  }, [mode]);

  const persistQuizState = (updated: DailyQuizState, updatedTracker?: WeeklyTracker) => {
    setQuizState(updated);
    try {
      localStorage.setItem(getDailyStorageKey(mode), JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not persist quiz state:', err);
    }
    if (onSyncPractice) {
      onSyncPractice({
        dailyQuiz: updated,
        ...(updatedTracker ? { weeklyTracker: updatedTracker } : {})
      });
    }
  };

  const handleSelect = (idx: number) => {
    if (!quizState || quizState.isAnswered || quizState.completed) return;
    const currentQ = quizState.questions[quizState.currentIndex];
    const isCorrect = idx === currentQ.correctIndex;
    const questionPoints = isCorrect ? 20 : isKid ? 5 : 0;
    onActivity('challenge', questionPoints);

    persistQuizState({
      ...quizState,
      selectedOption: idx,
      isAnswered: true,
      score: isCorrect ? quizState.score + 20 : quizState.score,
      correctCount: isCorrect ? quizState.correctCount + 1 : quizState.correctCount
    });
  };

  const nextQuestion = () => {
    if (!quizState) return;
    if (quizState.currentIndex < quizState.questions.length - 1) {
      persistQuizState({
        ...quizState,
        currentIndex: quizState.currentIndex + 1,
        selectedOption: null,
        isAnswered: false
      });
    } else {
      let updatedTracker: WeeklyTracker | undefined;
      if (!quizState.completed) {
        updatedTracker = {
          ...weeklyTracker,
          completedDailySets: weeklyTracker.completedDailySets + 1
        };
        setWeeklyTracker(updatedTracker);
        saveWeeklyTracker(mode, updatedTracker);
      }
      persistQuizState(
        {
          ...quizState,
          completed: true
        },
        updatedTracker
      );
    }
  };

  const currentQ = quizState?.questions[quizState.currentIndex];
  const totalQuestions = quizState?.questions.length || 5;
  const weekNumber = calculateWeekNumber(weeklyTracker);
  const { badgeLabel, focusLabel } = getWeekBadgeInfo(weekNumber, isKid);
  const milestoneProgress = weeklyTracker.completedDailySets % 7;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      {/* Header Card */}
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
            <Trophy className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1B4332] dark:text-[#FAF8F5]">
            {isKid ? 'تحديات النجوم اليومية' : 'التحدي اليومي (5 أسئلة)'}
          </h2>
          <p className="text-sm text-[#5C665E] dark:text-gray-400 mt-1.5 max-w-lg mx-auto">
            {isKid
              ? 'خمسة أسئلة ممتعة ومتجددة كل يوم لجمع النجوم وتثبيت الكلمات.'
              : 'خمسة أسئلة ذكية ومتجددة يومياً في التعبيرات الشائعة، بيئة العمل، والسفر.'}
          </p>

          <div className="mt-5 pt-4 border-t border-[#1B4332]/[0.08] dark:border-white/10 flex items-center justify-center gap-2 flex-wrap text-xs text-[#5C665E] dark:text-gray-300">
            <TrendingUp className={`w-4 h-4 ${isKid ? 'text-[#2EC4B6]' : 'text-[#1B4332] dark:text-[#D4A373]'}`} />
            <span className="font-bold text-[#1B4332] dark:text-white">{badgeLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{focusLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">تقدم الأسبوع {milestoneProgress}/7</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="editorial-card rounded-3xl p-10 text-center">
          <RefreshCw
            className={`w-8 h-8 animate-spin mx-auto mb-3 ${
              isKid ? 'text-[#2EC4B6]' : 'text-[#1B4332] dark:text-[#D4A373]'
            }`}
          />
          <h3 className="text-base font-bold text-[#1B4332] dark:text-white">
            {isKid ? 'جاري تحضير 5 أسئلة جديدة لك...' : 'جاري إعداد 5 أسئلة يومية مخصصة لك...'}
          </h3>
          <p className="text-xs text-[#6B756D] mt-1">أسئلة متجددة لا تتكرر</p>
        </div>
      )}

      {/* Error State */}
      {!loading && errorMsg && (
        <div className="editorial-card rounded-3xl p-8 text-center border-rose-500/30">
          <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-[#1B4332] dark:text-white mb-4">{errorMsg}</p>
          <button
            type="button"
            onClick={() => fetchFreshDailyQuiz(mode, weekNumber)}
            className={`px-6 py-2.5 rounded-2xl text-white font-semibold text-sm ${
              isKid ? 'bg-[#2EC4B6] hover:bg-[#24A99D]' : 'bg-[#1B4332] hover:bg-[#143326]'
            }`}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Active Quiz Card */}
      {!loading && !errorMsg && quizState && !quizState.completed && currentQ && (
        <div className="editorial-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#5C665E] dark:text-gray-300">
              <span className="font-bold text-[#1B4332] dark:text-white tabular-nums">
                السؤال {quizState.currentIndex + 1} من {totalQuestions}
              </span>
              {currentQ.category && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{currentQ.category}</span>
                </>
              )}
            </div>
            <span className="text-xs font-bold text-[#9C6644] dark:text-[#D4A373] tabular-nums">
              {quizState.score} نقطة
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {quizState.questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx < quizState.currentIndex
                    ? isKid
                      ? 'bg-[#2EC4B6]'
                      : 'bg-[#1B4332] dark:bg-[#D4A373]'
                    : idx === quizState.currentIndex
                      ? isKid
                        ? 'bg-[#FF9F1C]'
                        : 'bg-[#D4A373]'
                      : 'bg-black/[0.07] dark:bg-white/10'
                }`}
              />
            ))}
          </div>

          <h3
            className="text-lg sm:text-xl font-bold text-[#1B4332] dark:text-white leading-relaxed"
            dir="rtl"
          >
            {currentQ.questionAr}
          </h3>

          {currentQ.englishContext && currentQ.englishContext.trim() !== '' && (
            <div
              className="p-4 rounded-2xl bg-black/[0.025] dark:bg-white/5 border border-[#E5DEC9] dark:border-white/10 flex items-center justify-between gap-3"
              dir="ltr"
            >
              <p className="text-base font-semibold text-[#1B4332] dark:text-gray-100">
                {currentQ.englishContext}
              </p>
              <button
                type="button"
                onClick={() => speakText(currentQ.englishContext!.replace(/___+/g, 'blank'))}
                className="w-9 h-9 rounded-full bg-white dark:bg-white/10 text-[#1B4332] dark:text-[#D4A373] flex items-center justify-center shrink-0"
                title="استمع للجملة"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              let rowStyle =
                'bg-black/[0.02] dark:bg-white/[0.03] border-[#E5DEC9] dark:border-white/10 text-[#1B4332] dark:text-gray-100 hover:border-[#1B4332]/40';
              if (quizState.isAnswered) {
                if (idx === currentQ.correctIndex) {
                  rowStyle = 'bg-[#1B4332] text-white border-[#1B4332]';
                } else if (idx === quizState.selectedOption) {
                  rowStyle = 'bg-rose-600 text-white border-rose-600';
                } else {
                  rowStyle = 'opacity-50 bg-black/[0.02] dark:bg-white/[0.02] border-[#E5DEC9]';
                }
              }

              return (
                <div
                  key={idx}
                  className={`w-full rounded-2xl border transition-all flex items-center justify-between overflow-hidden ${rowStyle}`}
                  dir="ltr"
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(idx)}
                    disabled={quizState.isAnswered}
                    className="flex-1 p-4 text-left font-semibold text-sm sm:text-base focus:outline-none"
                  >
                    {opt}
                  </button>
                  <button
                    type="button"
                    onClick={() => speakText(opt)}
                    className="p-2.5 mr-2 rounded-xl hover:bg-black/10 text-current shrink-0"
                    title="استمع للنطق"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {quizState.isAnswered && (
            <div className="p-5 rounded-2xl bg-[#1B4332]/[0.05] dark:bg-white/5 border border-[#1B4332]/15 dark:border-white/10">
              <div className="flex items-center gap-2 mb-2">
                {quizState.selectedOption === currentQ.correctIndex ? (
                  <CheckCircle2 className="w-5 h-5 text-[#1B4332] dark:text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <span className="font-bold text-sm text-[#1B4332] dark:text-white">
                  {quizState.selectedOption === currentQ.correctIndex
                    ? 'إجابة صحيحة! أحسنت'
                    : 'إجابة غير صحيحة، إليك التوضيح:'}
                </span>
              </div>
              <p
                className="text-xs sm:text-sm text-[#4F5B53] dark:text-gray-300 leading-relaxed"
                dir="rtl"
              >
                {currentQ.explanation}
              </p>

              <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                {isKid &&
                  quizState.selectedOption !== currentQ.correctIndex &&
                  secondChanceHearts > 0 &&
                  onUseSecondChanceHeart && (
                    <button
                      type="button"
                      onClick={() => {
                        onUseSecondChanceHeart();
                        persistQuizState({
                          ...quizState,
                          selectedOption: null,
                          isAnswered: false
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#FF9F1C] hover:bg-[#E88D14] text-white font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      <span>استخدام فرصة ثانية</span>
                    </button>
                  )}

                <button
                  type="button"
                  onClick={nextQuestion}
                  className={`px-6 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center gap-2 mr-auto ${
                    isKid ? 'bg-[#2EC4B6] hover:bg-[#24A99D]' : 'bg-[#1B4332] hover:bg-[#143326]'
                  }`}
                >
                  <span>
                    {quizState.currentIndex < totalQuestions - 1 ? 'السؤال التالي' : 'إنهاء تحدي اليوم'}
                  </span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completion Card */}
      {!loading && !errorMsg && quizState && quizState.completed && (
        <div className="editorial-card rounded-3xl p-8 text-center space-y-4">
          <div
            className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center ${
              isKid ? 'bg-[#FF9F1C]/15 text-[#D97706]' : 'bg-[#D4A373]/20 text-[#9C6644]'
            }`}
          >
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-[#1B4332] dark:text-white">
            {isKid ? 'أحسنت! أنهيت 5 من 5 أسئلة' : 'رائع! أتممت تحدي اليوم بنجاح (5/5)'}
          </h3>
          <p className="text-sm text-[#5C665E] dark:text-gray-300">
            أجبت بشكل صحيح على{' '}
            <strong className="text-[#1B4332] dark:text-white tabular-nums">
              {quizState.correctCount} من {totalQuestions}
            </strong>{' '}
            وحصدت <strong className="text-[#9C6644] dark:text-[#D4A373] tabular-nums">{quizState.score}</strong> نقطة.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#D4A373]/12 border border-[#D4A373]/30 text-[#7C4D2B] dark:text-[#E9C46A] text-xs font-semibold">
            <Clock className="w-4 h-4 shrink-0" />
            <span>يتجدد تحدي الغد بعد: {formatRemainingTime(quizState.createdAt)}</span>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-[#6B756D]">
            <Star className="w-3.5 h-3.5 text-[#FF9F1C] fill-[#FF9F1C]" />
            <span>
              {isKid
                ? 'يمكنك التحدث مع نجم أو تجربة العدسة الذكية حتى موعد الغد.'
                : 'يتم تتبع تحدي الكبار والصغار بشكل مستقل كل 24 ساعة.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
