import React, { useEffect, useState } from 'react';
import { CloudUser, KnowledgeStory, StoryKind } from '../types';
import { hasActiveEnchantedItem } from '../data/avatarCatalog';
import { speakText } from '../utils/speech';
import { PixelAvatar } from './PixelAvatar';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Volume2,
  XCircle,
  Zap
} from 'lucide-react';

interface StoriesTabProps {
  authToken: string | null;
  currentUser: CloudUser;
  onUserUpdated: (updatedUser: CloudUser) => void;
}

export const StoriesTab: React.FC<StoriesTabProps> = ({
  authToken,
  currentUser,
  onUserUpdated
}) => {
  const [stories, setStories] = useState<KnowledgeStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(true);

  const [kind, setKind] = useState<StoryKind>('word');
  const [englishTerm, setEnglishTerm] = useState('');
  const [arabicMeaning, setArabicMeaning] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [explanation, setExplanation] = useState('');
  const [xpBet, setXpBet] = useState<number>(10);

  const [submitting, setSubmitting] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [betFeedback, setBetFeedback] = useState<
    Record<string, { correct: boolean; message: string; correctIndex?: number }>
  >({});

  const fetchStories = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stories', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.stories)) {
        setStories(data.stories);
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [authToken]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setModerationWarning(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(
          kind === 'word'
            ? {
                mode: 'adult',
                kind: 'word',
                englishTerm,
                arabicMeaning,
                exampleSentence
              }
            : {
                mode: 'adult',
                kind: 'quiz',
                question,
                options,
                correctIndex,
                explanation,
                xpBet
              }
        )
      });
      const data = await res.json();
      if (!res.ok) {
        setModerationWarning(
          data.error ||
            'ممنوع نشر السب أو الكلام العشوائي! يُسمح فقط بالكلمات الإنجليزية الجديدة أو الأسئلة التعليمية'
        );
        return;
      }

      if (data.story) {
        setStories((prev) => [data.story, ...prev]);
      }
      setEnglishTerm('');
      setArabicMeaning('');
      setExampleSentence('');
      setQuestion('');
      setOptions(['', '', '', '']);
      setCorrectIndex(0);
      setExplanation('');
      setSuccessMsg('تم التحقق من المحتوى ونشر ستوري المعرفة بنجاح!');
    } catch {
      setModerationWarning('تعذر الاتصال بالخادم لفحص المحتوى، يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBetAnswer = async (storyId: string, selectedIdx: number) => {
    if (!authToken) return;
    setModerationWarning(null);
    try {
      const res = await fetch(`/api/stories/${storyId}/bet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ selectedIndex: selectedIdx })
      });
      const data = await res.json();
      if (!res.ok) {
        setBetFeedback((prev) => ({
          ...prev,
          [storyId]: { correct: false, message: data.error || 'تعذر تنفيذ الرهان.' }
        }));
        return;
      }

      if (data.user) {
        onUserUpdated(data.user);
      }
      if (data.story) {
        setStories((prev) => prev.map((s) => (s.id === storyId ? data.story : s)));
      }
      setBetFeedback((prev) => ({
        ...prev,
        [storyId]: {
          correct: Boolean(data.correct),
          correctIndex: data.correctIndex,
          message: data.correct
            ? `إجابة صحيحة! ربحت +${data.xpDelta} XP 🎉`
            : `إجابة خاطئة! تم خصم ${Math.abs(data.xpDelta)} XP`
        }
      }));
    } catch {
      setBetFeedback((prev) => ({
        ...prev,
        [storyId]: { correct: false, message: 'حدث خطأ أثناء الاتصال بالخادم.' }
      }));
    }
  };

  const viewerLower = currentUser.username.toLowerCase();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] shadow-inner">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white">
                ستوري المعرفة ورهان الخبرة
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                شارك كلمات إنجليزية جديدة أو تحديات بـ XP تحت رقابة الذكاء الاصطناعي الصارمة.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowComposer((v) => !v)}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1b4332] text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showComposer ? 'إخفاء النشر' : 'نشر ستوري جديد'}</span>
          </button>
        </div>
      </div>

      {/* Story Composer */}
      {showComposer && (
        <form
          onSubmit={handlePublish}
          className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-6"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
            <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl inline-flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setKind('word');
                  setModerationWarning(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  kind === 'word'
                    ? 'bg-[#2D6A4F] text-white shadow'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>كلمة / تعبير جديد</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setKind('quiz');
                  setModerationWarning(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  kind === 'quiz'
                    ? 'bg-[#2D6A4F] text-white shadow'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>سؤال تحدي + رهان XP</span>
              </button>
            </div>

            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>محمي بفلتر الذكاء الاصطناعي</span>
            </span>
          </div>

          {moderationWarning && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-bold flex items-start gap-2.5"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{moderationWarning}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {kind === 'word' ? (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    الكلمة أو التعبير الإنجليزي
                  </label>
                  <input
                    type="text"
                    value={englishTerm}
                    onChange={(e) => setEnglishTerm(e.target.value)}
                    placeholder="مثال: Break a leg / Ubiquitous"
                    required
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold text-left focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    المعنى بالعربية
                  </label>
                  <input
                    type="text"
                    value={arabicMeaning}
                    onChange={(e) => setArabicMeaning(e.target.value)}
                    placeholder="مثال: بالتوفيق! / منتشر في كل مكان"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  مثال في جملة إنجليزية (اختياري)
                </label>
                <input
                  type="text"
                  value={exampleSentence}
                  onChange={(e) => setExampleSentence(e.target.value)}
                  placeholder="مثال: Break a leg in your interview today!"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                  نص السؤال التعليمي
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="مثال: ما معنى المصطلح الإنجليزي 'Call it a day'؟"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  الخيارات الـ 4 (اختر الإجابة الصحيحة بجانبها):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctStoryOption"
                        checked={correctIndex === idx}
                        onChange={() => setCorrectIndex(idx)}
                        className="w-4 h-4 accent-[#2D6A4F] shrink-0"
                        title="حدد كإجابة صحيحة"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...options];
                          next[idx] = e.target.value;
                          setOptions(next);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        required
                        dir="ltr"
                        className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-semibold text-left focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    شرح قصير للإجابة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="تعني التوقف عن العمل لهذا اليوم"
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    قيمة رهان الخبرة (XP Bet):
                  </label>
                  <div className="flex gap-2">
                    {[5, 10, 20].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setXpBet(val)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                          xpBet === val
                            ? 'bg-amber-100 border-amber-400 text-amber-900'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                        dir="ltr"
                      >
                        {val} XP
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#2D6A4F] hover:bg-[#1b4332] disabled:bg-gray-400 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
            <span>
              {submitting ? 'جاري الفحص الأمني بالذكاء الاصطناعي...' : 'فحص بالذكاء الاصطناعي ونشر الستوري'}
            </span>
          </button>
        </form>
      )}

      {/* Stories Feed */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-gray-700 dark:text-gray-200">
          أحدث ستوريات المعرفة ({stories.length})
        </h3>
        <button
          type="button"
          onClick={fetchStories}
          className="text-xs font-bold text-[#2D6A4F] dark:text-emerald-400 flex items-center gap-1 hover:underline"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center text-sm text-gray-500 animate-pulse">
          جاري تحميل ستوري المعرفة...
        </div>
      )}

      {!loading && stories.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center border border-gray-100 dark:border-gray-700">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
            لا توجد ستوريات منشورة بعد.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            كن أول من ينشر كلمة إنجليزية جديدة أو سؤال تحدي بـ XP!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {stories.map((story) => {
          const isAuthor = story.authorId === currentUser.id;
          const alreadyAnswered = Object.prototype.hasOwnProperty.call(
            story.answeredBy || {},
            viewerLower
          );
          const feedback = betFeedback[story.id];

          return (
            <div
              key={story.id}
              className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              {/* Story Author Header */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="p-0.5 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shrink-0">
                    <PixelAvatar config={story.authorAvatar} size={36} className="rounded-lg overflow-hidden" />
                  </div>
                  <span className="font-black text-sm text-gray-900 dark:text-white">
                    {story.authorUsername}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold whitespace-nowrap ${story.authorRole.pillClass}`}
                    dir="ltr"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${story.authorRole.dotClass}`} />
                    <span>{story.authorRole.nameEn}</span>
                  </span>
                  {hasActiveEnchantedItem(story.authorAvatar) && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 text-white text-[9px] font-black shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>مطور</span>
                    </span>
                  )}
                </div>

                {story.kind === 'quiz' ? (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-black text-amber-700 dark:text-amber-300"
                    dir="ltr"
                  >
                    <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Bet {story.xpBet} XP</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#2D6A4F] dark:text-emerald-400">
                    كلمة / تعبير جديد
                  </span>
                )}
              </div>

              {story.kind === 'word' ? (
                <div>
                  <div className="flex items-center justify-between gap-3" dir="ltr">
                    <h4 className="text-xl font-black text-gray-900 dark:text-white">
                      {story.englishTerm}
                    </h4>
                    <button
                      type="button"
                      onClick={() => speakText(story.englishTerm || '')}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300 hover:bg-emerald-100 shrink-0"
                      title="استمع للنطق"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-[#2D6A4F] dark:text-emerald-400 mt-1">
                    {story.arabicMeaning}
                  </p>
                  {story.exampleSentence && (
                    <p
                      className="mt-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 text-xs sm:text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 text-left"
                      dir="ltr"
                    >
                      "{story.exampleSentence}"
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h4 className="text-base font-extrabold text-gray-900 dark:text-white mb-3">
                    {story.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(story.options || []).map((opt, idx) => {
                      const revealedIdx =
                        feedback?.correctIndex ?? (isAuthor || alreadyAnswered ? story.correctIndex : undefined);
                      const isCorrectOption = revealedIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isAuthor || alreadyAnswered}
                          onClick={() => handleBetAnswer(story.id, idx)}
                          dir="ltr"
                          className={`p-3 rounded-2xl border text-left text-xs sm:text-sm font-bold transition-all ${
                            isCorrectOption
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : isAuthor || alreadyAnswered
                                ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500'
                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:border-[#2D6A4F] hover:bg-emerald-50/40'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {isAuthor && (
                    <p className="text-[11px] font-bold text-gray-400 mt-2.5">
                      هذا سؤالك الخاص (لا يمكنك المراهنة عليه).
                    </p>
                  )}

                  {!isAuthor && alreadyAnswered && !feedback && (
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-2.5">
                      سبق أن أجبت على هذا التحدي.
                    </p>
                  )}

                  {feedback && (
                    <div
                      className={`mt-3 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                        feedback.correct
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {feedback.correct ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{feedback.message}</span>
                    </div>
                  )}

                  {story.explanation && (isAuthor || alreadyAnswered || feedback) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      الشرح: {story.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
