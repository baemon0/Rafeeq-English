import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  AppMode,
  CloudUser,
  KnowledgeStory,
  LeaderboardEntry,
  ModeCloudProfile,
  PastTranslationItem,
  StoryKind,
  UserProgress
} from '../src/types';
import { findShopItem } from '../src/data/shopCatalog';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const USERS_FILE = path.resolve(DATA_DIR, 'users.json');
const STORIES_FILE = path.resolve(DATA_DIR, 'stories.json');
const SESSIONS_FILE = path.resolve(DATA_DIR, 'sessions.json');

export interface StoredUserRecord {
  id: string;
  username: string;
  usernameLower: string;
  passwordHash: string;
  defaultMode: AppMode;
  createdAt: number;
  profiles: {
    kid: ModeCloudProfile;
    adult: ModeCloudProfile;
  };
}

interface SessionEntry {
  userId: string;
  createdAt: number;
}

const usersByUsername = new Map<string, StoredUserRecord>();
const usersById = new Map<string, StoredUserRecord>();
const sessions = new Map<string, SessionEntry>();

function createEmptyProgress(): UserProgress {
  return {
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
}

export function createEmptyModeProfile(): ModeCloudProfile {
  return {
    progress: createEmptyProgress(),
    weeklyTracker: {
      firstUsedDate: Date.now(),
      completedDailySets: 0
    },
    dailyQuiz: null,
    askedHistory: [],
    pastTranslations: []
  };
}

function normalizeLoadedProfile(raw: any): ModeCloudProfile {
  const empty = createEmptyModeProfile();
  if (!raw || typeof raw !== 'object') return empty;

  return {
    progress: {
      stars: Math.max(0, Number(raw.progress?.stars) || 0),
      xp: Math.max(0, Number(raw.progress?.xp) || 0),
      streak: Math.max(0, Number(raw.progress?.streak) || 0),
      lastActiveDate:
        typeof raw.progress?.lastActiveDate === 'string'
          ? raw.progress.lastActiveDate
          : null,
      translationsCount: Math.max(0, Number(raw.progress?.translationsCount) || 0),
      challengeQuestionsCount: Math.max(0, Number(raw.progress?.challengeQuestionsCount) || 0),
      lensScansCount: Math.max(0, Number(raw.progress?.lensScansCount) || 0),
      chatMessagesCount: Math.max(0, Number(raw.progress?.chatMessagesCount) || 0),
      unlockedBadges: {
        ...(raw.progress?.unlockedBadges && typeof raw.progress.unlockedBadges === 'object'
          ? raw.progress.unlockedBadges
          : {})
      },
      vocabulary: Array.isArray(raw.progress?.vocabulary)
        ? raw.progress.vocabulary.map((v: any) => ({
            id: String(v.id || Date.now() + Math.random()),
            word: String(v.word || ''),
            meaning: String(v.meaning || ''),
            masteryLevel: Math.max(0, Math.min(3, Number(v.masteryLevel) || 0)),
            nextReviewDate: Number(v.nextReviewDate) || Date.now(),
            lastReviewed: Number(v.lastReviewed) || Date.now()
          }))
        : [],
      unlockedCharacters: {
        ...(raw.progress?.unlockedCharacters && typeof raw.progress.unlockedCharacters === 'object'
          ? raw.progress.unlockedCharacters
          : {})
      },
      purchasedItems: {
        ...(raw.progress?.purchasedItems && typeof raw.progress.purchasedItems === 'object'
          ? raw.progress.purchasedItems
          : {})
      },
      streakShieldActive: Boolean(raw.progress?.streakShieldActive),
      secondChanceHearts: Math.max(0, Number(raw.progress?.secondChanceHearts) || 0)
    },
    weeklyTracker: {
      firstUsedDate:
        typeof raw.weeklyTracker?.firstUsedDate === 'number' && raw.weeklyTracker.firstUsedDate > 0
          ? raw.weeklyTracker.firstUsedDate
          : Date.now(),
      completedDailySets:
        typeof raw.weeklyTracker?.completedDailySets === 'number' && raw.weeklyTracker.completedDailySets >= 0
          ? raw.weeklyTracker.completedDailySets
          : 0
    },
    dailyQuiz: raw.dailyQuiz && typeof raw.dailyQuiz === 'object' ? raw.dailyQuiz : null,
    askedHistory: Array.isArray(raw.askedHistory)
      ? raw.askedHistory.filter((q: any) => typeof q === 'string').slice(-500)
      : [],
    pastTranslations: Array.isArray(raw.pastTranslations)
      ? raw.pastTranslations.slice(-100)
      : []
  };
}

function loadUsersFromDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      return;
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    for (const item of parsed) {
      if (item && typeof item.id === 'string' && typeof item.usernameLower === 'string' && typeof item.passwordHash === 'string') {
        const record: StoredUserRecord = {
          id: item.id,
          username: String(item.username || item.usernameLower),
          usernameLower: item.usernameLower,
          passwordHash: item.passwordHash,
          defaultMode: item.defaultMode === 'kid' ? 'kid' : 'adult',
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
          profiles: {
            kid: normalizeLoadedProfile(item.profiles?.kid),
            adult: normalizeLoadedProfile(item.profiles?.adult)
          }
        };
        usersByUsername.set(record.usernameLower, record);
        usersById.set(record.id, record);
      }
    }
  } catch (err) {
    console.warn('Could not load users.json, starting fresh store:', err);
  }
}

