import React, { useState } from 'react';
import { AppMode, CloudUser, UserProgress } from '../types';
import { getShopItemsForMode, ShopCatalogItem, ShopIconKey } from '../data/shopCatalog';
import {
  AlertCircle,
  Bot,
  Briefcase,
  CheckCircle2,
  Crown,
  Globe,
  Heart,
  Lock,
  Orbit,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Zap
} from 'lucide-react';

interface ShopTabProps {
  mode: AppMode;
  progress: UserProgress;
  authToken: string | null;
  onUserUpdated: (updatedUser: CloudUser) => void;
}

function renderShopIcon(iconKey: ShopIconKey, className = 'w-6 h-6') {
  switch (iconKey) {
    case 'dino':
      return <Sparkles className={className} />;
    case 'bot':
      return <Bot className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'orbit':
      return <Orbit className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'crown':
      return <Crown className={className} />;
  }
}

export const ShopTab: React.FC<ShopTabProps> = ({
  mode,
  progress,
  authToken,
  onUserUpdated
}) => {
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const isKid = mode === 'kid';
  const items = getShopItemsForMode(mode);
  const balance = isKid ? progress.stars : progress.xp;

  const isItemOwned = (item: ShopCatalogItem): boolean => {
    if (item.id === 'streak_shield') {
      return Boolean(progress.streakShieldActive);
    }
    if (item.id === 'second_chance_heart') {
      return (progress.secondChanceHearts || 0) > 0;
    }
    if (item.unlockCharacterKey && progress.unlockedCharacters?.[item.unlockCharacterKey]) {
      return true;
    }
    return Boolean(progress.purchasedItems?.[item.id]);
  };

  const handleBuy = async (item: ShopCatalogItem) => {
    if (!authToken || buyingId) return;
    setStatusMsg(null);
    setBuyingId(item.id);
    try {
      const res = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode, itemId: item.id })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          text: data.error || 'تعذر إتمام عملية الشراء، حاول مرة أخرى.'
        });
        return;
      }
      if (data.user) {
        onUserUpdated(data.user);
      }
      setStatusMsg({
        type: 'success',
        text: `تم شراء وتفعيل «${item.titleAr}» في حسابك السحابي بنجاح.`
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'تعذر الاتصال بالخادم لإتمام عملية الشراء.'
      });
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      {/* Header Section */}
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

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                isKid
                  ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                  : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
              }`}
            >
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1B4332] dark:text-[#FAF8F5]">
                {isKid ? 'متجر النجوم والمكافآت' : 'متجر الخبرة والمكافآت'}
              </h2>
              <p className="text-sm text-[#5C665E] dark:text-gray-400 mt-1.5 leading-relaxed">
                {isKid
                  ? 'استبدل نجومك المكتسبة بشخصيات محادثة جديدة، قلوب فرصة ثانية، وألقاب مميزة.'
                  : 'استثمر نقاط XP لفتح موجهي المحادثة، درع حماية السلسلة، وإطار VIP الذهبي.'}
              </p>
            </div>
          </div>

          <div
            className={`px-5 py-3 rounded-2xl border flex items-center gap-3 shrink-0 self-start sm:self-auto ${
              isKid
                ? 'bg-[#FF9F1C]/10 border-[#FF9F1C]/30 text-[#9A5B00] dark:text-[#FBBF24]'
                : 'bg-[#D4A373]/12 border-[#D4A373]/35 text-[#1B4332] dark:text-[#E9C46A]'
            }`}
          >
            {isKid ? (
              <Star className="w-5 h-5 text-[#FF9F1C] fill-[#FF9F1C] shrink-0" />
            ) : (
              <Zap className="w-5 h-5 text-[#C87D55] dark:text-[#E9C46A] shrink-0" />
            )}
            <div>
              <p className="text-[11px] font-medium opacity-75">رصيدك الحالي</p>
              <p className="text-lg font-bold tabular-nums leading-tight" dir="ltr">
                {balance} {isKid ? 'Stars' : 'XP'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Feedback Banner */}
      {statusMsg && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-3 ${
            statusMsg.type === 'success'
              ? 'bg-[#1B4332]/[0.06] dark:bg-emerald-950/30 border-[#1B4332]/20 text-[#1B4332] dark:text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#1B4332] dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {items.map((item) => {
          const owned = isItemOwned(item);
          const canAfford = balance >= item.cost;
          const isBuying = buyingId === item.id;

          return (
            <div
              key={item.id}
              className={`editorial-card hover-scale rounded-3xl p-6 flex flex-col justify-between gap-6 ${
                owned
                  ? isKid
                    ? 'border-[#2EC4B6]/50'
                    : 'border-[#1B4332]/40'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      owned
                        ? isKid
                          ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                          : 'bg-[#1B4332]/12 text-[#1B4332] dark:text-[#D4A373]'
                        : isKid
                          ? 'bg-[#FF9F1C]/15 text-[#D97706]'
                          : 'bg-[#D4A373]/18 text-[#9C6644] dark:text-[#D4A373]'
                    }`}
                  >
                    {renderShopIcon(item.iconKey, 'w-6 h-6')}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums text-[#5C665E] dark:text-gray-300" dir="ltr">
                    {isKid ? (
                      <Star className="w-3.5 h-3.5 text-[#FF9F1C] fill-[#FF9F1C]" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-[#C87D55]" />
                    )}
                    <span>
                      {item.cost} {isKid ? 'Stars' : 'XP'}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#1B4332] dark:text-[#FAF8F5]">
                  {item.titleAr}
                </h3>
                <p className="text-xs sm:text-sm text-[#5C665E] dark:text-gray-300 mt-2 leading-relaxed">
                  {item.descAr}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1B4332]/[0.08] dark:border-white/10">
                {owned ? (
                  <button
                    type="button"
                    disabled
                    className={`w-full min-h-[44px] px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-default ${
                      isKid
                        ? 'bg-[#2EC4B6]/15 text-[#1A8A7F] dark:text-[#5EEAD4]'
                        : 'bg-[#1B4332]/10 dark:bg-emerald-950/50 text-[#1B4332] dark:text-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>مُفعّل</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canAfford || isBuying}
                    onClick={() => handleBuy(item)}
                    className={`w-full min-h-[44px] px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                      !canAfford
                        ? 'bg-black/[0.05] dark:bg-white/5 text-[#7A847C] dark:text-gray-400 cursor-not-allowed'
                        : isKid
                          ? 'bg-[#FF9F1C] hover:bg-[#E88D14] text-white active:scale-95'
                          : 'bg-[#1B4332] hover:bg-[#143326] text-[#FAF8F5] active:scale-95'
                    }`}
                  >
                    {!canAfford ? (
                      <>
                        <Lock className="w-4 h-4 shrink-0" />
                        <span>رصيد غير كافٍ ({item.cost})</span>
                      </>
                    ) : isBuying ? (
                      <span>جاري الشراء...</span>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        <span>شراء ({item.cost})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
