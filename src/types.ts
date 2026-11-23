export type AppMode = 'adult' | 'kid';

export type TabType = 'translator' | 'lens' | 'chat' | 'practice' | 'stories' | 'shop' | 'progress';

export type TranslationStyle = 'slang' | 'formal';

export type StoryKind = 'word' | 'quiz';

export interface KnowledgeStory {
  id: string;
  authorId: string;
  authorUsername: string;
  authorRole: {
    nameEn: string;
    nameAr: string;
    dotClass: string;
    pillClass: string;
  };
  authorGoldenVip?: boolean;
  kind: StoryKind;
  englishTerm?: string;
  arabicMeaning?: string;
  exampleSentence?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  xpBet: number;
  answeredBy: Record<string, boolean>;
  createdAt: number;
}

export type BadgeId =
  | 'hero_translator'
  | 'lens_explorer'
  | 'astronaut_friend'
  | 'golden_castle';

export interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  masteryLevel: number; // 0 to 3
  nextReviewDate: number;
  lastReviewed: number;
}

export interface UserProgress {
  stars: number;
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  translationsCount: number;
  challengeQuestionsCount: number;
  lensScansCount: number;
  chatMessagesCount: number;
  unlockedBadges: Partial<Record<BadgeId, boolean>>;
  vocabulary: VocabularyWord[];
  unlockedCharacters: Record<string, boolean>;
  purchasedItems: Record<string, boolean>;
  streakShieldActive: boolean;
  secondChanceHearts: number;
}

export interface TranslationResult {
  translation: string;
  phonetic: string;
  breakdown: Array<{
    arabic: string;
    english: string;
    note: string;
  }>;
  tip: string;
}

export interface PastTranslationItem {
  id: string;
  inputText: string;
  style: TranslationStyle;
  result: TranslationResult;
  timestamp: number;
}

export interface LensResult {
  englishName: string;
  arabicName: string;
  phonetic: string;
  sentence: string;
  stars: number;
  funFact: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  vocabularyTip?: string;
}

export interface PracticeQuestion {
  id: string;
  questionAr: string;
  englishContext?: string;
  category?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xp: number;
}

export interface WeeklyTracker {
  firstUsedDate: number;
  completedDailySets: number;
}

export interface DailyQuizState {
  createdAt: number;
  questions: PracticeQuestion[];
  currentIndex: number;
  selectedOption: number | null;
  isAnswered: boolean;
  score: number;
  correctCount: number;
  completed: boolean;
}

export interface ModeCloudProfile {
  progress: UserProgress;
  weeklyTracker: WeeklyTracker;
  dailyQuiz: DailyQuizState | null;
  askedHistory: string[];
  pastTranslations: PastTranslationItem[];
}

export interface CloudUser {
  id: string;
  username: string;
  defaultMode: AppMode;
  profiles: {
    kid: ModeCloudProfile;
    adult: ModeCloudProfile;
  };
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  stars: number;
  xp: number;
  streak: number;
  level: number;
  role: {
    nameEn: string;
    nameAr: string;
    dotClass: string;
    pillClass: string;
  };
  isCurrentUser: boolean;
  galaxyChampion?: boolean;
  goldenVipFrame?: boolean;
}
