import React, { useState } from 'react';
import { AppMode, PastTranslationItem, TranslationStyle, TranslationResult } from '../types';
import { speakText } from '../utils/speech';
import { Languages, Volume2, Sparkles, X, Copy, Check, Lightbulb, History } from 'lucide-react';

interface TranslatorTabProps {
  mode: AppMode;
  onActivity?: (type: 'translation', points: number) => void;
  pastTranslations?: PastTranslationItem[];
  onSaveTranslation?: (item: PastTranslationItem) => void;
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
  onActivity,
  pastTranslations = [],
  onSaveTranslation
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
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode, style })
      });
      const data = await res.json();
      setResult(data);
      if (res.ok && data && !data.error) {
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
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28">
      
      {/* Title & Style Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-md border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
              <Languages className={`w-6 h-6 ${isKid ? 'text-rose-500' : 'text-[#2D6A4F]'}`} />
              <span>{isKid ? 'مترجم رفيق السحري 🪄' : 'مترجم اللهجة والفصحى الذكي'}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isKid 
                ? 'حول كلامك الجميل إلى جمل إنجليزية رائعة ومضحكة!' 
                : 'ترجمة فورية من اللهجة السعودية والعامية إلى الإنجليزية الحية، أو الفصحى إلى الإنجليزية الرسمية.'}
            </p>
          </div>

          {/* Style Switcher */}
          <div className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded-2xl flex items-center gap-1 self-start sm:self-auto">
            <button
              onClick={() => { setStyle('slang'); setResult(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                style === 'slang'
                  ? isKid ? 'bg-rose-500 text-white shadow' : 'bg-[#2D6A4F] text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              عامي ➔ إنجليزي عامي
            </button>
            <button
              onClick={() => { setStyle('formal'); setResult(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                style === 'formal'
                  ? isKid ? 'bg-rose-500 text-white shadow' : 'bg-[#2D6A4F] text-white shadow'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              فصحى ➔ إنجليزي رسمي
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
            className="w-full p-4 pl-12 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-right resize-none"
            dir="rtl"
          />
          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 bg-gray-200 dark:bg-gray-800 p-1 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons & Quick Chips */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-gray-400">عبارات مقترحة سريعة:</span>
            <button
              onClick={() => handleTranslate()}
              disabled={loading || !inputText.trim()}
              className={`px-6 py-2.5 rounded-2xl font-bold text-sm text-white shadow-md transition-all flex items-center gap-2 ${
                loading || !inputText.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isKid
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-90'
                    : 'bg-[#2D6A4F] hover:bg-[#1b4332]'
              }`}
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>{loading ? 'جاري الترجمة...' : 'ترجم الآن'}</span>
            </button>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mt-1">
            {SAMPLE_CHIPS[style].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleTranslate(chip)}
                className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300 px-3 py-1.5 rounded-full font-medium border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Translation Result Card */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-emerald-100 dark:border-emerald-900 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-[#2D6A4F] dark:text-emerald-200">
                {style === 'slang' ? 'إنجليزي عامي (Slang)' : 'إنجليزي رسمي (Formal)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => speakText(result.translation)}
                className="flex items-center gap-1.5 bg-[#2D6A4F] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#1b4332] shadow transition-transform active:scale-95"
                title="استمع للنطق الصحيح"
              >
                <Volume2 className="w-4 h-4" />
                <span>استمع نطقاً</span>
              </button>
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                title="نسخ النص"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="py-6">
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-wide mb-2 text-left" dir="ltr">
              {result.translation}
            </h3>
            {result.phonetic && (
              <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 text-left" dir="ltr">
                Phonetic: /{result.phonetic}/
              </p>
            )}
          </div>

          {/* Breakdown items */}
          {result.breakdown && result.breakdown.length > 0 && (
            <div className="mt-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">تحليل العبارة:</h4>
              <div className="space-y-2">
                {result.breakdown.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                    <div className="text-right font-medium text-gray-800 dark:text-gray-200 text-sm">
                      {item.arabic}
                    </div>
                    <div className="flex items-center gap-3 text-left" dir="ltr">
                      <span className="font-bold text-[#2D6A4F] dark:text-emerald-300 text-sm">{item.english}</span>
                      {item.note && <span className="text-xs text-gray-400">({item.note})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tip */}
          {result.tip && (
            <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
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
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" />
              <span>سجل الترجمات المحفوظ سحابياً ({pastTranslations.length})</span>
            </h3>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              متزامن عبر أجهزتك
            </span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
            {pastTranslations
              .slice()
              .reverse()
              .slice(0, 15)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3"
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
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
                      {item.inputText} · {item.style === 'slang' ? 'عامي' : 'رسمي'}
                    </p>
                    <p
                      className="text-sm font-extrabold text-gray-900 dark:text-white truncate mt-0.5 text-left"
                      dir="ltr"
                    >
                      {item.result.translation}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => speakText(item.result.translation)}
                    className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#2D6A4F] dark:text-emerald-400 hover:bg-emerald-50 shrink-0"
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
