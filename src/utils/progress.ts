import { AppMode, BadgeId, UserProgress } from '../types';

export type { BadgeId, UserProgress };

export interface BadgeDefinition {
  id: BadgeId;
  title: string;
  desc: string;
  conditionCheck: (p: UserProgress) => boolean;
}

export function getProgressStorageKey(mode: AppMode): string {
  return `rafeeq_user_progress_v2_${mode}`;
}

export const INITIAL_PROGRESS: UserProgress = {
  stars: 0,
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  translationsCount: 0,
  challengeQuestionsCount: 0,
  lensScansCount: 0,
  chatMessagesCount: 0,
  unlockedBadges: {},
  vocabulary: [],
  unlockedCharacters: {},
  purchasedItems: {},
  streakShieldActive: false,
  secondChanceHearts: 0
};

export const KIDS_BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'hero_translator',
    title: 'بطل النجوم الفضائية',
    desc: 'أكمل أول ترجمة في المترجم الذكي وأجب عن أول سؤال في الألعاب والتحديات',
    conditionCheck: (p) => p.translationsCount >= 1 && p.challengeQuestionsCount >= 1
  },
  {
    id: 'lens_explorer',
    title: 'مكتشف العدسة الذكية',
    desc: 'امسح أو تعرّف على أول غرض باستخدام العدسة الذكية',
    conditionCheck: (p) => p.lensScansCount >= 1
  },
  {
    id: 'astronaut_friend',
    title: 'صديق رائد الفضاء',
    desc: 'أرسل 3 رسائل حقيقية على الأقل في محادثة نجم',
    conditionCheck: (p) => p.chatMessagesCount >= 3
  },
  {
    id: 'golden_castle',
    title: 'ملك القلعة الذهبية',
    desc: 'اجمع 100 نجمة حقيقية من أنشطتك التعليمية',
    conditionCheck: (p) => p.stars >= 100
  }
];

export const ADULT_BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'hero_translator',
    title: 'خبير اللهجات والاختصارات',
    desc: 'أكمل أول ترجمة بالعامية أو الرسمية وأجب عن أول سؤال في التحدي اليومي',
    conditionCheck: (p) => p.translationsCount >= 1 && p.challengeQuestionsCount >= 1
  },
  {
    id: 'lens_explorer',
    title: 'مستكشف الواقع الذكي',
    desc: 'امسح وحلل أول عنصر أو نص من الواقع باستخدام العدسة الذكية',
    conditionCheck: (p) => p.lensScansCount >= 1
  },
  {
    id: 'astronaut_friend',
    title: 'محاور بطلاقة',
    desc: 'أرسل 3 رسائل حقيقية على الأقل في محادثة الشخصيات للكبار',
    conditionCheck: (p) => p.chatMessagesCount >= 3
  },
  {
    id: 'golden_castle',
    title: 'أسطورة الإنجليزية',
    desc: 'اجمع 100 نقطة خبرة (XP) أو أكثر من أنشطتك التعليمية',
    conditionCheck: (p) => p.xp >= 100
  }
];

export function getBadgeDefinitions(mode: AppMode): BadgeDefinition[] {
  return mode === 'kid' ? KIDS_BADGE_DEFINITIONS : ADULT_BADGE_DEFINITIONS;
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
}

export function getTwoDaysAgoDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return getLocalDateKey(d);
}

export function getEffectiveStreak(progress: UserProgress): number {
  if (!progress.lastActiveDate || progress.streak <= 0) return 0;
  const today = getLocalDateKey();
  const yesterday = getYesterdayDateKey();
  const twoDaysAgo = getTwoDaysAgoDateKey();
  if (progress.lastActiveDate === today || progress.lastActiveDate === yesterday) {
    return progress.streak;
  }
  if (progress.lastActiveDate === twoDaysAgo && progress.streakShieldActive) {
    return progress.streak;
  }
  return 0;
}

export function getSkillLevelInfo(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  percent: number;
} {
  const thresholds = [0, 50, 120, 220, 350, 500, 700, 950, 1250];
  let level = 1;
  let currentMin = 0;
  let nextMin = 50;

  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) {
      level = i + 1;
      currentMin = thresholds[i];
      nextMin = thresholds[i + 1] ?? thresholds[i] + 300;
    } else {
      break;
    }
  }

  const span = Math.max(1, nextMin - currentMin);
  const progressInLevel = Math.max(0, xp - currentMin);
  const percent = Math.min(100, Math.round((progressInLevel / span) * 100));

  return {
    level,
    currentLevelXp: progressInLevel,
    nextLevelXp: span,
    percent
  };
}