export function persistUsersToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const allUsers = Array.from(usersById.values());
    const tmpFile = `${USERS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(allUsers, null, 2), 'utf-8');
    fs.renameSync(tmpFile, USERS_FILE);
  } catch (err) {
    console.error('Failed to persist users.json:', err);
  }
}

function loadSessionsFromDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SESSIONS_FILE)) return;
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    for (const [token, entry] of Object.entries(parsed)) {
      const e = entry as SessionEntry;
      if (typeof token === 'string' && e && typeof e.userId === 'string' && usersById.has(e.userId)) {
        sessions.set(token, { userId: e.userId, createdAt: Number(e.createdAt) || Date.now() });
      }
    }
  } catch (err) {
    console.warn('Could not load sessions.json, starting fresh sessions:', err);
  }
}

function persistSessionsToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const serialized: Record<string, SessionEntry> = {};
    for (const [token, entry] of sessions.entries()) {
      serialized[token] = entry;
    }
    const tmpFile = `${SESSIONS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(serialized, null, 2), 'utf-8');
    fs.renameSync(tmpFile, SESSIONS_FILE);
  } catch (err) {
    console.error('Failed to persist sessions.json:', err);
  }
}

loadUsersFromDisk();
loadSessionsFromDisk();

const WEAK_PASSWORDS = new Set([
  '1234',
  '12345',
  '123456',
  '1234567',
  '12345678',
  '87654321',
  '0000',
  '00000',
  '000000',
  '00000000',
  '1111',
  '111111',
  '11111111',
  'abcd',
  'abc123',
  'qwerty',
  'password',
  'admin',
  'pass',
  'test',
  'user'
]);

const ALLOWED_PASSWORD_REGEX = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]+$/;

export function validatePasswordStrict(password: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, error: 'يرجى إدخال كلمة المرور.' };
  }
  if (password.length > 8) {
    return { ok: false, error: 'كلمة المرور يجب ألا تتجاوز 8 خانات كحد أقصى.' };
  }
  if (!ALLOWED_PASSWORD_REGEX.test(password)) {
    return {
      ok: false,
      error: 'كلمة المرور تقبل الأحرف الإنجليزية والأرقام والرموز فقط (بدون مسافات أو حروف عربية).'
    };
  }
  if (password.length < 4) {
    return {
      ok: false,
      error: 'كلمة المرور ضعيفة جداً! يجب أن تكون بين 4 و 8 خانات.'
    };
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) {
    return {
      ok: false,
      error: 'كلمة المرور ضعيفة وسهلة التخمين! اختر كلمة مرور أقوى.'
    };
  }
  return { ok: true, value: password };
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHashHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHashHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

function isPasswordAlreadyUsed(password: string): boolean {
  let count = 0;
  for (const user of usersById.values()) {
    if (++count > 200) break;
    if (verifyPassword(password, user.passwordHash)) {
      return true;
    }
  }
  return false;
}

export function sanitizeCloudUser(user: StoredUserRecord): CloudUser {
  return {
    id: user.id,
    username: user.username,
    defaultMode: user.defaultMode,
    profiles: {
      kid: user.profiles.kid,
      adult: user.profiles.adult
    }
  };
}

