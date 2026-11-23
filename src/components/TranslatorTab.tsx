import React, { useState } from 'react';
import {
  AppMode,
  PastTranslationItem,
  TranslationStyle,
  TranslationResult,
  VocabularyWord
} from '../types';
import { speakText } from '../utils/speech';
import {
  Languages,
  Volume2,
  Sparkles,
  X,
  Copy,
  Check,
  Lightbulb,
  History
} from 'lucide-react';

interface TranslatorTabProps {
  mode: AppMode;
  authToken?: string | null;
  onActivity?: (type: 'translation', points: number) => void;
  pastTranslations?: PastTranslationItem[];
  onSaveTranslation?: (item: PastTranslationItem) => void;
  onVocabularySynced?: (vocabulary: VocabularyWord[]) => void;
}

const SAMPLE_CHIPS: Record<TranslationStyle, string[]> = {
  slang: [
    'على راسي والله',
    'كفو عليك يابطل',
    'كفوك الطيب',
    'صح لسانك',
    'صح بدنك',
    'ما عليك زود',
    'بيض الله وجهك',
    'وجهك أبيض'
  ],
  formal: [
    'يسعدني التواصل معكم بشأن الاجتماع القادم',
    'أتقدم بخالص الشكر والتقدير لجهودكم المتميزة',
    'نرجو التكرم بالاطلاع على المرفقات وإفادتنا',
    'يرجى تأكيد الحضور في موعد أقصاه الغد'
  ]
};