export interface DiscordRole {
  nameEn: string;
  nameAr: string;
  dotClass: string;
  pillClass: string;
}

export function getDiscordRoleInfo(xp: number, mode: 'kid' | 'adult'): DiscordRole {
  if (mode === 'kid') {
    if (xp >= 350) {
      return {
        nameEn: 'Galaxy Hero',
        nameAr: 'بطل المجرة',
        dotClass: 'bg-rose-500',
        pillClass:
          'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
      };
    }
    if (xp >= 120) {
      return {
        nameEn: 'Star Hunter',
        nameAr: 'صائد النجوم',
        dotClass: 'bg-orange-500',
        pillClass:
          'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30'
      };
    }
    return {
      nameEn: 'Space Cadet',
      nameAr: 'طالب الفضاء',
      dotClass: 'bg-amber-400',
      pillClass:
        'bg-amber-400/15 text-amber-800 dark:text-amber-300 border-amber-400/40'
    };
  }

  if (xp >= 350) {
    return {
      nameEn: 'Native Legend',
      nameAr: 'أسطورة الإنجليزية',
      dotClass: 'bg-purple-500',
      pillClass:
        'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
    };
  }
  if (xp >= 120) {
    return {
      nameEn: 'Slang Explorer',
      nameAr: 'مستكشف العامية',
      dotClass: 'bg-sky-500',
      pillClass:
        'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
    };
  }
  return {
    nameEn: 'Newcomer',
    nameAr: 'عضو جديد',
    dotClass: 'bg-emerald-500',
    pillClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  };
}

export function loadProgress(mode: AppMode): UserProgress {
  try {
    const raw = localStorage.getItem(getProgressStorageKey(mode));
    if (!raw) {
      return {
        ...INITIAL_PROGRESS,
        unlockedBadges: {}
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_PROGRESS,
      ...parsed,
      unlockedBadges: { ...(parsed?.unlockedBadges || {}) }
    };
  } catch {
    return {
      ...INITIAL_PROGRESS,
      unlockedBadges: {}
    };
  }
}

export function saveProgress(mode: AppMode, progress: UserProgress): void {
  try {
    localStorage.setItem(getProgressStorageKey(mode), JSON.stringify(progress));
  } catch (err) {
    console.warn('Could not save user progress:', err);
  }
}

export type ActivityType = 'translation' | 'lens' | 'chat' | 'challenge';

export function recordUserActivity(
  prev: UserProgress,
  type: ActivityType,
  earnedPoints: number,
  mode: AppMode
): {
  nextProgress: UserProgress;
  newlyUnlocked: BadgeDefinition[];
} {
  const today = getLocalDateKey();
  const yesterday = getYesterdayDateKey();
  const twoDaysAgo = getTwoDaysAgoDateKey();

  let nextStreak = prev.streak;
  let nextStreakShieldActive = Boolean(prev.streakShieldActive);
  if (prev.lastActiveDate === today) {
    nextStreak = Math.max(1, prev.streak);
  } else if (prev.lastActiveDate === yesterday) {
    nextStreak = prev.streak + 1;
  } else if (prev.lastActiveDate === twoDaysAgo && prev.streak > 0 && prev.streakShieldActive) {
    nextStreak = prev.streak + 1;
    nextStreakShieldActive = false;
  } else {
    nextStreak = 1;
  }

  const effectivePoints = Math.max(0, earnedPoints);

  const next: UserProgress = {
    ...prev,
    stars: prev.stars + effectivePoints,
    xp: prev.xp + effectivePoints,
    streak: nextStreak,
    streakShieldActive: nextStreakShieldActive,
    lastActiveDate: today,
    translationsCount:
      prev.translationsCount + (type === 'translation' ? 1 : 0),
    lensScansCount: prev.lensScansCount + (type === 'lens' ? 1 : 0),
    chatMessagesCount: prev.chatMessagesCount + (type === 'chat' ? 1 : 0),
    challengeQuestionsCount:
      prev.challengeQuestionsCount + (type === 'challenge' ? 1 : 0),
    unlockedBadges: { ...prev.unlockedBadges }
  };

  const newlyUnlocked: BadgeDefinition[] = [];
  for (const badge of getBadgeDefinitions(mode)) {
    if (!next.unlockedBadges[badge.id] && badge.conditionCheck(next)) {
      next.unlockedBadges[badge.id] = true;
      newlyUnlocked.push(badge);
    }
  }

  return {
    nextProgress: next,
    newlyUnlocked
  };
}
