import React, { useState, useRef, useEffect } from 'react';
import { AppMode, ChatMessage } from '../types';
import { speakText } from '../utils/speech';
import {
  Bot,
  Briefcase,
  Check,
  Coffee,
  Compass,
  Globe,
  Lock,
  Rocket,
  Send,
  ShoppingBag,
  Sparkles,
  User,
  Volume2
} from 'lucide-react';

interface AiChatTabProps {
  mode: AppMode;
  onActivity: (type: 'chat', points: number) => void;
  unlockedCharacters?: Record<string, boolean>;
  onOpenShop?: () => void;
}

type CharacterId = 'astronaut' | 'dino' | 'robo' | 'barista' | 'guide' | 'career' | 'nyc';

export const AiChatTab: React.FC<AiChatTabProps> = ({
  mode,
  onActivity,
  unlockedCharacters = {},
  onOpenShop
}) => {
  const [character, setCharacter] = useState<CharacterId>(
    mode === 'kid' ? 'astronaut' : 'barista'
  );
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        mode === 'kid'
          ? 'Hello space traveler! I am Najm. Let us talk in English and explore the galaxy together!'
          : 'Hello there! Welcome to our London café. What would you like to order today?',
      timestamp: Date.now()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isKid = mode === 'kid';

  const hasDino = Boolean(unlockedCharacters.dino);
  const hasRobo = Boolean(unlockedCharacters.robo);
  const hasCareer = Boolean(unlockedCharacters.career);
  const hasNyc = Boolean(unlockedCharacters.nyc);

  const characterTitle =
    character === 'astronaut'
      ? 'Najm · Space Astronaut'
      : character === 'dino'
        ? 'Dino Rex · Word Games'
        : character === 'robo'
          ? 'Robo-Z · Tech Buddy'
          : character === 'barista'
            ? 'Oliver · London Barista'
            : character === 'career'
              ? 'Career & Interview Coach'
              : character === 'nyc'
                ? 'NYC Slang Buddy'
                : 'Sarah · London Tour Guide';

  const characterBotName =
    character === 'astronaut'
      ? 'Najm'
      : character === 'dino'
        ? 'Dino Rex'
        : character === 'robo'
          ? 'Robo-Z'
          : character === 'barista'
            ? 'Oliver'
            : character === 'career'
              ? 'Career Coach'
              : character === 'nyc'
                ? 'NYC Buddy'
                : 'Sarah';

  useEffect(() => {
    if (isKid && !['astronaut', 'dino', 'robo'].includes(character)) {
      setCharacter('astronaut');
      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content:
            'Hello space traveler! I am Najm. Let us talk in English and explore the galaxy together!',
          timestamp: Date.now()
        }
      ]);
    } else if (!isKid && ['astronaut', 'dino', 'robo'].includes(character)) {
      setCharacter('barista');
      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Hello there! Welcome to our London café. What would you like to order today?',
          timestamp: Date.now()
        }
      ]);
    }
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const renderCharacterIcon = (charId: CharacterId, className = 'w-5 h-5') => {
    switch (charId) {
      case 'astronaut':
        return <Rocket className={className} />;
      case 'dino':
        return <Sparkles className={className} />;
      case 'robo':
        return <Bot className={className} />;
      case 'barista':
        return <Coffee className={className} />;
      case 'career':
        return <Briefcase className={className} />;
      case 'nyc':
        return <Globe className={className} />;
      case 'guide':
        return <Compass className={className} />;
    }
  };

  const handleSendMessage = async () => {
    const text = inputMessage;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          character,
          mode
        })
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (res.ok && !data.error) {
        onActivity('chat', isKid ? 10 : 5);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I am having a connection issue. Let us try again!',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-24 flex flex-col h-[calc(100vh-80px)]">
      {/* Top Character Selector Header */}
      <div className="editorial-card px-5 py-4 rounded-3xl mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              isKid
                ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
            }`}
          >
            {renderCharacterIcon(character)}
          </div>
          <div>
            <h3 className="font-bold text-[#1B4332] dark:text-white text-sm" dir="ltr">
              {characterTitle}
            </h3>
            <p className="text-xs text-[#5C665E] dark:text-gray-400 mt-0.5">
              {isKid ? 'محادثة ممتعة باللغة الإنجليزية' : 'تدريب عملي على المحادثة الواقعية'}
            </p>
          </div>
        </div>

        <div className="flex bg-black/[0.04] dark:bg-white/5 p-1 rounded-2xl gap-1 flex-wrap">
          {isKid ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setLockNotice(null);
                  setCharacter('astronaut');
                  setMessages([
                    {
                      id: '1',
                      role: 'assistant',
                      content:
                        'Hello space traveler! I am Najm. Let us talk in English and explore the galaxy together!',
                      timestamp: Date.now()
                    }
                  ]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  character === 'astronaut'
                    ? 'bg-[#2EC4B6] text-white shadow-xs'
                    : 'text-[#5C665E] dark:text-gray-300'
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Najm</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (hasDino) {
                    setLockNotice(null);
                    setCharacter('dino');
                    setMessages([
                      {
                        id: '1',
                        role: 'assistant',
                        content:
                          'Roar! Hello friend! I am Dino Rex. Let us play word games and riddles together!',
                        timestamp: Date.now()
                      }
                    ]);
                  } else {
                    setLockNotice('افتح شخصية Dino Rex من المتجر مقابل 50 نجمة.');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  character === 'dino'
                    ? 'bg-[#2EC4B6] text-white shadow-xs'
                    : hasDino
                      ? 'text-[#5C665E] dark:text-gray-300'
                      : 'text-[#8A948C]'
                }`}
              >
                {hasDino ? <Sparkles className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                <span>Dino Rex</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (hasRobo) {
                    setLockNotice(null);
                    setCharacter('robo');
                    setMessages([
                      {
                        id: '1',
                        role: 'assistant',
                        content:
                          'Beep boop! I am Robo-Z. Ready to learn cool English vocabulary?',
                        timestamp: Date.now()
                      }
                    ]);
                  } else {
                    setLockNotice('افتح شخصية Robo-Z من المتجر مقابل 100 نجمة.');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  character === 'robo'
                    ? 'bg-[#2EC4B6] text-white shadow-xs'
                    : hasRobo
                      ? 'text-[#5C665E] dark:text-gray-300'
                      : 'text-[#8A948C]'
                }`}
              >
                {hasRobo ? <Bot className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                <span>Robo-Z</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setLockNotice(null);
                  setCharacter('barista');
                  setMessages([
                    {
                      id: '1',
                      role: 'assistant',
                      content:
                        'Hello there! Welcome to our London café. What would you like to order today?',
                      timestamp: Date.now()
                    }
                  ]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  character === 'barista'
                    ? 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                    : 'text-[#5C665E] dark:text-gray-300'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Barista</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLockNotice(null);
                  setCharacter('guide');
                  setMessages([
                    {
                      id: '1',
                      role: 'assistant',
                      content:
                        'Hello! I am Sarah, your London tour guide. How can I help you navigate the city today?',
                      timestamp: Date.now()
                    }
                  ]);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  character === 'guide'
                    ? 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                    : 'text-[#5C665E] dark:text-gray-300'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Tour Guide</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (hasCareer) {
                    setLockNotice(null);
                    setCharacter('career');
                    setMessages([
                      {
                        id: '1',
                        role: 'assistant',
                        content:
                          'Hello! I am your Career Coach. Let us practice professional interviews and workplace terms like EOD and WFH.',
                        timestamp: Date.now()
                      }
                    ]);
                  } else {
                    setLockNotice('افتح مدرب العمل والمقابلات من المتجر مقابل 50 XP.');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  character === 'career'
                    ? 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                    : hasCareer
                      ? 'text-[#5C665E] dark:text-gray-300'
                      : 'text-[#8A948C]'
                }`}
              >
                {hasCareer ? <Briefcase className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                <span>Career</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (hasNyc) {
                    setLockNotice(null);
                    setCharacter('nyc');
                    setMessages([
                      {
                        id: '1',
                        role: 'assistant',
                        content:
                          'Yo! Welcome to NYC. Ready to master American street slang and idioms?',
                        timestamp: Date.now()
                      }
                    ]);
                  } else {
                    setLockNotice('افتح رفيق شوارع نيويورك من المتجر مقابل 100 XP.');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  character === 'nyc'
                    ? 'bg-[#1B4332] text-[#FAF8F5] shadow-xs'
                    : hasNyc
                      ? 'text-[#5C665E] dark:text-gray-300'
                      : 'text-[#8A948C]'
                }`}
              >
                {hasNyc ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
                <span>NYC</span>
              </button>
            </>
          )}
        </div>
      </div>

      {lockNotice && (
        <div className="mb-3 px-4 py-3 rounded-2xl bg-[#D4A373]/15 border border-[#D4A373]/40 text-[#7C4D2B] dark:text-[#E9C46A] text-xs font-semibold flex items-center justify-between gap-3 shrink-0">
          <span>{lockNotice}</span>
          {onOpenShop && (
            <button
              type="button"
              onClick={onOpenShop}
              className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 ${
                isKid ? 'bg-[#FF9F1C] hover:bg-[#E88D14]' : 'bg-[#1B4332] hover:bg-[#143326]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>اذهب للمتجر</span>
            </button>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-5 px-1 py-3">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? isKid
                      ? 'bg-[#FF9F1C] text-white'
                      : 'bg-[#1B4332] text-[#FAF8F5]'
                    : isKid
                      ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                      : 'bg-[#D4A373]/20 text-[#9C6644] dark:text-[#D4A373]'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : renderCharacterIcon(character, 'w-4 h-4')}
              </div>

              <div
                className={`max-w-[82%] sm:max-w-[72%] rounded-3xl p-4 sm:p-5 border ${
                  isUser
                    ? isKid
                      ? 'bg-[#2EC4B6] text-white border-[#2EC4B6] rounded-tr-sm'
                      : 'bg-[#1B4332] text-[#FAF8F5] border-[#1B4332] rounded-tr-sm'
                    : 'bg-white/95 dark:bg-[#18201C] text-[#1B4332] dark:text-gray-100 rounded-tl-sm border-[#E8E2D9] dark:border-white/10'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-[#5C665E] dark:text-gray-300" dir="ltr">
                    <span>{characterBotName}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#1B4332] dark:text-[#D4A373]">
                      <Check className="w-3 h-3" />
                      <span>AI</span>
                    </span>
                  </div>
                )}

                <div className="text-sm sm:text-base font-medium leading-relaxed whitespace-pre-line" dir="auto">
                  {msg.content}
                </div>

                {!isUser && (
                  <div className="mt-3 pt-2.5 border-t border-[#1B4332]/[0.08] dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        const hasArabic = /[\u0600-\u06FF]/.test(msg.content);
                        if (hasArabic) {
                          const englishSegments = msg.content.match(/[A-Za-z][A-Za-z0-9\s,'?!.-]{2,}/g);
                          if (englishSegments && englishSegments.length > 0) {
                            speakText(englishSegments.join('. '));
                            return;
                          }
                        }
                        speakText(msg.content);
                      }}
                      className={`text-xs font-semibold flex items-center gap-1.5 hover:underline ${
                        isKid ? 'text-[#2EC4B6]' : 'text-[#1B4332] dark:text-[#D4A373]'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Listen pronunciation</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                isKid ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]' : 'bg-[#D4A373]/20 text-[#9C6644]'
              }`}
            >
              {renderCharacterIcon(character, 'w-4 h-4')}
            </div>
            <div className="bg-white/95 dark:bg-[#18201C] px-4 py-3 rounded-2xl border border-[#E8E2D9] dark:border-white/10 text-xs text-[#6B756D]">
              جاري كتابة الرد...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="mt-3 mb-2 flex items-center gap-2 editorial-card p-2 rounded-2xl shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your English message here..."
          className="flex-1 px-4 py-2.5 bg-transparent text-[#1B4332] dark:text-gray-100 placeholder:text-[#8A948C] focus:outline-none text-sm sm:text-base font-medium"
          dir="auto"
        />
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={loading || !inputMessage.trim()}
          className={`p-3 rounded-xl text-white transition-all ${
            loading || !inputMessage.trim()
              ? 'bg-gray-300 dark:bg-white/10 cursor-not-allowed'
              : isKid
                ? 'bg-[#2EC4B6] hover:bg-[#24A99D] active:scale-95'
                : 'bg-[#1B4332] hover:bg-[#143326] active:scale-95'
          }`}
          aria-label="إرسال"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
