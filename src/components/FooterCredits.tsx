import React, { useState } from 'react';
import { Feather } from 'lucide-react';
import { AboutModal } from './AboutModal';

interface FooterCreditsProps {
  isKid?: boolean;
  compact?: boolean;
}

export const FooterCredits: React.FC<FooterCreditsProps> = ({
  isKid = false,
  compact = false
}) => {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <div className={compact ? 'text-center' : 'mt-10 mb-6 text-center'} dir="rtl">
        <button
          type="button"
          onClick={() => setShowAbout(true)}
          className={`group inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
            isKid
              ? 'bg-[#FFFDF7]/90 dark:bg-[#231F1A]/90 border-[#EFE5D1] dark:border-white/10 text-[#1F2933] dark:text-[#F5EFE6] hover:border-[#2EC4B6]/50'
              : 'bg-[#FAF8F5]/85 dark:bg-[#18201C]/85 border-[#E5DEC9] dark:border-white/10 text-[#1B4332] dark:text-[#D4E2D9] hover:border-[#D4A373]/70'
          }`}
          title="معلومات التطبيق والمطورة"
        >
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              isKid
                ? 'bg-[#2EC4B6]/15 text-[#2EC4B6] group-hover:bg-[#FF9F1C]/20 group-hover:text-[#D97706]'
                : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
          </span>
          <span className="tracking-tight">
            تصميم وتطوير: <strong className="font-bold">باسمة حسين محرق</strong> © 2026
          </span>
        </button>
      </div>

      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} isKid={isKid} />
    </>
  );
};
