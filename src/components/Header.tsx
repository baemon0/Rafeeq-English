import React from 'react';
import { AppMode, PixelAvatarConfig } from '../types';
import { getDiscordRoleInfo } from '../utils/progress';
import { PixelAvatar } from './PixelAvatar';
import { Star, LogOut, Zap, Trophy, Coins, ShoppingBag, Hammer } from 'lucide-react';

interface HeaderProps {
  mode: AppMode;
  username: string;
  avatar: PixelAvatarConfig;
  langCoins: number;
  onExitMode: () => void;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onOpenWorkshop?: () => void;
  stars: number;
  xp: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  username,
  avatar,
  langCoins,
  onExitMode,
  onOpenLeaderboard,
  onOpenShop,
  onOpenWorkshop,
  stars,
  xp
}) => {
  const isKid = mode === 'kid';
  const discordRole = getDiscordRoleInfo(xp, mode);

  return (
    <header
      className={`sticky top-0 z-30 transition-colors duration-300 shadow-md ${
        isKid
          ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-teal-400 text-white'
          : 'bg-[#2D6A4F] text-white'
      }`}
    >
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Pixel Avatar + App Branding + Online Dot */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenShop}
            className="relative p-0.5 rounded-2xl bg-white/20 hover:bg-white/30 transition-all shrink-0 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            title="فتح استوديو ومتجر الشخصية"
          >
            <PixelAvatar config={avatar} size={38} className="rounded-xl overflow-hidden" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 ${
                isKid ? 'border-rose-500' : 'border-[#2D6A4F]'
              }`}
              title="متصل الآن"
            />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
              {isKid ? 'رفيق الإنجليزية الصغير 🚀' : 'رفيق الإنجليزية'}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] opacity-90 font-medium truncate">
              <span className="inline-flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                <span className="truncate max-w-[80px] sm:max-w-[130px]">{username}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate hidden sm:inline">
                {isKid ? 'قسم الصغار' : 'قسم الكبار'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Role Pill, Stars/XP, LangCoins Shop, Leaderboard, Exit/Switch */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Sleek Discord Role Pill */}
          <div
            className="hidden md:inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full border border-white/20 text-[11px] font-bold text-white whitespace-nowrap"
            dir="ltr"
            title={`الرتبة: ${discordRole.nameAr}`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${discordRole.dotClass}`} />
            <span>{discordRole.nameEn}</span>
          </div>

          {isKid ? (
            <div className="flex items-center gap-1 bg-white/20 px-2 py-1.5 rounded-xl backdrop-blur-sm border border-white/25">
              <Star className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
              <span className="font-extrabold text-xs text-white tabular-nums">{stars}</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 bg-white/20 px-2 py-1.5 rounded-xl backdrop-blur-sm border border-white/25"
              dir="ltr"
              title="نقاط الخبرة المكتسبة"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span className="font-extrabold text-xs text-white tabular-nums whitespace-nowrap">
                {xp} XP
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenShop}
            className="min-h-[38px] px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/45 active:scale-95 text-white border border-amber-200/40 text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            title="متجر التخصيص والشخصية البكسل"
          >
            <Coins className="w-3.5 h-3.5 text-amber-200 shrink-0" />
            <span className="tabular-nums">{langCoins}</span>
            <ShoppingBag className="w-3 h-3 hidden sm:inline opacity-90" />
          </button>

          {onOpenWorkshop && (
            <button
              type="button"
              onClick={onOpenWorkshop}
              className="min-h-[38px] px-2 sm:px-2.5 py-1.5 rounded-xl bg-purple-500/35 hover:bg-purple-500/50 active:scale-95 text-white border border-purple-200/40 text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              title="طاولة الصياغة والتطوير السحري (2x)"
            >
              <Hammer className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span className="hidden md:inline">الصياغة</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="min-h-[38px] px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/25 text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            title="لوحة المتصدرين (أفضل 10)"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">المتصدرين</span>
          </button>

          <button
            type="button"
            onClick={onExitMode}
            className="min-h-[38px] px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/25 text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            title="الخروج أو التبديل بين قسم الصغار والكبار"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج / تبديل</span>
            <span className="sm:hidden">تبديل</span>
          </button>
        </div>
      </div>
    </header>
  );
};
