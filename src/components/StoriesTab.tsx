import React, { useEffect, useState } from 'react';
import { CloudUser, KnowledgeStory, StoryKind } from '../types';
import { speakText } from '../utils/speech';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Crown,
  HelpCircle,
  PlusCircle,
  RefreshCw,
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
      setSuccessMsg('تم التحقق من المحتوى ونشر ستوري المعرفة بنجاح.');
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
          [storyId]: { correct: false, message: data.error || 'تعذر تنفيذ التحدي.' }
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
            ? `إجابة صحيحة! ربحت +${data.xpDelta} XP`
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      {/* Header Banner */}
      <div className="editorial-card rounded-3xl p-6 sm:p-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373] flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1B4332] dark:text-[#FAF8F5]">
              ستوري المعرفة واكتساب الخبرة
            </h2>
            <p className="text-xs sm:text-sm text-[#5C665E] dark:text-gray-400 mt-1">
              شارك كلمات إنجليزية جديدة أو أسئلة تحدي بـ XP تحت الإشراف التعليمي الذكي.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowComposer((v) => !v)}
          className="min-h-[42px] px-4 py-2 rounded-2xl bg-[#1B4332] hover:bg-[#143326] text-[#FAF8F5] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{showComposer ? 'إخفاء النشر' : 'نشر ستوري جديد'}</span>
        </button>
      </div>

      {/* Story Composer */}
      {showComposer && (
        <form onSubmit={handlePublish} className="editorial-card rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="bg-black/[0.04] dark:bg-white/5 p-1 rounded-2xl inline-flex gap-1">
            <button
              type="button"
              onClick={() => {
                setKind('word');
                setModerationWarning(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                kind === 'word'
                  ? 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                  : 'text-[#5C665E] dark:text-gray-300'
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
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                kind === 'quiz'
                  ? 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                  : 'text-[#5C665E] dark:text-gray-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>سؤال تحدي + XP</span>
            </button>
          </div>

          {moderationWarning && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-semibold flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{moderationWarning}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-[#1B4332]/[0.06] border border-[#1B4332]/20 text-[#1B4332] dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1B4332] dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {kind === 'word' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3C4A40] dark:text-gray-300 mb-1.5">
                    الكلمة أو التعبير الإنجليزي
                  </label>
                  <input
                    type="text"
                    value={englishTerm}
                    onChange={(e) => setEnglishTerm(e.target.value)}
                    placeholder="Break a leg / Ubiquitous"
                    required
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.025] dark:bg-white/5 border border-[#E5DEC9] dark:border-white/10 text-sm font-semibold text-left focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C4A40] dark:text-gray-300 mb-1.5">
                    المعنى بالعربية
                  </label>
                  <input
                    type="text"
                    value={arabicMeaning}
                    onChange={(e) => setArabicMeaning(e.target.value)}
                    placeholder="بالتوفيق! / منتشر في كل مكان"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.025] dark:bg-white/5 border border-[#E5DEC9] dark:border-white/10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C4A40] dark:text-gray-300 mb-1.5">
                  مثال في جملة إنجليزية (اختياري)
                </label>
                <input
                  type="text"
                  value={exampleSentence}
                  onChange={(e) => setExampleSentence(e.target.value)}
                  placeholder="Break a leg in your interview today!"
                  dir="ltr"
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.025] dark:bg-white/5 border border-[#E5DEC9] dark:border-white/10 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3C4A40] dark:text-gray-300 mb-1.5">
                  نص السؤال التعليمي
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="ما معنى المصطلح الإنجليزي 'Call it a day'؟"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.025] dark:bg-white/5 border border-[#E5DEC9] dark:border-white/10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C4A40] dark:text-gray-300 mb-2">
                  الخيارات الـ 4 (حدد الإجابة الصحيحة)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctStoryOption"
                        checked={correctIndex === idx}
                        onChange={() => setCorrectIndex(idx)}
                        className="w-4 h-4 accent-[#1B4332] shrink-0"
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
                        className="flex-1 px-3.5 py-2 rounded-xl bg-black/[0.025] dark:bg-white/5 border border-[#E5DEC9] dark:border-white/10 text-xs sm:text-sm font-medium text-left focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-[#3C4A40] dark:text-gray-300 mb-1.5">
                    شرح قصير للإجابة (اختياري)
                  </label>
                  <input
                    type="text"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="تعني التوقف عن العمل لهذا اليوم"
                    className="w-full px-4 py-2 rounded-xl bg-black/[0.025] dark:bg-white/5 border border-[#E5DEC9] dark:border-white/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C4A40] dark:text-gray-300 mb-1.5">
                    قيمة تحدي الخبرة (XP)
                  </label>
                  <div className="flex gap-2">
                    {[5, 10, 20].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setXpBet(val)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all tabular-nums ${
                          xpBet === val
                            ? 'bg-[#D4A373]/20 border-[#D4A373] text-[#7C4D2B] dark:text-[#E9C46A]'
                            : 'bg-black/[0.025] dark:bg-white/5 border-[#E5DEC9] dark:border-white/10 text-[#5C665E] dark:text-gray-300'
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
            className="w-full min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#1B4332] hover:bg-[#143326] disabled:bg-gray-400 text-[#FAF8F5] font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
            <span>
              {submitting
                ? 'جاري الفحص الأمني بالذكاء الاصطناعي...'
                : 'فحص بالذكاء الاصطناعي ونشر الستوري'}
            </span>
          </button>
        </form>
      )}

      {/* Stories Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1B4332] dark:text-gray-200 tabular-nums">
            أحدث ستوريات المعرفة ({stories.length})
          </h3>
          <button
            type="button"
            onClick={fetchStories}
            className="text-xs font-semibold text-[#1B4332] dark:text-[#D4A373] flex items-center gap-1.5 hover:underline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>

        {loading && (
          <div className="editorial-card rounded-3xl p-8 text-center text-sm text-[#6B756D]">
            جاري تحميل ستوري المعرفة...
          </div>
        )}

        {!loading && stories.length === 0 && (
          <div className="editorial-card rounded-3xl p-8 text-center">
            <BookOpen className="w-8 h-8 text-[#8A948C] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#3C4A40] dark:text-gray-300">
              لا توجد ستوريات منشورة بعد.
            </p>
            <p className="text-xs text-[#6B756D] mt-1">
              كن أول من ينشر كلمة إنجليزية جديدة أو سؤال تحدي بـ XP.
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
                className={`editorial-card hover-scale rounded-3xl p-6 ${
                  story.authorGoldenVip ? 'border-[#D4A373]' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#1B4332]/[0.08] dark:border-white/10">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-sm text-[#1B4332] dark:text-white">
                      {story.authorUsername}
                    </span>
                    {story.authorGoldenVip && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9C6644] dark:text-[#E9C46A]">
                        <Crown className="w-3.5 h-3.5 text-[#D4A373]" />
                        <span>VIP</span>
                      </span>
                    )}
                    <span aria-hidden="true" className="text-[#8A948C]">
                      ·
                    </span>
                    <span className="text-[#5C665E] dark:text-gray-400">
                      {story.authorRole.nameAr}
                    </span>
                  </div>

                  {story.kind === 'quiz' ? (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#9C6644] dark:text-[#D4A373] tabular-nums"
                      dir="ltr"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{story.xpBet} XP</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-[#1B4332] dark:text-[#D4A373]">
                      كلمة / تعبير جديد
                    </span>
                  )}
                </div>

                {story.kind === 'word' ? (
                  <div>
                    <div className="flex items-center justify-between gap-3" dir="ltr">
                      <h4 className="text-xl font-bold text-[#1B4332] dark:text-white">
                        {story.englishTerm}
                      </h4>
                      <button
                        type="button"
                        onClick={() => speakText(story.englishTerm || '')}
                        className="w-9 h-9 rounded-full bg-[#1B4332]/10 dark:bg-white/10 text-[#1B4332] dark:text-[#D4A373] hover:bg-[#1B4332]/15 flex items-center justify-center shrink-0"
                        title="استمع للنطق"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-[#4F5B53] dark:text-gray-300 mt-1">
                      {story.arabicMeaning}
                    </p>
                    {story.exampleSentence && (
                      <p
                        className="mt-3 pt-3 border-t border-[#1B4332]/[0.06] dark:border-white/10 text-xs sm:text-sm text-[#5C665E] dark:text-gray-300 text-left"
                        dir="ltr"
                      >
                        "{story.exampleSentence}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="text-base font-bold text-[#1B4332] dark:text-white mb-4">
                      {story.question}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(story.options || []).map((opt, idx) => {
                        const revealedIdx =
                          feedback?.correctIndex ??
                          (isAuthor || alreadyAnswered ? story.correctIndex : undefined);
                        const isCorrectOption = revealedIdx === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={isAuthor || alreadyAnswered}
                            onClick={() => handleBetAnswer(story.id, idx)}
                            dir="ltr"
                            className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all ${
                              isCorrectOption
                                ? 'bg-[#1B4332] text-white border-[#1B4332]'
                                : isAuthor || alreadyAnswered
                                  ? 'bg-black/[0.02] dark:bg-white/[0.02] border-[#E5DEC9] dark:border-white/10 text-[#7A847C]'
                                  : 'bg-black/[0.02] dark:bg-white/[0.03] border-[#E5DEC9] dark:border-white/10 text-[#1B4332] dark:text-gray-100 hover:border-[#1B4332]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {isAuthor && (
                      <p className="text-[11px] font-medium text-[#7A847C] mt-3">
                        هذا سؤالك الخاص (لا يمكنك المراهنة عليه).
                      </p>
                    )}

                    {!isAuthor && alreadyAnswered && !feedback && (
                      <p className="text-[11px] font-semibold text-[#1B4332] dark:text-emerald-300 mt-3">
                        سبق أن أجبت على هذا التحدي.
                      </p>
                    )}

                    {feedback && (
                      <div
                        className={`mt-3 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                          feedback.correct
                            ? 'bg-[#1B4332]/[0.08] text-[#1B4332] dark:text-emerald-300 border border-[#1B4332]/20'
                            : 'bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/25'
                        }`}
                      >
                        {feedback.correct ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 shrink-0" />
                        )}
                        <span>{feedback.message}</span>
                      </div>
                    )}

                    {story.explanation && (isAuthor || alreadyAnswered || feedback) && (
                      <p className="text-xs text-[#5C665E] dark:text-gray-400 mt-3">
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
    </div>
  );
};