export function registerUser(
  rawUsername: unknown,
  rawPassword: unknown,
  rawMode: unknown
): { ok: true; token: string; user: CloudUser } | { ok: false; status: number; error: string } {
  if (typeof rawUsername !== 'string') {
    return { ok: false, status: 400, error: 'يرجى إدخال اسم مستخدم صحيح.' };
  }
  const username = rawUsername.trim();
  if (username.length < 2 || username.length > 24) {
    return { ok: false, status: 400, error: 'اسم المستخدم يجب أن يكون بين 2 و 24 حرفاً.' };
  }

  const usernameLower = username.toLowerCase();
  if (usersByUsername.has(usernameLower)) {
    return {
      ok: false,
      status: 409,
      error: 'اسم المستخدم هذا محجوز ومستخدم مسبقاً! جرب اسماً آخر أو سجل دخولك.'
    };
  }

  const pwCheck = validatePasswordStrict(rawPassword);
  if (!pwCheck.ok) {
    return { ok: false, status: 400, error: pwCheck.error };
  }

  if (isPasswordAlreadyUsed(pwCheck.value)) {
    return {
      ok: false,
      status: 400,
      error: 'كلمة المرور هذه مستخدمة مسبقاً أو غير آمنة، يرجى اختيار كلمة مرور جديدة مختلفة.'
    };
  }

  const defaultMode: AppMode = rawMode === 'kid' ? 'kid' : 'adult';
  const record: StoredUserRecord = {
    id: crypto.randomUUID(),
    username,
    usernameLower,
    passwordHash: hashPassword(pwCheck.value),
    defaultMode,
    createdAt: Date.now(),
    profiles: {
      kid: createEmptyModeProfile(),
      adult: createEmptyModeProfile()
    }
  };

  usersByUsername.set(usernameLower, record);
  usersById.set(record.id, record);
  persistUsersToDisk();

  const token = createSession(record.id);
  return { ok: true, token, user: sanitizeCloudUser(record) };
}

export function authenticateUser(
  rawUsername: unknown,
  rawPassword: unknown,
  rawMode: unknown
): { ok: true; token: string; user: CloudUser } | { ok: false; status: number; error: string } {
  if (typeof rawUsername !== 'string' || typeof rawPassword !== 'string') {
    return { ok: false, status: 400, error: 'يرجى إدخال اسم المستخدم وكلمة المرور.' };
  }
  const usernameLower = rawUsername.trim().toLowerCase();
  const user = usersByUsername.get(usernameLower);
  if (!user || rawPassword.length > 8 || !verifyPassword(rawPassword, user.passwordHash)) {
    return { ok: false, status: 401, error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
  }

  if (rawMode === 'kid' || rawMode === 'adult') {
    user.defaultMode = rawMode;
    persistUsersToDisk();
  }

  const token = createSession(user.id);
  return { ok: true, token, user: sanitizeCloudUser(user) };
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId, createdAt: Date.now() });
  persistSessionsToDisk();
  return token;
}

export function getUserByToken(token: string | undefined): StoredUserRecord | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  return usersById.get(session.userId) || null;
}

export function revokeSession(token: string | undefined): void {
  if (token) {
    sessions.delete(token);
    persistSessionsToDisk();
  }
}

