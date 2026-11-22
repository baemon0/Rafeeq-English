import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  answerKnowledgeStoryBet,
  authenticateUser,
  buildLeaderboard,
  createKnowledgeStory,
  getUserByToken,
  listKnowledgeStories,
  registerUser,
  revokeSession,
  sanitizeCloudUser,
  updateUserModeProfile
} from './server/cloudStore';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '15mb' }));

const getAiClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey || apiKey.trim() === '') return null;
  return new GoogleGenAI({ apiKey });
};

// In-memory cache for daily quota tracking (skips exhausted models in 0ms)
const exhaustedModels = new Set<string>();

/**
 * Smart Daily Quota Rotation System in callGeminiSafe
 */
async function callGeminiSafe(
  ai: GoogleGenAI,
  contents: any,
  responseJson = true,
  systemInstruction?: string
): Promise<any> {
  const models = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const modelName of models) {
    // Skip models marked as exhausted for today (0ms check)
    if (exhaustedModels.has(modelName)) {
      continue;
    }

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Timeout on model ${modelName} (15s)`)), 15000);
      });

      const config: any = {
        thinkingConfig: { thinkingBudget: 0 }
      };
      if (responseJson) {
        config.responseMimeType = 'application/json';
      }
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const apiPromise = ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config
      });

      const response: any = await Promise.race([apiPromise, timeoutPromise]);
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const errStr = err?.message || err?.toString() || '';
      const isQuotaExhausted = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota') || errStr.includes('404');

      if (isQuotaExhausted) {
        console.warn(`Model ${modelName} exhausted (429/404). Marking as exhausted for today and rotating to next model...`);
        exhaustedModels.add(modelName);
        continue; // Immediately try next model in 0ms
      } else {
        console.warn(`Model ${modelName} error (${errStr}), trying next model...`);
        continue;
      }
    }
  }

  throw new Error('تم الوصول للحد المجاني اليومي، جرب بعد قليل أو أضف مفتاح API جديد');
}

function extractBearerToken(req: express.Request): string | undefined {
  const auth = req.headers.authorization;
  if (!auth || typeof auth !== 'string') return undefined;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : undefined;
}

// 0. Multi-User Auth & Cloud Sync APIs
app.post('/api/auth/signup', (req, res) => {
  const { username, password, mode } = req.body || {};
  const result = registerUser(username, password, mode);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(201).json({ token: result.token, user: result.user });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password, mode } = req.body || {};
  const result = authenticateUser(username, password, mode);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json({ token: result.token, user: result.user });
});

app.post('/api/auth/logout', (req, res) => {
  const token = extractBearerToken(req);
  revokeSession(token);
  return res.json({ ok: true });
});

app.get('/api/user/state', (req, res) => {
  const user = getUserByToken(extractBearerToken(req));
  if (!user) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول للمزامنة السحابية.' });
  }
  return res.json({ user: sanitizeCloudUser(user) });
});

app.put('/api/user/state', (req, res) => {
  const user = getUserByToken(extractBearerToken(req));
  if (!user) {
    return res.status(401).json({ error: 'انتهت الجلسة، يرجى تسجيل الدخول.' });
  }
  const { mode, progress, weeklyTracker, dailyQuiz, askedHistory, pastTranslations } = req.body || {};
  if (mode !== 'kid' && mode !== 'adult') {
    return res.status(400).json({ error: 'Invalid profile mode' });
  }

  const updatedProfile = updateUserModeProfile(user, mode, {
    progress,
    weeklyTracker,
    dailyQuiz,
    askedHistory,
    pastTranslations
  });

  return res.json({ ok: true, profile: updatedProfile, user: sanitizeCloudUser(user) });
});

app.get('/api/leaderboard', (req, res) => {
  const modeParam = req.query.mode === 'kid' ? 'kid' : 'adult';
  const currentUser = getUserByToken(extractBearerToken(req));
  const entries = buildLeaderboard(modeParam, currentUser?.id);
  return res.json({ mode: modeParam, entries });
});

app.post('/api/avatar/shop', (req, res) => {
  const user = getUserByToken(extractBearerToken(req));
  if (!user) {
    return res.status(401).json({ error: 'انتهت الجلسة، يرجى تسجيل الدخول.' });
  }
  const { mode, ...payload } = req.body || {};
  if (mode !== 'kid' && mode !== 'adult') {
    return res.status(400).json({ error: 'Invalid profile mode' });
  }
  const result = handleAvatarShopAction(user, mode, payload);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result);
});

app.post('/api/craft', (req, res) => {
  const user = getUserByToken(extractBearerToken(req));
  if (!user) {
    return res.status(401).json({ error: 'انتهت الجلسة، يرجى تسجيل الدخول.' });
  }
  const { mode, slot1, slot2 } = req.body || {};
  if (mode !== 'kid' && mode !== 'adult') {
    return res.status(400).json({ error: 'Invalid profile mode' });
  }
  const result = handleCraftAvatarItem(user, mode, slot1, slot2);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result);
});

app.post('/api/enchant', (req, res) => {
  const user = getUserByToken(extractBearerToken(req));
  if (!user) {
    return res.status(401).json({ error: 'انتهت الجلسة، يرجى تسجيل الدخول.' });
  }
  const { mode, itemId } = req.body || {};
  if (mode !== 'kid' && mode !== 'adult') {
    return res.status(400).json({ error: 'Invalid profile mode' });
  }
  const result = handleEnchantAvatarItem(user, mode, itemId);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result);
});

// 0.4 Pixel Island Builder & Friends Visit APIs
app.get('/api/island', (req, res) => {
  const modeParam = req.query.mode === 'kid' ? 'kid' : 'adult';
  const targetUserId = typeof req.query.userId === 'string' ? req.query.userId : '';
  const currentUser = getUserByToken(extractBearerToken(req));

  const uid = targetUserId || currentUser?.id;
  if (!uid) {
    return res.status(400).json({ error: 'يرجى تحديد المستخدم المطلوب أو تسجيل الدخول.' });
  }

  const result = handleGetIsland(uid, modeParam, currentUser?.id);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result);
});

app.post('/api/island/place', (req, res) => {
  const user = getUserByToken(extractBearerToken(req));
  if (!user) {
    return res.status(401).json({ error: 'انتهت الجلسة، يرجى تسجيل الدخول.' });
  }
  const { mode, x, y, itemId } = req.body || {};
  if (mode !== 'kid' && mode !== 'adult') {
    return res.status(400).json({ error: 'Invalid profile mode' });
  }
  const result = handlePlaceIslandTile(user, mode, x, y, itemId);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result);
});

app.post('/api/island/like', (req, res) => {
  const user = getUserByToken(extractBearerToken(req));
  if (!user) {
    return res.status(401).json({ error: 'انتهت الجلسة، يرجى تسجيل الدخول.' });
  }
  const { targetUserId, mode } = req.body || {};
  if (mode !== 'kid' && mode !== 'adult') {
    return res.status(400).json({ error: 'Invalid profile mode' });
  }
  const result = handleLikeIsland(user, targetUserId, mode);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result);
});

// 0.5 Knowledge Stories & XP Bet API (Adults Mode Only)
const STRICT_MODERATION_WARNING =
  'ممنوع نشر السب أو الكلام العشوائي! يُسمح فقط بالكلمات الإنجليزية الجديدة أو الأسئلة التعليمية';

function sanitizeStoryForViewer(story: any, viewerId: string, viewerUsernameLower: string) {
  const isAuthor = story.authorId === viewerId;
  const hasAnswered = Object.prototype.hasOwnProperty.call(story.answeredBy || {}, viewerUsernameLower);
  if (story.kind === 'quiz' && !isAuthor && !hasAnswered) {
    const { correctIndex: _hidden, ...rest } = story;
    return rest;
  }
  return story;
}

app.get('/api/stories', (req, res) => {
  const user = getUserByToken(extractBearerToken(req));
  if (!user) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول لعرض ستوري المعرفة.' });
  }
  const stories = listKnowledgeStories().map((s) =>
    sanitizeStoryForViewer(s, user.id, user.usernameLower)
  );
  return res.json({ stories });
});

app.post('/api/stories', async (req, res) => {
  const user = getUserByToken(extractBearerToken(req));
  if (!user) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول لنشر ستوري المعرفة.' });
  }

  const {
    mode,
    kind,
    englishTerm,
    arabicMeaning,
    exampleSentence,
    question,
    options,
    correctIndex,
    explanation,
    xpBet
  } = req.body || {};

  if (mode === 'kid') {
    return res.status(403).json({ error: 'ستوري المعرفة متاح لقسم الكبار فقط.' });
  }

  if (kind !== 'word' && kind !== 'quiz') {
    return res.status(400).json({ error: STRICT_MODERATION_WARNING });
  }

  if (kind === 'word') {
    if (
      typeof englishTerm !== 'string' ||
      typeof arabicMeaning !== 'string' ||
      englishTerm.trim().length < 2 ||
      arabicMeaning.trim().length < 2
    ) {
      return res.status(400).json({ error: STRICT_MODERATION_WARNING });
    }
  } else {
    if (
      typeof question !== 'string' ||
      question.trim().length < 5 ||
      !Array.isArray(options) ||
      options.length !== 4 ||
      options.some((o: any) => typeof o !== 'string' || o.trim().length === 0) ||
      typeof correctIndex !== 'number' ||
      correctIndex < 0 ||
      correctIndex > 3
    ) {
      return res.status(400).json({ error: STRICT_MODERATION_WARNING });
    }
  }

  const ai = getAiClient();
  if (!ai) {
    return res.status(400).json({ error: 'API_KEY missing for content moderation.' });
  }

  const submissionPayload =
    kind === 'word'
      ? {
          type: 'New English Word or Idiom',
          englishTerm: englishTerm.trim(),
          arabicMeaning: arabicMeaning.trim(),
          exampleSentence: typeof exampleSentence === 'string' ? exampleSentence.trim() : ''
        }
      : {
          type: 'English Educational Quiz Question',
          question: question.trim(),
          options: options.map((o: string) => o.trim()),
          markedCorrectOption: options[correctIndex]?.trim(),
          explanation: typeof explanation === 'string' ? explanation.trim() : ''
        };

  const moderatorPrompt = `You are a STRICT educational safety and quality moderator for an adult English-learning platform.
Inspect this user-submitted Knowledge Story:
${JSON.stringify(submissionPayload, null, 2)}

STRICT MODERATION RULES (FAIL-CLOSED):
1. IMMEDIATELY REJECT ("allowed": false) if ANY field contains:
   - Profanity, swearing, insults, slurs, harassment, or offensive words in Arabic, English, or Arabizi (e.g., 7mar, kalb, kos, sharmoot, wtf, f*ck, etc.).
   - Nonsense, gibberish, keyboard mashing (e.g., "asdfgh", "هبل", "ههههههه", "سيبسيب", random characters), or meaningless jokes.
   - Off-topic chat/greetings (e.g., "هلا شخباركم", "اضيفوني سناب", spam, ads, politics, or personal info).
2. ALLOW ("allowed": true) ONLY IF it strictly satisfies ONE of these:
   - (A) "New English Word or Idiom": "englishTerm" is a REAL, valid English word, idiom, phrasal verb, slang expression, or workplace acronym, AND "arabicMeaning" accurately explains it (and "exampleSentence", if present, is clean valid English).
   - (B) "English Educational Quiz Question": "question" is a valid, logical English learning question (vocabulary, grammar, idioms, or translation), the 4 options are real clean choices, and "markedCorrectOption" is genuinely the right answer.

Respond ONLY with JSON:
{
  "allowed": true or false,
  "reason": "short internal reason"
}`;

  try {
    const modRaw = await callGeminiSafe(ai, moderatorPrompt, true);
    const modJson = JSON.parse(modRaw);
    if (!modJson || modJson.allowed !== true) {
      return res.status(400).json({ error: STRICT_MODERATION_WARNING });
    }

    const created = createKnowledgeStory(user, {
      kind,
      englishTerm,
      arabicMeaning,
      exampleSentence,
      question,
      options,
      correctIndex,
      explanation,
      xpBet
    });

    return res.status(201).json({ story: created });
  } catch (err: any) {
    console.error('Story moderation error:', err);
    return res.status(500).json({
      error: err.message || 'تعذر التحقق من محتوى الستوري بالذكاء الاصطناعي، يرجى المحاولة بعد قليل.'
    });
  }
});

app.post('/api/stories/:id/bet', (req, res) => {
  const user = getUserByToken(extractBearerToken(req));
  if (!user) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول للمشاركة في تحدي الستوري.' });
  }
  const { selectedIndex } = req.body || {};
  const result = answerKnowledgeStoryBet(user, req.params.id, Number(selectedIndex));
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.json(result);
});

// 1. Translator API
app.post('/api/translate', async (req, res) => {
  try {
    const { text, mode, style } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const trimmed = text.trim();
    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({ error: 'API_KEY is not configured in AI Studio Secrets.' });
    }

    const prompt = style === 'slang'
      ? `You are a native-level Saudi/Khaleeji Arabic & American/British street-slang cultural linguist.
Translate the Arabic colloquial phrase ("${trimmed}") into natural, idiomatic casual English slang.

CRITICAL CULTURAL RULE — Compliments vs. Traditional Social Replies (NEVER translate them identically):
In Saudi/Khaleeji culture, people respond to compliments/blessings with specific reciprocal replies. Detect whether the input is the INITIAL COMPLIMENT/WISH or the TRADITIONAL REPLY returning it:
- 'كفو' (compliment) -> "Respect! / Nailed it! / Legend!" | 'كفوك الطيب' or 'كفوك' (reply returning the praise) -> "Right back at you, legend! / You're the real MVP!"
- 'صح لسانك' (complimenting speech/poetry) -> "Spot on! / Preach!" | 'صح بدنك' (reply) -> "Appreciate you, fam! / Much love!"
- 'بيض الله وجهك' (high praise/thanks) -> "You're a lifesaver! / Big respect!" | 'وجهك أبيض' (reply) -> "Anytime, bro! / Right back at ya!"
- 'ما عليك زود' (humble reply returning praise) -> "Right back at ya, bro! / Appreciate you!"
- 'يعطيك العافية' (thanking effort) -> "Good looking out! / Appreciate it!" | 'الله يعافيك' (reply) -> "No sweat! / Anytime, man!"
- 'الله يسلمك' vs 'سلمت' / 'ومن قال يسلم' -> distinguish giving thanks/wishes vs. returning them ("Appreciate it!" vs "Same to you, bro!").

INTERNET SLANG & TEXTING ABBREVIATIONS SUPPORT:
- Understand and naturally use modern English texting slang/abbreviations where appropriate (e.g., u, ur, idk, lol, fyi, btw, asap, brb, imo, lmk, omg, erm, tbh, ttyl, aka, diy, faq, rsvp, gif).
- Examples: "خبرني/علمني" -> "lmk!" / "on the real, tbh..." / "على فكرة" -> "btw..." / "ما أدري" -> "idk" / "بأسرع وقت" -> "asap" / "راجع لك" -> "brb".
- If an abbreviation fits naturally, include it or mention the texting shorthand alongside the spoken slang!

Rules:
- Use authentic, casual everyday English slang/idioms (NO stiff textbook phrases like "The honor is mine").
- Never echo the Arabic text back as English.
- In "note" and "tip", briefly explain in Arabic/English whether it's a compliment, reply, or texting slang and when to use it.

Respond ONLY with JSON:
{
  "translation": "idiomatic English slang translation",
  "phonetic": "phonetic guide",
  "breakdown": [{"arabic": "part", "english": "eng", "note": "cultural/social/slang nuance"}],
  "tip": "short practical tip on social or texting context"
}`
      : `You are a professional bilingual business translator specializing in Modern Standard Arabic (فصحى) to polished, polite, professional Formal English.
Translate the Arabic text ("${trimmed}") into elevated, polite, workplace-ready Formal English (e.g., 'The honor is mine', 'I truly appreciate your kind words').

WORKPLACE & PROFESSIONAL ACRONYMS SUPPORT:
- Natively understand and accurately use standard professional/workplace acronyms when the Arabic context calls for them:
  - CC (نسخة إلى), BCC (نسخة مخفية), EOD (نهاية اليوم / end of day), ETA (وقت الوصول المتوقع / estimated time of arrival), N/A (غير منطبق / not applicable), OOO (خارج المكتب / out of office), WFH (العمل من المنزل / work from home).
  - Example: "يرجى إرسال التقرير قبل نهاية اليوم" -> "Please submit the report by EOD."
  - Example: "أنا خارج المكتب اليوم" -> "I am currently OOO (Out of Office) today."
- Never echo Arabic back.

Respond ONLY with JSON:
{
  "translation": "formal professional English translation",
  "phonetic": "phonetic guide",
  "breakdown": [{"arabic": "part", "english": "eng", "note": "formal or workplace nuance"}],
  "tip": "short tip on professional business or academic usage"
}`;

    const textResult = await callGeminiSafe(ai, prompt, true);
    res.json(JSON.parse(textResult));
  } catch (err: any) {
    console.error('Live translation error:', err);
    res.status(500).json({ 
      error: err.message || 'تم الوصول للحد المجاني اليومي، جرب بعد قليل أو أضف مفتاح API جديد',
      translation: err.message || 'تم الوصول للحد المجاني اليومي، جرب بعد قليل أو أضف مفتاح API جديد',
      phonetic: '',
      breakdown: [],
      tip: 'يرجى التحقق من مفتاح الـ API.'
    });
  }
});

// 2. Smart Lens Object Analysis API
app.post('/api/lens', async (req, res) => {
  try {
    const { image, mode } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({ error: 'API_KEY is not configured.' });
    }

    const matches = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image data format' });
    }

    const prompt = `Identify the main object in this image precisely AND classify which crafting resource it yields from ONLY these 5 choices: "wool", "glass", "iron", "wood", "paper".
- "wool": clothes, fabric, pillows, blankets, stuffed toys, carpets, sweaters
- "glass": cups, glasses, windows, mirrors, bottles, screens, sunglasses
- "iron": keys, laptops, phones, watches, spoons, tools, metal/electronic hardware
- "wood": desks, tables, chairs, pencils, doors, plants/trees, wooden items
- "paper": books, notebooks, papers, boxes, receipts, cards

Respond ONLY with JSON:
{
  "englishName": "object name",
  "arabicName": "الاسم بالعربية",
  "phonetic": "phonetic",
  "sentence": "practical English sentence",
  "stars": 5,
  "funFact": "short fact",
  "resourceType": "wool | glass | iron | wood | paper"
}`;

    const textResult = await callGeminiSafe(ai, [
      { inlineData: { mimeType: matches[1], data: matches[2] } },
      prompt
    ], true);

    const parsed = JSON.parse(textResult);
    const validResTypes = ['wool', 'glass', 'iron', 'wood', 'paper'];
    const inferResource = (name: string) => {
      const n = (name || '').toLowerCase();
      if (/(shirt|sweater|pillow|cloth|fabric|wool|bed|blanket|toy|plush|sock|rug|jacket)/.test(n)) return 'wool';
      if (/(glass|cup|mug|window|mirror|bottle|eyeglass|shades|vase|screen)/.test(n)) return 'glass';
      if (/(key|metal|iron|laptop|phone|watch|fork|spoon|car|coin|tech|mouse|keyboard)/.test(n)) return 'iron';
      if (/(book|paper|notebook|card|page|box|letter|magazine)/.test(n)) return 'paper';
      return 'wood';
    };
    const rType = validResTypes.includes(parsed?.resourceType)
      ? parsed.resourceType
      : inferResource(parsed?.englishName || '');

    res.json({
      ...parsed,
      resourceDrop: {
        type: rType,
        amount: 1
      }
    });
  } catch (err: any) {
    console.error('Smart lens live error:', err);
    res.status(500).json({ 
      error: err.message,
      englishName: 'Quota Limit Reached',
      arabicName: 'تم الوصول للحد المجاني اليومي',
      phonetic: '',
      sentence: 'تم الوصول للحد المجاني اليومي، جرب بعد قليل أو أضف مفتاح API جديد',
      stars: 0,
      funFact: 'تم الوصول للحد المجاني اليومي، جرب بعد قليل أو أضف مفتاح API جديد'
    });
  }
});

// Kids Treasure Hunt Mission Generator API
app.get('/api/lens/mission', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({ error: 'API_KEY missing' });
    }

    const prompt = `Generate a creative treasure hunt mission for a kid learning English. 
Respond ONLY with JSON:
{
  "id": "1",
  "title": "Find something blue!",
  "description": "Take a photo of any blue object.",
  "targetCategory": "blue object",
  "hint": "Look around your room."
}`;

    const textResult = await callGeminiSafe(ai, prompt, true);
    res.json(JSON.parse(textResult));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Kids Treasure Hunt Verification API
app.post('/api/lens/verify', async (req, res) => {
  try {
    const { image, mission } = req.body;
    if (!image || !mission) {
      return res.status(400).json({ error: 'Image and mission are required' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({ error: 'API_KEY missing' });
    }

    const matches = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    const prompt = `Check if this photo matches mission: "${mission.title}" (Goal: "${mission.targetCategory}").
Also pick one crafting resource dropped by this object from ONLY: "wool", "glass", "iron", "wood", "paper".
Respond ONLY with JSON:
{
  "success": true,
  "feedback": "Great job! +20 stars!",
  "stars": 20,
  "resourceType": "wool | glass | iron | wood | paper"
}`;

    const textResult = await callGeminiSafe(ai, [
      { inlineData: { mimeType: matches[1], data: matches[2] } },
      prompt
    ], true);

    const parsed = JSON.parse(textResult);
    const validResTypes = ['wool', 'glass', 'iron', 'wood', 'paper'];
    const fallbackTypes = ['wool', 'glass', 'iron', 'wood', 'paper'] as const;
    const rType = validResTypes.includes(parsed?.resourceType)
      ? parsed.resourceType
      : fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];

    res.json({
      ...parsed,
      resourceDrop: parsed?.success
        ? { type: rType, amount: 1 }
        : undefined
    });
  } catch (err: any) {
    console.error('Verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. AI Character Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, character } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({ error: 'API_KEY missing' });
    }

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
    const hasArabic = /[\u0600-\u06FF]/.test(lastUserMessage);
    const showsConfusion = /(فهم|تقول|تقولين|يعني|معنى|معني|اعرف|أعرف|عرفت|ترجم|وضح|اشرح|قصدك|تقصد|بالعربي|عربي|ما ادري|مادري|وش ذا|ايش ذا|؟|\?)/.test(lastUserMessage);
    const isConfusedInArabic = character === 'astronaut' && hasArabic && showsConfusion;
    const openingGreeting = messages[0]?.role === 'assistant' ? messages[0].content : '';

    // Find the last English assistant message immediately preceding the latest user message
    let previousEnglishMsg = '';
    for (let i = messages.length - 2; i >= 0; i--) {
      const msg = messages[i];
      if (msg?.role === 'assistant' && msg?.content && !/[\u0600-\u06FF]/.test(msg.content)) {
        previousEnglishMsg = msg.content;
        break;
      }
    }

    const adultAbbrevGuide = `
You natively understand all modern English texting slang and abbreviations (u=you, ur=your/you're, idk=I don't know, lol, fyi, btw, asap, brb, imo, lmk, omg, erm, tbh, ttyl, aka, diy, faq, rsvp, gif) AND workplace acronyms (cc, bcc, eod=end of day, eta=estimated time of arrival, n/a=not applicable, ooo=out of office, wfh=work from home).
CRITICAL CONVERSATION RULE:
- React DIRECTLY, SPECIFICALLY, and NATURALLY to what the user just wrote in their latest message and the ongoing conversation!
- NEVER give a generic canned intro or ignore what they said.
- Speak in 100% PURE ENGLISH ONLY (ZERO Arabic words, letters, or translations).`;

    let systemInstruction = '';
    if (character === 'astronaut') {
      if (isConfusedInArabic) {
        const msgToTranslate = previousEnglishMsg || openingGreeting;
        systemInstruction = `You are 'Najm' (نجم), a kind, cheerful space astronaut helping a child learn English.
The child just wrote in Arabic that they didn't understand: "${lastUserMessage}"
Your previous English message to the child was: "${msgToTranslate}"

EXCEPTION — SMART ARABIC HELPER (THIS TURN ONLY):
Reply in warm, friendly, simple Arabic and clearly do ALL 3 of these steps:
1. Teach them how to say "I don't understand!" (or "What do you mean?") in English (for example: "تقدر تقول: I don't understand! أو What do you mean?").
2. Gently encourage them in Arabic to try using that English phrase next time (for example: "حاول تستخدمها المرة الجاية يا بطل!").
3. Translate your exact previous English message ("${msgToTranslate}") into simple, kid-friendly Arabic so the child understands what you were saying before.`;
      } else {
        systemInstruction = `You are 'Najm', a fun, kind, cheerful space astronaut chatting with a child learning English.
${openingGreeting ? `Your opening greeting to the child was: "${openingGreeting}"` : ''}
STRICT DEFAULT RULES (100% PURE ENGLISH ONLY):
- You MUST reply in 100% PURE ENGLISH ONLY.
- NEVER include ANY Arabic translation, Arabic words, Arabic letters, or parentheses with Arabic meanings (even if earlier chat messages contained Arabic!).
- Use VERY SIMPLE, clear, basic, kid-friendly English words suitable for children (e.g., happy, fun, big, cool, stars, space, moon, nice, funny).
- STRICTLY AVOID heavy teenage texting slang (do NOT use 'tbh', 'imo', 'lmk', 'fyi', 'btw', 'af', etc.) and avoid complex or tricky words (like 'goofy', 'hilarious', 'cosmos', 'astronomical').
- Still understand basic shorthand if the child types it (like 'u', 'ur', 'idk', 'lol') without using heavy slang back.
- React DIRECTLY, playfully, and naturally to what the child just said, never repeating a generic space intro.
- Keep sentences short, warm, and encouraging (1-3 short sentences max).`;
      }
    } else if (character === 'barista') {
      systemInstruction = `You are Oliver, a witty, friendly barista at a London café helping adults practice natural conversational English.${adultAbbrevGuide}
${openingGreeting ? `Your opening greeting was: "${openingGreeting}"` : ''}
Feel free to casually understand or use natural texting/workplace expressions (like WFH, EOD, btw, lol) if relevant to what the user brings up. Keep replies natural (2-3 sentences).`;
    } else {
      systemInstruction = `You are Sarah, an engaging London tour guide helping adults practice real-world travel and social English.${adultAbbrevGuide}
${openingGreeting ? `Your opening greeting was: "${openingGreeting}"` : ''}
Feel free to naturally understand and respond to texting slang or workplace acronyms (like ETA, OOO, btw, lmk) in context. Keep replies natural (2-3 sentences).`;
    }

    // Build valid Gemini conversation history starting from the first user message
    const firstUserIdx = messages.findIndex((m: any) => m.role === 'user');
    const relevantMessages = firstUserIdx >= 0 ? messages.slice(firstUserIdx) : messages;

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const m of relevantMessages) {
      const text = (m.content || '').trim();
      if (!text) continue;
      const role: 'user' | 'model' = m.role === 'user' ? 'user' : 'model';
      const prev = contents[contents.length - 1];
      if (prev && prev.role === role) {
        prev.parts[0].text += `\n${text}`;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: 'No user message provided' });
    }

    let replyText = await callGeminiSafe(ai, contents, false, systemInstruction);

    // Guardrail: In pure-English mode, strip any accidental parenthetical Arabic translations
    if (!isConfusedInArabic && replyText) {
      replyText = replyText.replace(/\s*\([^)]*[\u0600-\u06FF][^)]*\)/g, '').trim();
      if (/[\u0600-\u06FF]/.test(replyText)) {
        // Re-ask strictly in pure English using only the English turns if the model leaked Arabic
        const retryReply = await callGeminiSafe(
          ai,
          [{ role: 'user', parts: [{ text: `Reply in 100% pure simple English ONLY (no Arabic at all) to: "${lastUserMessage}"` }] }],
          false,
          systemInstruction
        );
        replyText = (retryReply || '').replace(/\s*\([^)]*[\u0600-\u06FF][^)]*\)/g, '').trim();
      }
    }

    res.json({
      reply: replyText,
      vocabularyTip: 'Practice speaking clearly!'
    });
  } catch (err: any) {
    console.error('Chat live error:', err);
    res.status(500).json({
      error: err.message,
      reply: err.message || 'تم الوصول للحد المجاني اليومي، جرب بعد قليل أو أضف مفتاح API جديد',
      vocabularyTip: 'Quota limit reached.'
    });
  }
});

// 4. Daily 5 Non-Repeating Practice Quiz Generator API
app.post('/api/practice/daily', async (req, res) => {
  try {
    const { mode, previousQuestions, weekNumber: rawWeek } = req.body;
    const isKid = mode === 'kid';
    const weekNumber = Math.max(1, Number(rawWeek) || 1);
    const ai = getAiClient();
    if (!ai) {
      return res.status(400).json({ error: 'API_KEY missing' });
    }

    const recentHistory = Array.isArray(previousQuestions)
      ? previousQuestions.slice(-50).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')
      : '';

    const randomSeed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    let kidDifficultyGuide = '';
    if (weekNumber === 1) {
      kidDifficultyGuide = `CURRENT LEVEL: WEEK 1 (مبتدئ / Beginner)
- Focus strictly on basic single English words, colors, numbers (1–10), cute animals, and simple everyday objects (e.g., cat, apple, blue, sun, book).
- Keep options to single simple words.`;
    } else if (weekNumber === 2) {
      kidDifficultyGuide = `CURRENT LEVEL: WEEK 2 (متطور / Elementary)
- Introduce short 2–3 word phrases and simple action verbs (e.g., "open the book", "red apple", "drink water", "run fast", "sleep early").
- Avoid single-only trivial words unless paired with an action or adjective.`;
    } else {
      kidDifficultyGuide = `CURRENT LEVEL: WEEK ${weekNumber} (متقدم للصغار / Explorer)
- Introduce simple daily English sentences (fill-in-the-blank in "englishContext") and kid-friendly English spelling challenges (choosing the correctly spelled word).
- Keep vocabulary clear, logical, and suitable for ages 5–11.`;
    }

    let adultDifficultyGuide = '';
    if (weekNumber === 1) {
      adultDifficultyGuide = `CURRENT LEVEL: WEEK 1 (مبتدئ / Foundation)
- Focus on practical everyday conversational phrases, common friendly idioms, and clear polite vs. casual English expressions.`;
    } else if (weekNumber === 2) {
      adultDifficultyGuide = `CURRENT LEVEL: WEEK 2 (متوسط / Intermediate)
- Introduce realistic workplace and travel scenarios (hotels, airports, meetings, emails using EOD, OOO, WFH, ETA) and subtle everyday American/British slang.`;
    } else {
      adultDifficultyGuide = `CURRENT LEVEL: WEEK ${weekNumber} (متقدم / Advanced)
- Introduce advanced native idioms, nuanced grammar traps, subtle tone distinctions, and polished professional or native-level expressions.`;
    }

    const prompt = isKid
      ? `You are an expert elementary English teacher creating 5 fun, 100% logical, age-appropriate multiple-choice English quiz questions for Arab children (ages 5–11).
Random variety seed: ${randomSeed}

${kidDifficultyGuide}

STRICT RULES FOR KIDS MODE:
- Every question MUST be 100% logical, unambiguous, and match Week ${weekNumber} difficulty above.
- Never ask confusing riddles, adult idioms, or trick grammar questions.
- "questionAr" MUST be in warm, simple, encouraging Arabic.
- "options" MUST contain EXACTLY 4 distinct English choices, with ONLY ONE clearly correct answer.
- "correctIndex" MUST accurately match the 0-based index (0, 1, 2, or 3) of the right answer in "options".
- "explanation" MUST be a short, encouraging explanation in simple Arabic.
- DO NOT repeat or closely resemble ANY of these previously asked questions:
${recentHistory || '(None yet)'}

Respond ONLY with a valid JSON object in this exact format:
{
  "questions": [
    {
      "id": "unique-id-1",
      "category": "مفردات / أفعال / إملاء / ألوان / جملة",
      "questionAr": "Clear Arabic question for kids",
      "englishContext": "Optional short English sentence (e.g. for fill-in-the-blank) or empty string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Encouraging Arabic explanation",
      "xp": 20
    }
  ]
}`
      : `You are an expert bilingual English coach creating 5 smart, realistic, mature multiple-choice English questions for Arab adults.
Random variety seed: ${randomSeed}

${adultDifficultyGuide}

STRICT RULES FOR ADULTS MODE:
- NEVER ask childish questions (no basic colors, animals, or elementary spelling).
- Match Week ${weekNumber} difficulty strictly.
- Every question MUST be 100% logical, realistic, and have ONLY ONE clearly best answer among the 4 options.
- "questionAr" MUST be in clear, natural Arabic describing the scenario or question.
- "options" MUST contain EXACTLY 4 distinct English choices.
- "correctIndex" MUST accurately match the 0-based index (0, 1, 2, or 3) of the right answer in "options".
- "explanation" MUST be a concise, insightful Arabic explanation of why that answer is right and how native speakers use it.
- DO NOT repeat or closely resemble ANY of these previously asked questions:
${recentHistory || '(None yet)'}

Respond ONLY with a valid JSON object in this exact format:
{
  "questions": [
    {
      "id": "unique-id-1",
      "category": "محادثة / بيئة العمل / عامي ورسمي / تعبيرات متقدمة / قواعد",
      "questionAr": "Clear Arabic scenario or question for adults",
      "englishContext": "Optional English sentence or dialogue snippet, or empty string",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Insightful Arabic explanation",
      "xp": 25
    }
  ]
}`;

    const textResult = await callGeminiSafe(ai, prompt, true);
    const parsed = JSON.parse(textResult);
    const rawQuestions = Array.isArray(parsed?.questions) ? parsed.questions : [];

    const validatedQuestions = rawQuestions
      .filter(
        (q: any) =>
          q &&
          typeof q.questionAr === 'string' &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correctIndex === 'number' &&
          q.correctIndex >= 0 &&
          q.correctIndex <= 3
      )
      .slice(0, 5)
      .map((q: any, idx: number) => ({
        id: `${Date.now()}-${idx}`,
        category: q.category || (isKid ? 'تحدي الصغار' : 'تحدي الكبار'),
        questionAr: q.questionAr,
        englishContext: q.englishContext || '',
        options: q.options.map((opt: any) => String(opt)),
        correctIndex: q.correctIndex,
        explanation: q.explanation || '',
        xp: typeof q.xp === 'number' ? q.xp : isKid ? 20 : 25
      }));

    if (validatedQuestions.length === 0) {
      throw new Error('لم يتم توليد أسئلة صالحة، يرجى المحاولة مرة أخرى.');
    }

    res.json({ questions: validatedQuestions });
  } catch (err: any) {
    console.error('Daily practice generation error:', err);
    res.status(500).json({
      error: err.message || 'تم الوصول للحد المجاني اليومي، جرب بعد قليل أو أضف مفتاح API جديد'
    });
  }
});

// Vite middleware integration for development
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Rafeeq English server running on http://localhost:${port}`);
});
