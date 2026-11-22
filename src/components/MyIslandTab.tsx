import React, { useState } from 'react';
import type { AppMode, CloudUser, ResourceInventory, UserIslandData } from '../types';
import { ISLAND_ITEMS, ISLAND_ITEMS_MAP } from '../data/islandCatalog';
import { PixelIslandCanvas } from './PixelIslandCanvas';
import {
  Compass,
  Hammer,
  Heart,
  HelpCircle,
  Info,
  Loader2,
  Sparkles,
  Trash2,
  Trophy
} from 'lucide-react';

interface MyIslandTabProps {
  mode: AppMode;
  authToken: string | null;
  cloudUser: CloudUser | null;
  islandData: UserIslandData;
  resources: ResourceInventory;
  langCoins: number;
  onUserUpdated: (user: CloudUser) => void;
  onOpenLeaderboard: () => void;
  onOpenWorkshop?: () => void;
}

export const MyIslandTab: React.FC<MyIslandTabProps> = ({
  mode,
  authToken,
  cloudUser,
  islandData,
  resources,
  langCoins,
  onUserUpdated,
  onOpenLeaderboard,
  onOpenWorkshop
}) => {
  const isKid = mode === 'kid';
  const [selectedItemId, setSelectedItemId] = useState<string | null>('house');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isPlacing, setIsPlacing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => {
      setToastMsg((cur) => (cur?.text === text ? null : cur));
    }, 4000);
  };

  const filteredItems = ISLAND_ITEMS.filter((it) => {
    if (activeCategory === 'all') return true;
    return it.category === activeCategory;
  });

  const selectedDef = selectedItemId && selectedItemId !== 'demolish'
    ? ISLAND_ITEMS_MAP[selectedItemId]
    : null;

  const handleTileClick = async (x: number, y: number) => {
    if (isPlacing) return;
    if (!authToken) {
      showToast('يرجى تسجيل الدخول لحفظ مباني جزيرتك سحابياً.', true);
      return;
    }

    if (!selectedItemId) {
      showToast('يرجى اختيار عنصر من الأسفل أو اختيار مجرفة الإزالة.', true);
      return;
    }

    // Client-side quick check
    if (selectedItemId !== 'demolish') {
      const def = ISLAND_ITEMS_MAP[selectedItemId];
      if (def) {
        if (def.cost.resource && def.cost.resourceCount) {
          const haveRes = resources[def.cost.resource] || 0;
          if (haveRes < def.cost.resourceCount) {
            showToast(`لا تملك موارد كافية! تحتاج إلى ${def.cost.resourceCount} من مورد الكاميرا.`, true);
            return;
          }
        }
        if (def.cost.langCoins > 0 && langCoins < def.cost.langCoins) {
          showToast(`رصيد LangCoins غير كافٍ! تحتاج إلى ${def.cost.langCoins} 🪙.`, true);
          return;
        }
      }
    }

    setIsPlacing(true);
    try {
      const res = await fetch('/api/island/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          mode,
          x,
          y,
          itemId: selectedItemId
        })
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        showToast(json.error || 'تعذر البناء على هذا المربع.', true);
      } else {
        showToast(json.message || 'تم تحديث الجزيرة بنجاح! 🏝️');
        if (json.user) {
          onUserUpdated(json.user);
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'تعذر الاتصال بالخادم.', true);
    } finally {
      setIsPlacing(false);
    }
  };

  const canAfford = (item: typeof ISLAND_ITEMS[0]) => {
    if (item.cost.resource && item.cost.resourceCount) {
      if ((resources[item.cost.resource] || 0) < item.cost.resourceCount) return false;
    }
    if (item.cost.langCoins > 0 && langCoins < item.cost.langCoins) return false;
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 pb-28 space-y-4" dir="rtl">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div
            className={`pointer-events-auto max-w-md w-full px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-black flex items-center gap-2.5 animate-bounce ${
              toastMsg.isError
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            <span className="text-base">{toastMsg.isError ? '⚠️' : '✨'}</span>
            <span className="flex-1">{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl">🏝️</span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {isKid ? 'جزيرتي البكسلية الخاصة 🧸' : 'الجزيرة البكسلية 🎓'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-300" />
                <span>{islandData?.likes || 0} إعجاب</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-50 font-medium">
              حوّل تعلمك ومفرداتك إلى مبانٍ، أشجار، حيوانات وديكورات بكسل حقيقية على شبكة 8×8!
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>زيارة جزر الأصدقاء ⛵</span>
            </button>
            {onOpenWorkshop && (
              <button
                type="button"
                onClick={onOpenWorkshop}
                className="min-h-[44px] px-3 py-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Hammer className="w-4 h-4 text-amber-300" />
                <span>ورشة الصياغة</span>
              </button>
            )}
          </div>
        </div>

        {/* Resources Summary Strip */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs font-bold">
          <span className="text-emerald-100 shrink-0">مواردك المتاحة:</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 backdrop-blur-sm shrink-0">
            <span>🪵 خشب:</span>
            <span className="text-amber-300 font-black">{resources.wood}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 backdrop-blur-sm shrink-0">
            <span>🪟 زجاج:</span>
            <span className="text-sky-300 font-black">{resources.glass}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 backdrop-blur-sm shrink-0">
            <span>⛓️ حديد:</span>
            <span className="text-slate-200 font-black">{resources.iron}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 backdrop-blur-sm shrink-0">
            <span>🧶 صوف:</span>
            <span className="text-rose-300 font-black">{resources.wool}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 backdrop-blur-sm shrink-0">
            <span>🪙 LangCoins:</span>
            <span className="text-yellow-300 font-black">{langCoins}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative">
        <PixelIslandCanvas
          island={islandData}
          avatarConfig={cloudUser?.profiles[mode]?.progress.avatar}
          userName={cloudUser?.username || 'أنت'}
          selectedItemId={selectedItemId}
          onTileClick={handleTileClick}
          isReadOnly={false}
          isVisiting={false}
        />

        {isPlacing && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>جاري حفظ البناء سحابياً...</span>
          </div>
        )}
      </div>

      {/* Builder Toolbar Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-5 shadow-lg border border-gray-200 dark:border-gray-800 space-y-4">
        {/* Category Tabs & Shovel */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'building', label: 'مبانٍ 🏠' },
              { id: 'nature', label: 'طبيعة 🌲' },
              { id: 'animal', label: 'حيوانات 🐑' },
              { id: 'decoration', label: 'ديكور 🚧' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (selectedItemId === 'demolish') {
                    setSelectedItemId('house');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat.id && selectedItemId !== 'demolish'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Demolish Tool */}
          <button
            type="button"
            onClick={() => setSelectedItemId('demolish')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
              selectedItemId === 'demolish'
                ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>مجرفة الإزالة 🧹</span>
          </button>
        </div>

        {/* Selected Item Info Banner */}
        {selectedItemId === 'demolish' ? (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <span className="text-base">🧹</span>
            <span>
              وضع الإزالة مفعّل: انقر على أي مربع في شبكة الجزيرة لإخلائه وإعادته مرجاً أخضر نظيفاً!
            </span>
          </div>
        ) : selectedDef ? (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedDef.emoji}</span>
              <div>
                <span className="font-black text-sm">{selectedDef.nameAr}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium mr-2">
                  ({selectedDef.nameEn})
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedDef.descAr}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-black text-xs">
              <span>التكلفة:</span>
              {selectedDef.cost.resource && (
                <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-emerald-300">
                  {selectedDef.cost.resourceCount}{' '}
                  {selectedDef.cost.resource === 'wood'
                    ? 'خشب 🪵'
                    : selectedDef.cost.resource === 'wool'
                    ? 'صوف 🧶'
                    : selectedDef.cost.resource === 'iron'
                    ? 'حديد ⛓️'
                    : 'زجاج 🪟'}
                </span>
              )}
              {selectedDef.cost.langCoins > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300">
                  {selectedDef.cost.langCoins} 🪙
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {filteredItems.map((item) => {
            const isSelected = selectedItemId === item.id;
            const affordable = canAfford(item);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 min-h-[110px] ${
                  isSelected
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-500 shadow-md ring-2 ring-emerald-400'
                    : 'bg-gray-50/70 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-2xl">{item.emoji}</span>
                  {!affordable && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      مورد ناقص
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                      محدد
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-black text-xs text-gray-900 dark:text-white truncate">
                    {item.nameAr}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate" dir="ltr">
                    {item.nameEn}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-200/50 dark:border-gray-700/50 flex-wrap">
                  {item.cost.resource && (
                    <span className="text-emerald-700 dark:text-emerald-300">
                      {item.cost.resourceCount}{' '}
                      {item.cost.resource === 'wood'
                        ? '🪵'
                        : item.cost.resource === 'wool'
                        ? '🧶'
                        : item.cost.resource === 'iron'
                        ? '⛓️'
                        : '🪟'}
                    </span>
                  )}
                  {item.cost.langCoins > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {item.cost.langCoins} 🪙
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Educational Guide Card */}
      <div className="p-4 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-black text-sm">كيف تجمع موارد وعملات لبناء جزيرتك؟</h4>
          <ul className="list-disc list-inside space-y-0.5 text-gray-700 dark:text-gray-300">
            <li>
              <strong>العدسة الذكية 📸:</strong> صوّر أغراضاً حقيقية حولك (ملابس 🧶، أكواب 🪟، مفاتيح ⛓️، طاولات 🪵) لجمع الموارد وتكسب +10 LangCoins لكل مسح!
            </li>
            <li>
              <strong>المترجم والألعاب 🌟:</strong> كل ترجمة تمنحك +10 عملات، وكل سؤال تجيب عليه يمنحك +15 عملة ونقاط خبرة!
            </li>
            <li>
              <strong>لوحة المتصدرين 🏆:</strong> زُر جزر زملائك في قائمة المتصدرين وسجل إعجابك ❤️ بجزرهم المميزة!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
