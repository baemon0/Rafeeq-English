import React, { useMemo, useState } from 'react';
import {
  CRAFT_RECIPES,
  EMPTY_RESOURCES,
  RESOURCE_CATALOG,
  hasActiveEnchantedItem
} from '../data/avatarCatalog';
import type {
  AppMode,
  CloudUser,
  CraftRecipe,
  PixelAvatarConfig,
  ResourceType,
  UserProgress
} from '../types';
import { PixelAvatar } from './PixelAvatar';
import {
  Camera,
  Check,
  Hammer,
  Lock,
  MessageSquareText,
  Sparkles,
  Wand2,
  X
} from 'lucide-react';

interface CraftingWorkshopPanelProps {
  mode: AppMode;
  progress: UserProgress;
  authToken: string | null;
  onUserUpdated: (updatedUser: CloudUser) => void;
  onGoToLens?: () => void;
  onGoToChat?: () => void;
}

const RESOURCE_ORDER: ResourceType[] = ['wool', 'glass', 'iron', 'wood', 'paper'];

export const CraftingWorkshopPanel: React.FC<CraftingWorkshopPanelProps> = ({
  mode,
  progress,
  authToken,
  onUserUpdated,
  onGoToLens,
  onGoToChat
}) => {
  const isKid = mode === 'kid';
  const [slot1, setSlot1] = useState<ResourceType | null>(null);
  const [slot2, setSlot2] = useState<ResourceType | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const resources = progress.resources || EMPTY_RESOURCES;
  const chatXp = Math.max(0, Number(progress.chatXp) || 0);
  const unlockedSet = new Set(progress.avatar?.unlockedItems || []);
  const enchantedSet = new Set(progress.avatar?.enchantedItems || []);
  const isEnchantedAuraActive = hasActiveEnchantedItem(progress.avatar);

  const matchedRecipe: CraftRecipe | null = useMemo(() => {
    if (!slot1 || !slot2) return null;
    return CRAFT_RECIPES.find((r) => r.slot1 === slot1 && r.slot2 === slot2) || null;
  }, [slot1, slot2]);

  const hasEnoughForMatched = useMemo(() => {
    if (!slot1 || !slot2) return false;
    if (slot1 === slot2) {
      return (resources[slot1] || 0) >= 2;
    }
    return (resources[slot1] || 0) >= 1 && (resources[slot2] || 0) >= 1;
  }, [slot1, slot2, resources]);

  const handlePickResource = (resType: ResourceType) => {
    setFeedback(null);
    if (!slot1) {
      setSlot1(resType);
    } else if (!slot2) {
      setSlot2(resType);
    } else {
      setSlot1(slot2);
      setSlot2(resType);
    }
  };

  const handleFillRecipe = (recipe: CraftRecipe) => {
    setFeedback(null);
    setSlot1(recipe.slot1);
    setSlot2(recipe.slot2);
  };

  const handleCraft = async () => {
    if (!authToken) {
      setFeedback({ type: 'err', text: 'يرجى تسجيل الدخول لاستخدام طاولة الصياغة.' });
      return;
    }
    if (!slot1 || !slot2) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/craft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode, slot1, slot2 })
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'تعذر تنفيذ الصياغة.' });
        return;
      }
      if (data.user) {
        onUserUpdated(data.user);
      }
      setFeedback({
        type: 'ok',
        text: data.message || 'تم صياغة العنصر وارتداؤه على شخصيتك فوراً!'
      });
      setSlot1(null);
      setSlot2(null);
    } catch {
      setFeedback({ type: 'err', text: 'تعذر الاتصال بطاولة الصياغة.' });
    } finally {
      setBusy(false);
    }
  };

  const handleEnchant = async (itemId: string) => {
    if (!authToken) {
      setFeedback({ type: 'err', text: 'يرجى تسجيل الدخول لاستخدام طاولة التطوير.' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/enchant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode, itemId })
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'تعذر تنفيذ التطوير السحري.' });
        return;
      }
      if (data.user) {
        onUserUpdated(data.user);
      }
      setFeedback({
        type: 'ok',
        text: data.message || '✨ تم تطوير القطعة وتفعيل الهالة ومكافآت 2x!'
      });
    } catch {
      setFeedback({ type: 'err', text: 'تعذر الاتصال بطاولة التطوير السحري.' });
    } finally {
      setBusy(false);
    }
  };

  const handleEquipCrafted = async (recipe: CraftRecipe) => {
    if (!authToken) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/avatar/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          mode,
          action: 'equip',
          category: recipe.outputCategory,
          itemId: recipe.outputItemId
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'تعذر ارتداء القطعة.' });
        return;
      }
      if (data.user) onUserUpdated(data.user);
      setFeedback({ type: 'ok', text: `تم ارتداء «${recipe.nameAr}» على شخصيتك!` });
    } catch {
      setFeedback({ type: 'err', text: 'تعذر الاتصال بالخادم.' });
    } finally {
      setBusy(false);
    }
  };

  const previewAvatarConfig: PixelAvatarConfig = matchedRecipe
    ? {
        ...progress.avatar,
        [matchedRecipe.outputCategory]: matchedRecipe.outputItemId
      }
    : progress.avatar;

  return (
    <div className="space-y-5">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold text-center border ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* 1. Real-World Camera Resource Bag */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-500" />
              <span>حقيبة موارد الكاميرا الواقعية</span>
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              صوّر أشياءً حقيقية بالعدسة الذكية (خشب، زجاج، حديد، صوف، ورق) لتجميع موارد الصياغة!
            </p>
          </div>
          {onGoToLens && (
            <button
              type="button"
              onClick={onGoToLens}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>جمع بالكاميرا</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {RESOURCE_ORDER.map((resKey) => {
            const meta = RESOURCE_CATALOG[resKey];
            const qty = resources[resKey] || 0;
            return (
              <button
                key={resKey}
                type="button"
                onClick={() => handlePickResource(resKey)}
                title={`${meta.nameAr} (${meta.nameEn}) — ${meta.examplesAr}`}
                className={`p-2 sm:p-2.5 rounded-2xl border text-center transition-all active:scale-95 ${
                  qty > 0
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 hover:border-amber-500'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-75'
                }`}
              >
                <div className="text-xl sm:text-2xl leading-none">{meta.emoji}</div>
                <div className="text-[11px] font-extrabold text-gray-800 dark:text-gray-100 mt-1 truncate">
                  {meta.nameAr}
                </div>
                <div className="text-xs font-black text-amber-700 dark:text-amber-300 tabular-nums mt-0.5">
                  ×{qty}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Crafting Table Workbench */}
      <div className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/70 dark:from-gray-800 dark:via-gray-800 dark:to-amber-950/20 rounded-3xl p-5 border border-amber-200 dark:border-amber-800/60 shadow-md">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-gray-900 dark:text-white">
                طاولة الصياغة الحصرية (Crafting Table)
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                أزياء وإكسسوارات حصرية لا تُشترى بالعملات — تُصنع وتُرتدى فوراً على شخصيتك!
              </p>
            </div>
          </div>
        </div>

        {/* 2 Crafting Slots + Output Avatar Preview */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap bg-white/80 dark:bg-gray-900/70 rounded-2xl p-4 border border-amber-200/70 dark:border-gray-700">
          {/* Slot 1 */}
          <button
            type="button"
            onClick={() => setSlot1(null)}
            className={`w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
              slot1
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            }`}
            title={slot1 ? 'اضغط لإفراغ الخانة 1' : 'اختر المورد الأول من الأعلى'}
          >
            {slot1 ? (
              <>
                <span className="text-2xl">{RESOURCE_CATALOG[slot1].emoji}</span>
                <span className="text-[10px] font-black text-gray-800 dark:text-gray-100 mt-1">
                  {RESOURCE_CATALOG[slot1].nameAr}
                </span>
              </>
            ) : (
              <span className="text-[11px] font-bold text-gray-400">خانة 1</span>
            )}
          </button>

          <span className="text-xl font-black text-amber-600">+</span>

          {/* Slot 2 */}
          <button
            type="button"
            onClick={() => setSlot2(null)}
            className={`w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
              slot2
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            }`}
            title={slot2 ? 'اضغط لإفراغ الخانة 2' : 'اختر المورد الثاني من الأعلى'}
          >
            {slot2 ? (
              <>
                <span className="text-2xl">{RESOURCE_CATALOG[slot2].emoji}</span>
                <span className="text-[10px] font-black text-gray-800 dark:text-gray-100 mt-1">
                  {RESOURCE_CATALOG[slot2].nameAr}
                </span>
              </>
            ) : (
              <span className="text-[11px] font-bold text-gray-400">خانة 2</span>
            )}
          </button>

          <span className="text-xl font-black text-amber-600">=</span>

          {/* Result Avatar Preview */}
          <div className="flex flex-col items-center">
            <div
              className={`p-1.5 rounded-2xl border-2 ${
                matchedRecipe
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <PixelAvatar config={previewAvatarConfig} size={64} className="rounded-xl overflow-hidden" />
            </div>
            <span className="text-[11px] font-black text-gray-800 dark:text-gray-100 mt-1.5 text-center max-w-[140px]">
              {matchedRecipe
                ? matchedRecipe.nameAr
                : slot1 && slot2
                  ? 'مزيج غير معروف'
                  : 'معاينة النتيجة'}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={busy || !matchedRecipe || !hasEnoughForMatched}
          onClick={handleCraft}
          className={`mt-4 w-full min-h-[46px] rounded-2xl font-black text-sm text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 ${
            matchedRecipe && hasEnoughForMatched && !busy
              ? isKid
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-105'
                : 'bg-[#2D6A4F] hover:bg-[#1b4332]'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Hammer className="w-4 h-4" />
          <span>
            {!matchedRecipe
              ? 'اختر وصفة صالحة من الموارد أو كتاب الوصفات'
              : !hasEnoughForMatched
                ? `تنقصك موارد لصناعة ${matchedRecipe.nameAr}`
                : busy
                  ? 'جاري الصياغة...'
                  : `اصنع «${matchedRecipe.nameAr}» وارتده فوراً!`}
          </span>
        </button>

        {/* Recipe Book */}
        <div className="mt-4 pt-4 border-t border-amber-200/70 dark:border-gray-700">
          <h5 className="text-xs font-black text-gray-700 dark:text-gray-200 mb-2.5">
            📖 كتاب الوصفات الحصرية (اضغط لتعبئة الطاولة):
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CRAFT_RECIPES.map((recipe) => {
              const owned = unlockedSet.has(recipe.outputItemId);
              const equipped = progress.avatar?.[recipe.outputCategory] === recipe.outputItemId;
              const isSelected = slot1 === recipe.slot1 && slot2 === recipe.slot2;
              return (
                <div
                  key={recipe.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-100/60 dark:bg-amber-950/40'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PixelAvatar
                      config={{
                        ...progress.avatar,
                        [recipe.outputCategory]: recipe.outputItemId
                      }}
                      size={44}
                      className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                    />
                    <div className="min-w-0">
                      <div className="font-black text-xs text-gray-900 dark:text-white truncate">
                        {recipe.nameAr}
                      </div>
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                        {RESOURCE_CATALOG[recipe.slot1].emoji} {RESOURCE_CATALOG[recipe.slot1].nameAr} +{' '}
                        {RESOURCE_CATALOG[recipe.slot2].emoji} {RESOURCE_CATALOG[recipe.slot2].nameAr}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {owned && !equipped && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleEquipCrafted(recipe)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold"
                      >
                        ارتداء
                      </button>
                    )}
                    {equipped && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                        <Check className="w-3 h-3" />
                        <span>مُرتدى</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleFillRecipe(recipe)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 text-[11px] font-extrabold"
                    >
                      {owned ? 'تكرار' : 'تعبئة'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Enchanting Table */}
      <div className="bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 border border-purple-500/40 shadow-xl">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/25 border border-purple-400/40 text-purple-200">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black flex items-center gap-1.5">
                <span>طاولة التطوير السحري (Enchanting Table)</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h4>
              <p className="text-xs text-purple-200/80 mt-0.5">
                أنفق XP المحادثة لتطوير أي قطعة صنعتها والحصول على هالة أرجوانية ذهبية + مكافآت 2x في العدسة!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/25 border border-purple-300/40 text-xs font-black text-purple-100 tabular-nums"
              dir="ltr"
            >
              💬 {chatXp} Chat XP
            </div>
            {onGoToChat && (
              <button
                type="button"
                onClick={onGoToChat}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1"
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                <span>اكسب Chat XP</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Enchantment Status */}
        <div
          className={`mb-4 p-3 rounded-2xl border flex items-center gap-3 ${
            isEnchantedAuraActive
              ? 'bg-purple-500/20 border-amber-400/60 text-amber-100'
              : 'bg-white/5 border-white/10 text-purple-200'
          }`}
        >
          <PixelAvatar
            config={progress.avatar}
            size={48}
            forceEnchanted={isEnchantedAuraActive}
            className="rounded-xl"
          />
          <div className="text-xs font-bold leading-relaxed">
            {isEnchantedAuraActive ? (
              <span>
                ✨ <strong className="text-amber-300">الهالة السحرية مفعّلة الآن!</strong> شخصيتك تتوهج باللون الأرجواني والذهبي في المتصدرين والستوري، وتحصل على <strong className="text-amber-300">2x LangCoins و 2x XP/نجوم</strong> في كل مسح بالعدسة!
              </span>
            ) : (
              <span>
                اصنع إحدى القطع في الأعلى ثم طوّرها بـ Chat XP لتفعيل الهالة الأرجوانية الذهبية ومضاعفة مكافآت العدسة (2x)!
              </span>
            )}
          </div>
        </div>

        {/* Craftable Items Enchant List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CRAFT_RECIPES.map((recipe) => {
            const isCrafted = unlockedSet.has(recipe.outputItemId);
            const isEnchanted = enchantedSet.has(recipe.outputItemId);
            const isEquipped = progress.avatar?.[recipe.outputCategory] === recipe.outputItemId;
            const canAfford = chatXp >= recipe.enchantCostChatXp;

            return (
              <div
                key={`enchant-${recipe.id}`}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 ${
                  isEnchanted
                    ? 'bg-purple-500/25 border-amber-400/50'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <PixelAvatar
                    config={{
                      ...progress.avatar,
                      [recipe.outputCategory]: recipe.outputItemId,
                      enchantedItems: [recipe.outputItemId]
                    }}
                    forceEnchanted={true}
                    size={44}
                    className="rounded-xl"
                  />
                  <div className="min-w-0">
                    <div className="font-black text-xs text-white truncate">{recipe.nameAr}</div>
                    <div className="text-[11px] font-bold text-amber-300 mt-0.5 tabular-nums">
                      {isEnchanted
                        ? '✨ مطورة (2x + هالة سحرية)'
                        : `${recipe.enchantCostChatXp} Chat XP`}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {!isCrafted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 text-purple-200/70 text-[11px] font-bold">
                      <Lock className="w-3 h-3" />
                      <span>اصنعها أولاً</span>
                    </span>
                  ) : isEnchanted ? (
                    isEquipped ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-[11px] font-black">
                        <Sparkles className="w-3 h-3" />
                        <span>مُفعّلة ✨</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleEquipCrafted(recipe)}
                        className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-[11px] font-extrabold"
                      >
                        ارتداء وتفعيل
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={busy || !canAfford}
                      onClick={() => handleEnchant(recipe.outputItemId)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                        canAfford && !busy
                          ? 'bg-gradient-to-r from-purple-500 to-amber-500 hover:brightness-110 text-white shadow'
                          : 'bg-white/10 text-purple-200/60 cursor-not-allowed'
                      }`}
                    >
                      تطوير ✨ ({recipe.enchantCostChatXp})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface CraftingWorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AppMode;
  progress: UserProgress;
  authToken: string | null;
  onUserUpdated: (updatedUser: CloudUser) => void;
  onGoToLens?: () => void;
  onGoToChat?: () => void;
}

export const CraftingWorkshopModal: React.FC<CraftingWorkshopModalProps> = ({
  isOpen,
  onClose,
  mode,
  progress,
  authToken,
  onUserUpdated,
  onGoToLens,
  onGoToChat
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-gray-50 dark:bg-gray-900 w-full max-w-2xl max-h-[88vh] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                طاولة الصياغة والتطوير السحري
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                اصنع أزياء وإكسسوارات حصرية لشخصيتك البكسل وطوّرها بهالة 2x!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors"
            aria-label="إغلاق طاولة الصياغة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <CraftingWorkshopPanel
            mode={mode}
            progress={progress}
            authToken={authToken}
            onUserUpdated={onUserUpdated}
            onGoToLens={onGoToLens ? () => { onClose(); onGoToLens(); } : undefined}
            onGoToChat={onGoToChat ? () => { onClose(); onGoToChat(); } : undefined}
          />
        </div>
      </div>
    </div>
  );
};
