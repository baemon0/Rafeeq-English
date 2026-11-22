import React, { useEffect, useState } from 'react';
import {
  AVATAR_PRESETS,
  AVATAR_SHOP_ITEMS,
  CLOTHING_COLORS,
  HAIR_COLORS,
  SKIN_TONES,
  hasActiveEnchantedItem
} from '../data/avatarCatalog';
import type {
  AppMode,
  AvatarGender,
  AvatarShopCategory,
  AvatarShopItem,
  CloudUser,
  PixelAvatarConfig,
  UserProgress
} from '../types';
import { PixelAvatar } from './PixelAvatar';
import { CraftingWorkshopPanel } from './CraftingWorkshopModal';
import {
  Camera,
  Check,
  Coins,
  Hammer,
  Lock,
  Palette,
  ShoppingBag,
  Sparkles,
  X
} from 'lucide-react';

interface AvatarShopPanelProps {
  mode: AppMode;
  progress: UserProgress;
  authToken: string | null;
  onUserUpdated: (updatedUser: CloudUser) => void;
  onGoToLens?: () => void;
  onGoToChat?: () => void;
  defaultTab?: 'creator' | 'shop' | 'workshop';
}

const CATEGORY_TABS: Array<{ id: 'all' | AvatarShopCategory; label: string }> = [
  { id: 'all', label: 'الكل' },
  { id: 'glasses', label: 'النظارات' },
  { id: 'hat', label: 'القبعات والسماعات' },
  { id: 'outfit', label: 'الأزياء والهوديز' },
  { id: 'handItem', label: 'جوائز المستكشف' },
  { id: 'background', label: 'الخلفيات' }
];