export function updateUserModeProfile(
  user: StoredUserRecord,
  mode: AppMode,
  patch: Partial<ModeCloudProfile>
): ModeCloudProfile {
  const existing = user.profiles[mode];
  let nextProgress = existing.progress;

  if (patch.progress) {
    nextProgress = {
      stars: Math.max(0, Number(patch.progress.stars) || 0),
      xp: Math.max(0, Number(patch.progress.xp) || 0),
      streak: Math.max(0, Number(patch.progress.streak) || 0),
      lastActiveDate:
        typeof patch.progress.lastActiveDate === 'string'
          ? patch.progress.lastActiveDate
          : null,
      translationsCount: Math.max(0, Number(patch.progress.translationsCount) || 0),
      challengeQuestionsCount: Math.max(0, Number(patch.progress.challengeQuestionsCount) || 0),
      lensScansCount: Math.max(0, Number(patch.progress.lensScansCount) || 0),
      chatMessagesCount: Math.max(0, Number(patch.progress.chatMessagesCount) || 0),
      unlockedBadges:
        patch.progress.unlockedBadges && typeof patch.progress.unlockedBadges === 'object'
          ? { ...patch.progress.unlockedBadges }
          : {},
      vocabulary: (() => {
        const mergedMap = new Map<string, any>();
        for (const v of existing.progress.vocabulary || []) {
          if (v?.word) mergedMap.set(String(v.word).toLowerCase(), v);
        }
        if (Array.isArray(patch.progress.vocabulary)) {
          for (const rawV of patch.progress.vocabulary) {
            const word = String(rawV?.word || '');
            if (!word) continue;
            const key = word.toLowerCase();
            const prevV = mergedMap.get(key);
            const nextLevel = Math.max(0, Math.min(3, Number(rawV.masteryLevel) || 0));
            if (!prevV || nextLevel >= (prevV.masteryLevel || 0)) {
              mergedMap.set(key, {
                id: String(rawV.id || prevV?.id || Date.now()),
                word,
                meaning: String(rawV.meaning || prevV?.meaning || ''),
                masteryLevel: Math.max(nextLevel, prevV?.masteryLevel || 0),
                nextReviewDate: Number(rawV.nextReviewDate) || prevV?.nextReviewDate || Date.now(),
                lastReviewed: Number(rawV.lastReviewed) || prevV?.lastReviewed || Date.now()
              });
            }
          }
        }
        return Array.from(mergedMap.values());
      })(),
      unlockedCharacters:
        patch.progress.unlockedCharacters && typeof patch.progress.unlockedCharacters === 'object'
          ? { ...patch.progress.unlockedCharacters }
          : existing.progress.unlockedCharacters,
      purchasedItems:
        patch.progress.purchasedItems && typeof patch.progress.purchasedItems === 'object'
          ? { ...patch.progress.purchasedItems }
          : existing.progress.purchasedItems,
      streakShieldActive:
        typeof patch.progress.streakShieldActive === 'boolean'
          ? patch.progress.streakShieldActive
          : existing.progress.streakShieldActive,
      secondChanceHearts:
        typeof patch.progress.secondChanceHearts === 'number'
          ? Math.max(0, patch.progress.secondChanceHearts)
          : existing.progress.secondChanceHearts
    };
  }

  const next: ModeCloudProfile = {
    progress: nextProgress,
    weeklyTracker: patch.weeklyTracker
      ? {
          firstUsedDate:
            typeof patch.weeklyTracker.firstUsedDate === 'number' && patch.weeklyTracker.firstUsedDate > 0
              ? patch.weeklyTracker.firstUsedDate
              : existing.weeklyTracker.firstUsedDate,
          completedDailySets: Math.max(0, Number(patch.weeklyTracker.completedDailySets) || 0)
        }
      : existing.weeklyTracker,
    dailyQuiz: patch.dailyQuiz !== undefined ? patch.dailyQuiz : existing.dailyQuiz,
    askedHistory: Array.isArray(patch.askedHistory)
      ? Array.from(
          new Set(
            patch.askedHistory.filter((q): q is string => typeof q === 'string' && q.trim() !== '')
          )
        ).slice(-500)
      : existing.askedHistory,
    pastTranslations: Array.isArray(patch.pastTranslations)
      ? patch.pastTranslations
          .filter(
            (t): t is PastTranslationItem =>
              Boolean(t && typeof t.id === 'string' && typeof t.inputText === 'string' && t.result)
          )
          .slice(-100)
      : existing.pastTranslations
  };

  user.profiles[mode] = next;
  persistUsersToDisk();
  return next;
}

function getServerSkillLevel(xp: number): number {
  const thresholds = [0, 50, 120, 220, 350, 500, 700, 950, 1250];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
    else break;
  }
  return level;
}

function getServerDiscordRole(xp: number, mode: AppMode) {
  if (mode === 'kid') {
    if (xp >= 350) {
      return {
        nameEn: 'Galaxy Hero',
        nameAr: 'بطل المجرة',
        dotClass: 'bg-rose-500',
        pillClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
      };
    }
    if (xp >= 120) {
      return {
        nameEn: 'Star Hunter',
        nameAr: 'صائد النجوم',
        dotClass: 'bg-orange-500',
        pillClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30'
      };
    }
    return {
      nameEn: 'Space Cadet',
      nameAr: 'طالب الفضاء',
      dotClass: 'bg-amber-400',
      pillClass: 'bg-amber-400/15 text-amber-800 dark:text-amber-300 border-amber-400/40'
    };
  }

  if (xp >= 350) {
    return {
      nameEn: 'Native Legend',
      nameAr: 'أسطورة الإنجليزية',
      dotClass: 'bg-purple-500',
      pillClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
    };
  }
  if (xp >= 120) {
    return {
      nameEn: 'Slang Explorer',
      nameAr: 'مستكشف العامية',
      dotClass: 'bg-sky-500',
      pillClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
    };
  }
  return {
    nameEn: 'Newcomer',
    nameAr: 'عضو جديد',
    dotClass: 'bg-emerald-500',
    pillClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  };
}

