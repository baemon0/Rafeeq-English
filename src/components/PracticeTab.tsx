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
  TrendingUp
} from 'lucide-react';

interface PracticeTabProps {
  mode: AppMode;
  onActivity: (type: 'challenge', points: number) => void;
  cloudProfile?: ModeCloudProfile;
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
    // Fallback to clean initialization
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
  const daysElapsed = Math.max(0, Math.floor((Date.now() - tracker.firstUsedDate) / TWENTY_FOUR_HOURS_MS));
  const weekByTime = Math.floor(daysElapsed / 7) + 1;
  const weekByMilestones = Math.floor(tracker.completedDailySets / 7) + 1;
  return Math.max(1, weekByTime, weekByMilestones);
}

function getWeekBadgeInfo(weekNumber: number, isKid: boolean): { badgeLabel: string; focusLabel: string } {
  if (weekNumber === 1) {
    return {
      badgeLabel: 'الأسبوع 1 - مبتدئ',
      focusLabel: isKid
        ? 'كلمات أساسية، ألوان، وأشياء يومية بسيطة'
        : 'عبارات المحادثة اليومية والتعبيرات الشائعة'
    };
  }
  if (weekNumber === 2) {
    return {
      badgeLabel: isKid ? 'الأسبوع 2 - متطور' : 'الأسبوع 2 - متوسط',
      focusLabel: isKid
        ? 'عبارات قصيرة من 3 كلمات وأفعال يومية'
        : 'مواقف العمل والسفر والعامية الذكية'
    };
  }
  return {
    badgeLabel: isKid ? `الأسبوع ${weekNumber} - مستكشف متقدم` : `الأسبوع ${weekNumber} - متقدم`,
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

function saveAskedHistory(mode: AppMode, newQuestions: PracticeQuestion[]): void {
  try {
    const existing = loadAskedHistory(mode);
    const additions = newQuestions.map((q) => q.questionAr.trim()).filter(Boolean);
    const merged = Array.from(new Set([...existing, ...additions])).slice(-200);
    localStorage.setItem(getHistoryStorageKey(mode), JSON.stringify(merged));
  } catch (err) {
    console.warn('Could not save asked history:', err);
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
        // Ignore storage quota errors
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
      // Ignore corrupt localStorage and regenerate
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
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-6 text-center">
        <div
          className={`inline-flex p-3 rounded-2xl mb-3 shadow-inner ${
            isKid
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F]'
          }`}
        >
          <Trophy className="w-8 h-8 animate-bounce" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">
          {isKid ? 'ألعاب وتحديات النجوم اليومية 🏆' : 'التحدي اليومي للكبار (5 أسئلة)'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isKid
            ? '5 أسئلة ممتعة وجديدة كل يوم! أجب واجمع النجوم يا بطل.'
            : '5 أسئلة ذكية ومتجددة يومياً في التعبيرات الشائعة، بيئة العمل، والسفر.'}
        </p>

        {/* Weekly Progressive Difficulty Badge */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col items-center gap-1.5">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-extrabold border ${
              isKid
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : 'bg-emerald-50 text-[#2D6A4F] border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{badgeLabel}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {focusLabel} • تقدم الأسبوع: {milestoneProgress}/7 تحديات
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center shadow-xl border border-gray-100 dark:border-gray-700 animate-pulse">
          <RefreshCw
            className={`w-10 h-10 animate-spin mx-auto mb-3 ${
              isKid ? 'text-rose-500' : 'text-[#2D6A4F]'
            }`}
          />
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            {isKid ? 'جاري تحضير 5 أسئلة سحرية جديدة لك...' : 'جاري إعداد 5 أسئلة يومية مخصصة لك...'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">أسئلة متجددة لا تتكرر بالذكاء الاصطناعي</p>
        </div>
      )}

      {/* Error State */}
      {!loading && errorMsg && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-xl border border-rose-200">
          <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-800 dark:text-white mb-4">{errorMsg}</p>
          <button
            onClick={() => fetchFreshDailyQuiz(mode, weekNumber)}
            className={`px-6 py-2.5 rounded-2xl text-white font-bold text-sm shadow ${
              isKid ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#2D6A4F] hover:bg-[#1b4332]'
            }`}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Active Quiz Card */}
      {!loading && !errorMsg && quizState && !quizState.completed && currentQ && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
          {/* Progress Header (1/5 to 5/5) */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  isKid ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-[#2D6A4F]'
                }`}
              >
                {quizState.currentIndex + 1} / {totalQuestions}
              </span>
              {currentQ.category && (
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  • {currentQ.category}
                </span>
              )}
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
              النقاط: {quizState.score} XP
            </span>
          </div>

          {/* Visual 5-step progress bar */}
          <div className="grid grid-cols-5 gap-1.5 mb-6">
            {quizState.questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx < quizState.currentIndex
                    ? isKid
                      ? 'bg-rose-500'
                      : 'bg-[#2D6A4F]'
                    : idx === quizState.currentIndex
                      ? isKid
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Question Prompt */}
          <h3
            className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 leading-relaxed"
            dir="rtl"
          >
            {currentQ.questionAr}
          </h3>

          {/* Optional English Context / Fill-in-the-blank Card */}
          {currentQ.englishContext && currentQ.englishContext.trim() !== '' && (
            <div
              className="mb-5 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3"
              dir="ltr"
            >
              <p className="text-base font-bold text-gray-800 dark:text-gray-100">
                {currentQ.englishContext}
              </p>
              <button
                type="button"
                onClick={() => speakText(currentQ.englishContext!.replace(/___+/g, 'blank'))}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 text-[#2D6A4F] shadow-sm hover:bg-emerald-50 shrink-0"
                title="استمع للجملة"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              let rowStyle =
                'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-emerald-50 dark:hover:bg-gray-800';
              if (quizState.isAnswered) {
                if (idx === currentQ.correctIndex) {
                  rowStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md';
                } else if (idx === quizState.selectedOption) {
                  rowStyle = 'bg-rose-500 text-white border-rose-600 shadow-md';
                } else {
                  rowStyle = 'opacity-50 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800';
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
                    className="flex-1 p-4 text-left font-bold text-sm sm:text-base focus:outline-none"
                  >
                    {opt}
                  </button>
                  <button
                    type="button"
                    onClick={() => speakText(opt)}
                    className="p-2.5 mr-2 rounded-xl bg-white/25 hover:bg-white/40 text-current shrink-0"
                    title="استمع للنطق"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Explanation & Next */}
          {quizState.isAnswered && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center gap-2 mb-2">
                {quizState.selectedOption === currentQ.correctIndex ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <span className="font-bold text-sm text-gray-800 dark:text-white">
                  {quizState.selectedOption === currentQ.correctIndex
                    ? 'إجابة صحيحة! أحسنت 🌟'
                    : 'إجابة غير صحيحة، تعلّم من الشرح!'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed" dir="rtl">
                {currentQ.explanation}
              </p>

              <button
                type="button"
                onClick={nextQuestion}
                className={`mt-4 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow flex items-center gap-2 mr-auto ${
                  isKid ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#2D6A4F] hover:bg-[#1b4332]'
                }`}
              >
                <span>
                  {quizState.currentIndex < totalQuestions - 1 ? 'السؤال التالي' : 'إنهاء تحدي اليوم'}
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Daily Completion Card */}
      {!loading && !errorMsg && quizState && quizState.completed && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-xl border border-amber-200 dark:border-amber-900">
          <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            {isKid ? 'بطل اليوم! أنهيت 5 من 5 أسئلة 🎉' : 'رائع! أتممت تحدي اليوم بنجاح (5/5) 🎉'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            أجبت بشكل صحيح على{' '}
            <strong className={isKid ? 'text-rose-600' : 'text-[#2D6A4F]'}>
              {quizState.correctCount} من {totalQuestions}
            </strong>{' '}
            وحصدت <strong className="text-amber-600">{quizState.score} XP</strong>!
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold mb-4">
            <Clock className="w-4 h-4" />
            <span>تحدي الغد الجديد (5 أسئلة غير مكررة) يتجدد بعد: {formatRemainingTime(quizState.createdAt)}</span>
          </div>

          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>
              {isKid
                ? 'يمكنك تجربة تحدي الكبار أو محادثة نجم حتى موعد أسئلة الغد!'
                : 'يتم تتبع تحدي الكبار والصغار بشكل مستقل كل 24 ساعة.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