export const AvatarShopPanel: React.FC<AvatarShopPanelProps> = ({
  mode,
  progress,
  authToken,
  onUserUpdated,
  onGoToLens,
  onGoToChat,
  defaultTab = 'creator'
}) => {
  const isKid = mode === 'kid';
  const [innerTab, setInnerTab] = useState<'creator' | 'shop' | 'workshop'>(defaultTab);
  const [shopCategory, setShopCategory] = useState<'all' | AvatarShopCategory>('all');
  const [draft, setDraft] = useState<PixelAvatarConfig>(progress.avatar);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setDraft(progress.avatar);
  }, [progress.avatar]);

  const scannedCount = progress.scannedObjects?.length || 0;
  const unlockedSet = new Set(progress.avatar?.unlockedItems || ['none', 'default', 'plain']);
  const enchantedSet = new Set(progress.avatar?.enchantedItems || []);
  const isAuraActive = hasActiveEnchantedItem(progress.avatar);

  const callShopApi = async (body: Record<string, unknown>) => {
    if (!authToken) {
      setFeedback({ type: 'err', text: 'يرجى تسجيل الدخول لحفظ التعديلات السحابية.' });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/avatar/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ mode, ...body })
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'تعذر تنفيذ الطلب.' });
        return;
      }
      if (data.user) {
        onUserUpdated(data.user);
      }
      if (data.message) {
        setFeedback({ type: 'ok', text: data.message });
      }
    } catch {
      setFeedback({ type: 'err', text: 'حدث خطأ أثناء الاتصال بالخادم.' });
    } finally {
      setBusy(false);
    }
  };

  const handleSelectGender = (gender: AvatarGender) => {
    const firstMatching = AVATAR_PRESETS.find((p) => p.gender === gender) || AVATAR_PRESETS[0];
    setDraft((prev) => ({
      ...prev,
      gender,
      preset: firstMatching.id,
      hairColor: firstMatching.hairColor,
      skinTone: firstMatching.skinTone,
      shirtColor: firstMatching.shirtColor,
      pantsColor: firstMatching.pantsColor
    }));
  };

  const handleSelectPreset = (presetId: PixelAvatarConfig['preset']) => {
    const preset = AVATAR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDraft((prev) => ({
      ...prev,
      gender: preset.gender,
      preset: preset.id,
      hairColor: preset.hairColor,
      skinTone: preset.skinTone,
      shirtColor: preset.shirtColor,
      pantsColor: preset.pantsColor,
      outfit: 'default'
    }));
  };

  const handleSaveCreator = () => {
    void callShopApi({
      action: 'customize',
      gender: draft.gender,
      preset: draft.preset,
      hairColor: draft.hairColor,
      skinTone: draft.skinTone,
      shirtColor: draft.shirtColor,
      pantsColor: draft.pantsColor
    });
  };

  const handleItemAction = (item: AvatarShopItem) => {
    const isFreeDefault = item.price === 0 && !item.isMilestoneReward && !item.isCraftOnly;
    const isUnlocked = isFreeDefault || unlockedSet.has(item.id);
    if (isUnlocked) {
      void callShopApi({
        action: 'equip',
        category: item.category,
        itemId: item.id
      });
    } else if (item.isCraftOnly) {
      setInnerTab('workshop');
      setFeedback(null);
    } else {
      void callShopApi({
        action: 'buy',
        category: item.category,
        itemId: item.id
      });
    }
  };

  const visibleItems =
    shopCategory === 'all'
      ? AVATAR_SHOP_ITEMS
      : AVATAR_SHOP_ITEMS.filter((it) => it.category === shopCategory);

  return (
    <div className="space-y-5">
      {/* Live Avatar & Wallet Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-5 shadow-lg border border-white/10 flex flex-col sm:flex-row items-center gap-5">
        <div className="p-2 rounded-2xl bg-white/10 border border-white/20 shadow-inner shrink-0">
          <PixelAvatar
            config={innerTab === 'creator' ? draft : progress.avatar}
            size={104}
            className="rounded-xl overflow-hidden"
          />
        </div>

        <div className="flex-1 w-full text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <h3 className="text-lg font-black">استوديو ومتجر الشخصية البكسل</h3>
              {isAuraActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-amber-300/60 text-amber-200 text-[10px] font-black">
                  <Sparkles className="w-3 h-3" />
                  <span>هالة 2x مفعّلة</span>
                </span>
              )}
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 font-black text-xs tabular-nums"
              dir="ltr"
            >
              <Coins className="w-4 h-4 text-amber-300" />
              <span>{progress.langCoins} LangCoins</span>
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-1">
            اجمع عملات LangCoins من الترجمة والتحديات، أو اصنع إكسسوارات حصرية من موارد الكاميرا في طاولة الصياغة!
          </p>

          {/* Camera Explorer 10-Object Milestone Mini Bar */}
          <div className="mt-3 bg-white/10 rounded-2xl p-2.5 border border-white/10">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-200 mb-1">
              <span className="flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" />
                <span>مهمة مستكشف الكاميرا (قبعة المستكشف + كاميرا ذهبية)</span>
              </span>
              <span className="tabular-nums" dir="ltr">
                {Math.min(scannedCount, 10)}/10
              </span>
            </div>
            <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${Math.min(100, (Math.min(scannedCount, 10) / 10) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher: Creator vs Shop vs Workshop */}
      <div className="flex items-center justify-center">
        <div className="bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl inline-flex gap-1 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => {
              setInnerTab('creator');
              setFeedback(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              innerTab === 'creator'
                ? isKid
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-[#2D6A4F] text-white shadow'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>تصميم الشخصية (مجاني)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInnerTab('shop');
              setFeedback(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              innerTab === 'shop'
                ? isKid
                  ? 'bg-rose-500 text-white shadow'
                  : 'bg-[#2D6A4F] text-white shadow'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>المتجر والإكسسوارات</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInnerTab('workshop');
              setFeedback(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              innerTab === 'workshop'
                ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <Hammer className="w-4 h-4" />
            <span>الصياغة والتطوير 2x</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold text-center border ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Creator Tab */}
      {innerTab === 'creator' && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 space-y-5">
          {/* Gender Selection */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-2">
              1. اختر النوع:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectGender('boy')}
                className={`py-2.5 rounded-2xl border-2 text-sm font-black transition-all ${
                  draft.gender === 'boy'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                ولد 👦
              </button>
              <button
                type="button"
                onClick={() => handleSelectGender('girl')}
                className={`py-2.5 rounded-2xl border-2 text-sm font-black transition-all ${
                  draft.gender === 'girl'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                بنت 👧
              </button>
            </div>
          </div>

          {/* 4 Base Presets */}
          <div>
            <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-2">
              2. اختر الشخصية الجاهزة (4 نماذج بكسل):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AVATAR_PRESETS.map((preset) => {
                const selected = draft.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                      selected
                        ? isKid
                          ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 shadow-md ring-2 ring-rose-400/40'
                          : 'border-[#2D6A4F] bg-emerald-50/70 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-400/40'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="w-16 h-20 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-gray-200 dark:border-gray-700 flex items-center justify-center p-1 shadow-inner">
                      <PixelAvatar
                        config={{
                          gender: preset.gender,
                          preset: preset.id,
                          hairColor: preset.hairColor,
                          skinTone: preset.skinTone,
                          shirtColor: preset.shirtColor,
                          pantsColor: preset.pantsColor,
                          glasses: 'none',
                          hat: 'none',
                          outfit: 'default',
                          handItem: 'none',
                          background: 'plain',
                          unlockedItems: [],
                          enchantedItems: []
                        }}
                        size={64}
                        className="rounded-lg"
                      />
                    </div>
                    <span className="text-[11px] font-extrabold text-gray-800 dark:text-gray-100 text-center leading-tight">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Free Color Customizers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-2">
                لون الشعر:
              </label>
              <div className="flex flex-wrap gap-2">
                {HAIR_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, hairColor: hex }))}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      draft.hairColor === hex
                        ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-amber-400'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={`لون شعر ${hex}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-2">
                لون البشرة:
              </label>
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, skinTone: hex }))}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      draft.skinTone === hex
                        ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-amber-400'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={`لون بشرة ${hex}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-2">
                لون القميص / السترة:
              </label>
              <div className="flex flex-wrap gap-2">
                {CLOTHING_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, shirtColor: hex }))}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      draft.shirtColor === hex
                        ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-amber-400'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={`لون قميص ${hex}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-200 mb-2">
                لون البنطال / التنورة:
              </label>
              <div className="flex flex-wrap gap-2">
                {CLOTHING_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, pantsColor: hex }))}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      draft.pantsColor === hex
                        ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-amber-400'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={`لون بنطال ${hex}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={handleSaveCreator}
            className={`w-full min-h-[46px] rounded-2xl text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isKid
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-105'
                : 'bg-[#2D6A4F] hover:bg-[#1b4332]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{busy ? 'جاري الحفظ...' : 'حفظ تصميم الشخصية في السحابة'}</span>
          </button>
        </div>
      )}

      {/* Shop Tab */}
      {innerTab === 'shop' && (
        <div className="space-y-4">
          {/* Category Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setShopCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap border transition-all ${
                  shopCategory === cat.id
                    ? isKid
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleItems.map((item) => {
              const slotValue = progress.avatar?.[item.category];
              const isEquipped = slotValue === item.id;
              const isFreeDefault = item.price === 0 && !item.isMilestoneReward && !item.isCraftOnly;
              const isUnlocked = isFreeDefault || unlockedSet.has(item.id);
              const isEnchanted = enchantedSet.has(item.id);
              const canAfford = !item.isCraftOnly && progress.langCoins >= item.price;

              const previewConfig: PixelAvatarConfig = {
                ...progress.avatar,
                [item.category]: item.id
              };

              return (
                <div
                  key={`${item.category}-${item.id}`}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isEquipped
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 shadow-sm'
                      : item.isCraftOnly
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shrink-0">
                      <PixelAvatar
                        config={previewConfig}
                        size={50}
                        forceEnchanted={isEnchanted}
                        className="rounded-lg overflow-hidden"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                          {item.nameAr}
                        </h4>
                        {isEnchanted && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white text-[9px] font-black">
                            ✨ مطور 2x
                          </span>
                        )}
                      </div>
                      {item.isCraftOnly ? (
                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-0.5 leading-snug">
                          {isUnlocked
                            ? `⚒️ قطعة حصرية مصنوعة (${item.craftRecipeLabel || 'وصفة صياغة'})`
                            : `⚒️ يُصنع في طاولة الصياغة (${item.craftRecipeLabel || 'موارد الكاميرا'})`}
                        </p>
                      ) : item.isMilestoneReward ? (
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5 leading-snug">
                          {isUnlocked
                            ? '🏆 جائزة مستكشف الكاميرا (مفتوحة)'
                            : `🔒 صوّر ${Math.min(scannedCount, 10)}/10 أغراض بالعدسة الذكية`}
                        </p>
                      ) : isFreeDefault ? (
                        <p className="text-[11px] font-bold text-gray-400 mt-0.5">مجاني (افتراضي)</p>
                      ) : (
                        <p className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
                          🪙 {item.price} LangCoins
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isEquipped ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-black">
                        <Check className="w-3.5 h-3.5" />
                        <span>مُرتدى</span>
                      </span>
                    ) : isUnlocked ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleItemAction(item)}
                        className="px-3.5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-extrabold hover:opacity-90 transition-opacity"
                      >
                        ارتداء
                      </button>
                    ) : item.isCraftOnly ? (
                      <button
                        type="button"
                        onClick={() => handleItemAction(item)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-extrabold shadow-xs"
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>اصنعها ⚒️</span>
                      </button>
                    ) : item.isMilestoneReward ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-500 text-[11px] font-bold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>مهمة العدسة</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || !canAfford}
                        onClick={() => handleItemAction(item)}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        شراء ({item.price})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Crafting & Enchanting Workshop Tab */}
      {innerTab === 'workshop' && (
        <CraftingWorkshopPanel
          mode={mode}
          progress={progress}
          authToken={authToken}
          onUserUpdated={onUserUpdated}
          onGoToLens={onGoToLens}
          onGoToChat={onGoToChat}
        />
      )}
    </div>
  );
};

interface AvatarShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AppMode;
  progress: UserProgress;
  authToken: string | null;
  onUserUpdated: (updatedUser: CloudUser) => void;
  onGoToLens?: () => void;
  onGoToChat?: () => void;
}

export const AvatarShopModal: React.FC<AvatarShopModalProps> = ({
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
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
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
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                متجر التخصيص والشخصية البكسل
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                خصص شخصيتك مجاناً، اشترِ بالعملات، أو اصنع وطوّر إكسسوارات حصرية!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors"
            aria-label="إغلاق متجر التخصيص"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <AvatarShopPanel
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