export function buildLeaderboard(mode: AppMode, currentUserId?: string): LeaderboardEntry[] {
  const candidates = Array.from(usersById.values()).filter((u) => {
    const prof = u.profiles[mode];
    const hasActivity =
      prof.progress.stars > 0 ||
      prof.progress.xp > 0 ||
      prof.progress.translationsCount > 0 ||
      prof.progress.challengeQuestionsCount > 0 ||
      prof.progress.lensScansCount > 0 ||
      prof.progress.chatMessagesCount > 0;
    return u.defaultMode === mode || hasActivity;
  });

  candidates.sort((a, b) => {
    const scoreA = mode === 'kid' ? a.profiles.kid.progress.stars : a.profiles.adult.progress.xp;
    const scoreB = mode === 'kid' ? b.profiles.kid.progress.stars : b.profiles.adult.progress.xp;
    if (scoreB !== scoreA) return scoreB - scoreA;
    const xpDiff = b.profiles[mode].progress.xp - a.profiles[mode].progress.xp;
    if (xpDiff !== 0) return xpDiff;
    return a.createdAt - b.createdAt;
  });

  return candidates.slice(0, 10).map((u, idx) => {
    const prof = u.profiles[mode];
    return {
      rank: idx + 1,
      username: u.username,
      stars: prof.progress.stars,
      xp: prof.progress.xp,
      streak: prof.progress.streak,
      level: getServerSkillLevel(prof.progress.xp),
      role: getServerDiscordRole(prof.progress.xp, mode),
      isCurrentUser: Boolean(currentUserId && u.id === currentUserId),
      galaxyChampion: mode === 'kid' ? Boolean(prof.progress.purchasedItems?.galaxy_champion) : false,
      goldenVipFrame: mode === 'adult' ? Boolean(prof.progress.purchasedItems?.golden_vip_frame) : false
    };
  });
}

export function purchaseShopItem(
  user: StoredUserRecord,
  mode: AppMode,
  itemId: string
): { ok: true; user: CloudUser } | { ok: false; status: number; error: string } {
  const item = findShopItem(itemId, mode);
  if (!item) {
    return { ok: false, status: 400, error: 'العنصر المطلوب غير متوفر في هذا المتجر.' };
  }

  const profile = user.profiles[mode];
  const progress = profile.progress;

  if (item.id === 'streak_shield' && progress.streakShieldActive) {
    return { ok: false, status: 400, error: 'درع حماية السلسلة مُفعّل لديك بالفعل!' };
  }
  if (item.id === 'second_chance_heart' && progress.secondChanceHearts > 0) {
    return { ok: false, status: 400, error: 'لديك فرصة ثانية مُفعّلة وجاهزة للاستخدام!' };
  }
  if (item.category !== 'powerup' && progress.purchasedItems?.[item.id]) {
    return { ok: false, status: 400, error: 'هذا العنصر مملوك ومُفعّل لديك مسبقاً!' };
  }

  const currentBalance = mode === 'kid' ? progress.stars : progress.xp;
  if (currentBalance < item.cost) {
    return {
      ok: false,
      status: 400,
      error: `رصيدك غير كافٍ! تحتاج إلى ${item.cost} ${mode === 'kid' ? 'نجمة' : 'XP'}.`
    };
  }

  if (mode === 'kid') {
    progress.stars -= item.cost;
  } else {
    progress.xp -= item.cost;
  }

  if (!progress.purchasedItems) {
    progress.purchasedItems = {};
  }
  progress.purchasedItems[item.id] = true;

  if (item.unlockCharacterKey) {
    if (!progress.unlockedCharacters) {
      progress.unlockedCharacters = {};
    }
    progress.unlockedCharacters[item.unlockCharacterKey] = true;
  }

  if (item.id === 'streak_shield') {
    progress.streakShieldActive = true;
  } else if (item.id === 'second_chance_heart') {
    progress.secondChanceHearts = (progress.secondChanceHearts || 0) + 1;
  }

  persistUsersToDisk();
  return { ok: true, user: sanitizeCloudUser(user) };
}

// Knowledge Stories Store (Adults Mode Only)
let storiesStore: KnowledgeStory[] = [];

function loadStoriesFromDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORIES_FILE)) {
      return;
    }
    const raw = fs.readFileSync(STORIES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      storiesStore = parsed.slice(-100);
    }
  } catch (err) {
    console.warn('Could not load stories.json, starting empty:', err);
  }
}

function persistStoriesToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${STORIES_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(storiesStore.slice(-100), null, 2), 'utf-8');
    fs.renameSync(tmpFile, STORIES_FILE);
  } catch (err) {
    console.error('Failed to persist stories.json:', err);
  }
}

loadStoriesFromDisk();

export function listKnowledgeStories(): KnowledgeStory[] {
  return storiesStore
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((story) => {
      const author = usersById.get(story.authorId);
      const hasVip = Boolean(
        author?.profiles?.adult?.progress?.purchasedItems?.golden_vip_frame || story.authorGoldenVip
      );
      return {
        ...story,
        authorGoldenVip: hasVip
      };
    });
}

export function createKnowledgeStory(
  user: StoredUserRecord,
  input: {
    kind: StoryKind;
    englishTerm?: string;
    arabicMeaning?: string;
    exampleSentence?: string;
    question?: string;
    options?: string[];
    correctIndex?: number;
    explanation?: string;
    xpBet?: number;
  }
): KnowledgeStory {
  const authorXp = user.profiles.adult.progress.xp;
  const role = getServerDiscordRole(authorXp, 'adult');
  const allowedBets = [5, 10, 20];
  const bet = input.kind === 'quiz' && allowedBets.includes(Number(input.xpBet)) ? Number(input.xpBet) : 10;

  const story: KnowledgeStory = {
    id: crypto.randomUUID(),
    authorId: user.id,
    authorUsername: user.username,
    authorRole: role,
    authorGoldenVip: Boolean(user.profiles.adult.progress.purchasedItems?.golden_vip_frame),
    kind: input.kind,
    ...(input.kind === 'word'
      ? {
          englishTerm: (input.englishTerm || '').trim(),
          arabicMeaning: (input.arabicMeaning || '').trim(),
          exampleSentence: (input.exampleSentence || '').trim()
        }
      : {
          question: (input.question || '').trim(),
          options: (input.options || []).map((o) => o.trim()),
          correctIndex: Number(input.correctIndex) || 0,
          explanation: (input.explanation || '').trim()
        }),
    xpBet: bet,
    answeredBy: {},
    createdAt: Date.now()
  };

  storiesStore = [story, ...storiesStore].slice(0, 100);
  persistStoriesToDisk();
  return story;
}

export function answerKnowledgeStoryBet(
  user: StoredUserRecord,
  storyId: string,
  selectedIndex: number
):
  | {
      ok: true;
      correct: boolean;
      correctIndex: number;
      xpDelta: number;
      story: KnowledgeStory;
      user: CloudUser;
    }
  | { ok: false; status: number; error: string } {
  const story = storiesStore.find((s) => s.id === storyId);
  if (!story || story.kind !== 'quiz' || typeof story.correctIndex !== 'number') {
    return { ok: false, status: 404, error: 'الستوري غير موجود أو لا يحتوي على سؤال.' };
  }
  if (story.authorId === user.id) {
    return { ok: false, status: 400, error: 'لا يمكنك المراهنة على سؤالك الخاص!' };
  }
  if (Object.prototype.hasOwnProperty.call(story.answeredBy, user.usernameLower)) {
    return { ok: false, status: 400, error: 'لقد أجبت على هذا التحدي مسبقاً!' };
  }
  if (typeof selectedIndex !== 'number' || selectedIndex < 0 || selectedIndex > 3) {
    return { ok: false, status: 400, error: 'خيار الإجابة غير صالح.' };
  }

  const adultProgress = user.profiles.adult.progress;
  if (adultProgress.xp < story.xpBet) {
    return {
      ok: false,
      status: 400,
      error: `تحتاج على الأقل إلى ${story.xpBet} XP للدخول في هذا الرهان! رصيدك الحالي: ${adultProgress.xp} XP.`
    };
  }

  const isCorrect = selectedIndex === story.correctIndex;
  const xpDelta = isCorrect ? story.xpBet : -story.xpBet;
  adultProgress.xp = Math.max(0, adultProgress.xp + xpDelta);
  adultProgress.stars = Math.max(0, adultProgress.stars + xpDelta);
  if (adultProgress.xp >= 100) {
    adultProgress.unlockedBadges.golden_castle = true;
  }

  story.answeredBy[user.usernameLower] = isCorrect;
  persistUsersToDisk();
  persistStoriesToDisk();

  return {
    ok: true,
    correct: isCorrect,
    correctIndex: story.correctIndex,
    xpDelta,
    story,
    user: sanitizeCloudUser(user)
  };
}
