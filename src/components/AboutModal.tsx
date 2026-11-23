import React from 'react';
import { Feather, Languages, Sparkles, X } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isKid?: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  isKid = false
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1B4332]/35 dark:bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border relative text-right ${
          isKid
            ? 'bg-[#FFFDF7] dark:bg-[#1E1A16] border-[#EFE5D1] dark:border-white/10'
            : 'bg-[#FAF8F5] dark:bg-[#161E1A] border-[#E5DEC9] dark:border-white/10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-5 top-5 w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 text-[#5C665E] dark:text-gray-300 hover:text-[#1B4332] dark:hover:text-white flex items-center justify-center transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3.5 ${
              isKid
                ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
            }`}
          >
            <Languages className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-[#1B4332] dark:text-[#FAF8F5]">
            رفيق الإنجليزية
          </h3>
          <p className="text-xs font-medium text-[#6B756D] dark:text-gray-400 mt-1">
            بيئة تعلّم لغوية مصممة بعناية للكبار والصغار
          </p>
        </div>

        <div className="space-y-4 text-sm leading-relaxed mb-6">
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/5 border border-[#E8E2D9] dark:border-white/10">
            <h4 className="font-bold text-[#1B4332] dark:text-[#FAF8F5] mb-1.5 flex items-center gap-2 text-xs">
              <span
                className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${
                  isKid ? 'bg-[#FF9F1C]/15 text-[#D97706]' : 'bg-[#D4A373]/20 text-[#9C6644] dark:text-[#D4A373]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span>رؤية التطبيق</span>
            </h4>
            <p className="text-xs text-[#4F5B53] dark:text-gray-300 leading-relaxed">
              توفير تجربة تعليمية هادئة وفعّالة تجمع بين ترجمة اللهجة السعودية والفصحى، التعرف البصري بالعدسة الذكية، المحادثة التفاعلية، والتكرار المتباعد المحفوظ سحابياً.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/80 dark:bg-white/5 border border-[#E8E2D9] dark:border-white/10 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9C6644] dark:text-[#D4A373] mb-1">
              <Feather className="w-3.5 h-3.5" />
              <span>إشراف وتطوير</span>
            </div>
            <h4 className="text-base font-bold text-[#1B4332] dark:text-[#FAF8F5]">
              باسمة حسين محرق
            </h4>
            <p className="text-[11px] text-[#6B756D] dark:text-gray-400 mt-0.5 tabular-nums">
              جميع الحقوق محفوظة © 2026
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`w-full min-h-[44px] rounded-2xl text-white font-semibold text-sm transition-all active:scale-[0.99] ${
            isKid
              ? 'bg-[#2EC4B6] hover:bg-[#25A99D]'
              : 'bg-[#1B4332] hover:bg-[#143326]'
          }`}
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};
