import React from 'react';
import { AppMode } from '../types';
import { getDiscordRoleInfo } from '../utils/progress';
import { Star, LogOut, Zap, Trophy, Languages, Sun } from 'lucide-react';

interface HeaderProps {
  mode: AppMode;
  username: string;
  onExitMode: () => void;
  onOpenLeaderboard: () => void;
  onOpenShop?: () => void;
  stars: number;
  xp: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  username,
  onExitMode,
  onOpenLeaderboard,
  onOpenShop,
  stars,
  xp
}) => {
  const isKid = mode === 'kid';
  const discordRole = getDiscordRoleInfo(xp, mode);

  return (
    <header
      className={`sticky top-0 z-30 glass-header relative transition-colors duration-200 ${
        isKid
          ? 'bg-[#FFFDF7]/92 dark:bg-[#181512]/92 border-b border-[#EFE5D1] dark:border-white/10 text-[#1F2933] dark:text-[#FFFDF7]'
          : 'bg-[#FAF8F5]/90 dark:bg-[#111714]/90 border-b border-[#E5DEC9] dark:border-white/10 text-[#1B4332] dark:text-[#FAF8F5]'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isKid
                ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
            }`}
          >
            {isKid ? <Sun className="w-5 h-5" /> : <Languages className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
              {isKid ? 'رفيق الصغار' : 'رفيق الإنجليزية'}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-[#5C665E] dark:text-gray-400 font-medium truncate">
              <span className="truncate max-w-[96px] sm:max-w-[150px]">{username}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate hidden sm:inline">
                {isKid ? 'قسم الصغار' : discordRole.nameAr}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Zone */}
        <div className="flex items-center gap-2 shrink-0">
          {isKid ? (
            <button
              type="button"
              onClick={onOpenShop}
              className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF9F1C]/15 hover:bg-[#FF9F1C]/25 text-[#B45309] dark:text-[#FBBF24] transition-colors active:scale-95 whitespace-nowrap shrink-0"
              title="افتح متجر النجوم"
            >
              <Star className="w-3.5 h-3.5 text-[#FF9F1C] fill-[#FF9F1C] shrink-0" />
              <span className="font-bold text-xs tabular-nums">{stars}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenShop}
              className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D4A373]/18 hover:bg-[#D4A373]/28 text-[#7C4D2B] dark:text-[#E9C46A] transition-colors active:scale-95 whitespace-nowrap shrink-0"
              dir="ltr"
              title="افتح متجر الخبرة"
            >
              <Zap className="w-3.5 h-3.5 text-[#C87D55] dark:text-[#E9C46A] shrink-0" />
              <span className="font-bold text-xs tabular-nums">{xp} XP</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95 whitespace-nowrap shrink-0 border ${
              isKid
                ? 'bg-white dark:bg-white/5 border-[#EFE5D1] dark:border-white/10 text-[#1F2933] dark:text-gray-200 hover:border-[#2EC4B6]'
                : 'bg-white/80 dark:bg-white/5 border-[#E5DEC9] dark:border-white/10 text-[#1B4332] dark:text-gray-200 hover:border-[#1B4332]/40'
            }`}
            title="لوحة المتصدرين"
          >
            <Trophy className={`w-3.5 h-3.5 ${isKid ? 'text-[#FF9F1C]' : 'text-[#D4A373]'}`} />
            <span className="hidden sm:inline">المتصدرون</span>
          </button>

          <button
            type="button"
            onClick={onExitMode}
            className={`min-h-[38px] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95 whitespace-nowrap shrink-0 ${
              isKid
                ? 'bg-[#2EC4B6] hover:bg-[#24A99D] text-white'
                : 'bg-[#1B4332] hover:bg-[#143326] text-[#FAF8F5]'
            }`}
            title="تبديل القسم أو الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تبديل القسم</span>
            <span className="sm:hidden">تبديل</span>
          </button>
        </div>
      </div>
    </header>
  );
};
