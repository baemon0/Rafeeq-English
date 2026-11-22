import React, { useEffect, useState } from 'react';
import type { AppMode, PixelAvatarConfig, UserIslandData } from '../types';
import { PixelAvatar } from './PixelAvatar';
import { PixelIslandCanvas } from './PixelIslandCanvas';
import { Heart, Loader2, Sparkles, Trophy, X } from 'lucide-react';

interface FriendIslandModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string | null;
  targetUsername?: string;
  mode: AppMode;
  authToken: string | null;
}

interface IslandResponse {
  ok: boolean;
  island: UserIslandData;
  userId: string;
  username: string;
  avatar: PixelAvatarConfig;
  level: number;
  role: { nameEn: string; nameAr: string; dotClass: string; pillClass: string };
  isLikedByMe: boolean;
  isOwn: boolean;
}

export const FriendIslandModal: React.FC<FriendIslandModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUsername = 'الصديق',
  mode,
  authToken
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<IslandResponse | null>(null);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !targetUserId) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    const fetchFriendIsland = async () => {
      try {
        const headers: Record<string, string> = {};
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }
        const res = await fetch(`/api/island?userId=${targetUserId}&mode=${mode}`, { headers });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'تعذر تحميل جزيرة الصديق.');
        }
        if (isMounted) {
          setData(json);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err?.message || 'حدث خطأ أثناء تحميل الجزيرة.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFriendIsland();

    return () => {
      isMounted = false;
    };
  }, [isOpen, targetUserId, mode, authToken]);

  if (!isOpen || !targetUserId) return null;

  const handleToggleLike = async () => {
    if (isLiking || !authToken || !data || data.isOwn) return;
    setIsLiking(true);
    try {
      const res = await fetch('/api/island/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ targetUserId, mode })
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                island: {
                  ...prev.island,
                  likes: json.likes
                },
                isLikedByMe: json.isLikedByMe
              }
            : null
        );
      }
    } catch (err) {
      console.warn('Like toggle failed:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-emerald-500/30 flex flex-col overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white dark:from-emerald-950/40 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-2xl bg-white dark:bg-gray-800 border border-emerald-400 shadow-sm shrink-0">
              <PixelAvatar config={data?.avatar} size={44} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  جزيرة {data?.username || targetUsername} 🏝️
                </h3>
                {data?.role && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${data.role.pillClass}`}
                    dir="ltr"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${data.role.dotClass}`} />
                    <span>{data.role.nameEn}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                مستوى {data?.level || 1} · {data?.island?.name || 'جزيرتي البكسلية'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Like Button */}
            {data && !data.isOwn && (
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={isLiking}
                className={`min-h-[44px] px-4 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  data.isLikedByMe
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-transform ${
                    data.isLikedByMe ? 'fill-white scale-110' : 'text-rose-500'
                  } ${isLiking ? 'animate-pulse' : ''}`}
                />
                <span>{data.island.likes} إعجاب</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-emerald-600">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                جاري الإبحار إلى جزيرة {targetUsername}... ⛵
              </p>
            </div>
          )}

          {!loading && errorMsg && (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-bold text-rose-600">{errorMsg}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
              >
                العودة
              </button>
            </div>
          )}

          {!loading && !errorMsg && data && (
            <>
              {/* Island Canvas (Read-Only) */}
              <PixelIslandCanvas
                island={data.island}
                avatarConfig={data.avatar}
                userName={data.username}
                isReadOnly={true}
                isVisiting={true}
              />

              {/* Island Stats & Achievements */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      المباني والديكورات
                    </div>
                    <div className="text-sm font-black text-gray-900 dark:text-white">
                      {data.island.tiles.length} من 64 مربع
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-xs">
                    <Heart className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      إعجابات الزوار
                    </div>
                    <div className="text-sm font-black text-gray-900 dark:text-white">
                      {data.island.likes} إعجاب ❤️
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      مستوى المتعلم
                    </div>
                    <div className="text-sm font-black text-gray-900 dark:text-white">
                      المستوى {data.level} ({data.role.nameAr})
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Note */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <span className="text-base">🎓</span>
                <span>
                  تزدهر وتكبر هذه الجزيرة كلما أتم {data.username} أنشطة الترجمة والعدسة الذكية
                  وصناعة الموارد في رفيق الإنجليزية!
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