export const TranslatorTab: React.FC<TranslatorTabProps> = ({
  mode,
  authToken,
  onActivity,
  pastTranslations = [],
  onSaveTranslation,
  onVocabularySynced
}) => {
  const [style, setStyle] = useState<TranslationStyle>('slang');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const isKid = mode === 'kid';

  const handleTranslate = async (textToTranslate?: string) => {
    const text = textToTranslate !== undefined ? textToTranslate : inputText;
    if (!text.trim()) return;

    if (textToTranslate !== undefined) {
      setInputText(textToTranslate);
    }

    setLoading(true);
    setResult(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, mode, style })
      });
      const data = await res.json();
      setResult(data);
      if (res.ok && data && !data.error) {
        if (Array.isArray(data.vocabulary) && onVocabularySynced) {
          onVocabularySynced(data.vocabulary);
        }
        if (onActivity) {
          onActivity('translation', 10);
        }
        if (onSaveTranslation) {
          onSaveTranslation({
            id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            inputText: text.trim(),
            style,
            result: data,
            timestamp: Date.now()
          });
        }
      }
    } catch (err) {
      console.error('Translation error:', err);
      setResult({
        translation: 'Could not connect to translation server. Please try again.',
        phonetic: '',
        breakdown: [],
        tip: 'Check network connection.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.translation) return;
    navigator.clipboard.writeText(result.translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      {/* Main Translator Card */}
      <div className="editorial-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  isKid
                    ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                    : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
                }`}
              >
                <Languages className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1B4332] dark:text-[#FAF8F5]">
                  {isKid ? 'مترجم رفيق الذكي' : 'مترجم اللهجة والفصحى'}
                </h2>
                <p className="text-xs sm:text-sm text-[#5C665E] dark:text-gray-400 mt-1 leading-relaxed">
                  {isKid
                    ? 'حوّل عباراتك الجميلة إلى جمل إنجليزية صحيحة واستمع لنطقها.'
                    : 'ترجمة دقيقة من اللهجة السعودية والعامية إلى الإنجليزية الحية، أو الفصحى إلى الإنجليزية الرسمية.'}
                </p>
              </div>
            </div>

            {/* Segmented Style Switcher */}
            <div className="bg-black/[0.04] dark:bg-white/5 p-1 rounded-2xl flex items-center gap-1 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setStyle('slang');
                  setResult(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  style === 'slang'
                    ? isKid
                      ? 'bg-[#2EC4B6] text-white shadow-xs'
                      : 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                    : 'text-[#5C665E] dark:text-gray-300 hover:text-[#1B4332]'
                }`}
              >
                عامي · إنجليزي عامي
              </button>
              <button
                type="button"
                onClick={() => {
                  setStyle('formal');
                  setResult(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  style === 'formal'
                    ? isKid
                      ? 'bg-[#2EC4B6] text-white shadow-xs'
                      : 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                    : 'text-[#5C665E] dark:text-gray-300 hover:text-[#1B4332]'
                }`}
              >
                فصحى · إنجليزي رسمي
              </button>
            </div>
          </div>

          {/* Input Text Area */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                style === 'slang'
                  ? 'اكتب عبارة عامية أو سعودية (مثل: على راسي، كفو، ما عليك زود...)'
                  : 'اكتب جملة فصحى رسمية (مثل: يسعدني التواصل معكم...)'
              }
              rows={3}
              className="w-full p-4 pl-12 rounded-2xl bg-black/[0.025] dark:bg-white/5 border border-[#E5DEC9] dark:border-white/10 text-[#1B4332] dark:text-gray-100 placeholder:text-[#8A948C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 text-right resize-none leading-relaxed"
              dir="rtl"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute left-3.5 top-3.5 w-7 h-7 rounded-full bg-black/[0.06] dark:bg-white/10 text-[#5C665E] hover:text-[#1B4332] flex items-center justify-center"
                aria-label="مسح النص"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Row & Quick Suggestions */}
          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-medium text-[#6B756D] dark:text-gray-400">
                عبارات سريعة للتجربة:
              </span>
              <button
                type="button"
                onClick={() => handleTranslate()}
                disabled={loading || !inputText.trim()}
                className={`px-6 py-2.5 rounded-2xl font-semibold text-sm text-white transition-all flex items-center gap-2 active:scale-95 ${
                  loading || !inputText.trim()
                    ? 'bg-gray-300 dark:bg-white/10 cursor-not-allowed'
                    : isKid
                      ? 'bg-[#FF9F1C] hover:bg-[#E88D14]'
                      : 'bg-[#1B4332] hover:bg-[#143326]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'جاري الترجمة...' : 'ترجم الآن'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLE_CHIPS[style].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTranslate(chip)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-medium border transition-colors ${
                    isKid
                      ? 'bg-[#2EC4B6]/10 text-[#1A8A7F] dark:text-[#5EEAD4] border-[#2EC4B6]/25 hover:bg-[#2EC4B6]/20'
                      : 'bg-[#1B4332]/[0.05] dark:bg-white/5 text-[#1B4332] dark:text-[#D4E2D9] border-[#1B4332]/15 dark:border-white/10 hover:bg-[#1B4332]/10'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Translation Result */}
      {result && (
        <div className="editorial-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#1B4332]/[0.08] dark:border-white/10 gap-3 flex-wrap">
            <span className="text-xs font-semibold text-[#5C665E] dark:text-gray-400">
              {style === 'slang' ? 'الترجمة العامية · Slang' : 'الترجمة الرسمية · Formal'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => speakText(result.translation)}
                className={`flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                  isKid ? 'bg-[#2EC4B6] hover:bg-[#24A99D]' : 'bg-[#1B4332] hover:bg-[#143326]'
                }`}
                title="استمع للنطق الصحيح"
              >
                <Volume2 className="w-4 h-4" />
                <span>استمع للنطق</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-xl bg-black/[0.04] dark:bg-white/5 text-[#5C665E] dark:text-gray-300 hover:bg-black/[0.08] transition-colors"
                title="نسخ النص"
              >
                {copied ? <Check className="w-4 h-4 text-[#1B4332]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <h3
              className="text-2xl sm:text-3xl font-bold text-[#1B4332] dark:text-white tracking-tight text-left leading-snug"
              dir="ltr"
            >
              {result.translation}
            </h3>
            {result.phonetic && (
              <p
                className="text-sm font-mono text-[#9C6644] dark:text-[#D4A373] mt-2 text-left"
                dir="ltr"
              >
                /{result.phonetic}/
              </p>
            )}
          </div>

          {result.breakdown && result.breakdown.length > 0 && (
            <div className="pt-5 border-t border-[#1B4332]/[0.08] dark:border-white/10">
              <h4 className="text-xs font-semibold text-[#6B756D] dark:text-gray-400 mb-3">
                تفصيل العبارة ومعانيها
              </h4>
              <div className="divide-y divide-[#1B4332]/[0.06] dark:divide-white/10">
                {result.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="text-right font-medium text-[#1B4332] dark:text-gray-200 text-sm">
                      {item.arabic}
                    </div>
                    <div className="flex items-center gap-2 text-left" dir="ltr">
                      <span className="font-bold text-[#1B4332] dark:text-[#D4A373] text-sm">
                        {item.english}
                      </span>
                      {item.note && (
                        <span className="text-xs text-[#6B756D] dark:text-gray-400">
                          · {item.note}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.tip && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#D4A373]/12 border border-[#D4A373]/30 text-[#5C3D24] dark:text-[#E9C46A] text-xs leading-relaxed">
              <Lightbulb className="w-4 h-4 text-[#C87D55] shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">نصيحة لغوية: </strong>
                {result.tip}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cloud Saved Past Translations */}
      {pastTranslations.length > 0 && (
        <div className="editorial-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold text-[#1B4332] dark:text-white flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#1B4332]/10 dark:bg-white/10 text-[#1B4332] dark:text-[#D4A373] flex items-center justify-center">
                <History className="w-4 h-4" />
              </span>
              <span>سجل الترجمات المحفوظ سحابياً ({pastTranslations.length})</span>
            </h3>
            <span className="text-xs text-[#5C665E] dark:text-gray-400">متزامن</span>
          </div>

          <div className="divide-y divide-[#1B4332]/[0.08] dark:divide-white/10 max-h-72 overflow-y-auto">
            {pastTranslations
              .slice()
              .reverse()
              .slice(0, 15)
              .map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setInputText(item.inputText);
                      setStyle(item.style);
                      setResult(item.result);
                    }}
                    className="flex-1 text-right min-w-0"
                  >
                    <p className="text-xs font-medium text-[#5C665E] dark:text-gray-400 truncate">
                      {item.inputText} · {item.style === 'slang' ? 'عامي' : 'رسمي'}
                    </p>
                    <p
                      className="text-sm font-bold text-[#1B4332] dark:text-white truncate mt-0.5 text-left"
                      dir="ltr"
                    >
                      {item.result.translation}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => speakText(item.result.translation)}
                    className="w-9 h-9 rounded-full bg-black/[0.04] dark:bg-white/5 text-[#1B4332] dark:text-[#D4A373] hover:bg-black/[0.08] flex items-center justify-center shrink-0"
                    title="استمع للنطق"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
