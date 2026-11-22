import React, { useState, useRef, useEffect } from 'react';
import { AppMode, ChatMessage } from '../types';
import { speakText } from '../utils/speech';
import { User, Bot, Send, Volume2, Coffee, Compass, Rocket, Check, Wand2 } from 'lucide-react';

interface AiChatTabProps {
  mode: AppMode;
  onActivity: (type: 'chat', points: number) => void;
  chatXp?: number;
  onOpenWorkshop?: () => void;
}

export const AiChatTab: React.FC<AiChatTabProps> = ({
  mode,
  onActivity,
  chatXp = 0,
  onOpenWorkshop
}) => {
  const [character, setCharacter] = useState<'astronaut' | 'barista' | 'guide'>(mode === 'kid' ? 'astronaut' : 'barista');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: mode === 'kid' 
        ? 'Hello space traveler! ⭐ I am Najm! Let us talk in English and explore the galaxy together!' 
        : 'Hello there! Welcome to our London café. What would you like to order today?',
      timestamp: Date.now()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isKid = mode === 'kid';

  useEffect(() => {
    if (isKid && character !== 'astronaut') {
      setCharacter('astronaut');
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Hello space traveler! ⭐ I am Najm! Let us talk in English and explore the galaxy together!',
        timestamp: Date.now()
      }]);
    } else if (!isKid && character === 'astronaut') {
      setCharacter('barista');
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Hello there! Welcome to our London café. What would you like to order today?',
        timestamp: Date.now()
      }]);
    }
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
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

      setMessages(prev => [...prev, assistantMsg]);
      if (res.ok && !data.error) {
        onActivity('chat', isKid ? 10 : 5);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I am having a connection issue. Let us try again!',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3 flex flex-col h-[calc(100vh-115px)]">
      
      {/* Compact Top Character Header Bar */}
      <div className="bg-white dark:bg-gray-800 px-4 py-2.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${
            isKid ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-[#2D6A4F]'
          }`}>
            {character === 'astronaut' ? <Rocket className="w-5 h-5 animate-pulse" /> : character === 'barista' ? <Coffee className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-gray-800 dark:text-white text-xs sm:text-sm">
                {character === 'astronaut' ? 'Najm Space Astronaut 🚀' : character === 'barista' ? 'Oliver - London Barista ☕' : 'Sarah - London Tour Guide 🧭'}
              </h3>
              <span
                className="inline-flex items-center gap-0.5 bg-[#5865F2] text-white text-[10px] font-black tracking-wide px-1.5 py-0.5 rounded shrink-0"
                dir="ltr"
                title="Verified AI Bot"
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
                <span>BOT</span>
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>متصل الآن</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{isKid ? 'Pure English space chat' : 'Conversational English practice'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={onOpenWorkshop}
            disabled={!onOpenWorkshop}
            className="px-2.5 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/50 hover:bg-purple-200 text-purple-800 dark:text-purple-200 text-[11px] font-black flex items-center gap-1 border border-purple-300/60 dark:border-purple-700/60 transition-colors"
            title="أنفق Chat XP (+10 لكل رسالة) في طاولة التطوير السحري"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="tabular-nums" dir="ltr">
              {chatXp} Chat XP
            </span>
          </button>

          {!isKid && (
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl gap-1">
              <button
                onClick={() => {
                  setCharacter('barista');
                  setMessages([{ id: '1', role: 'assistant', content: 'Hello there! Welcome to our London café. What would you like to order today?', timestamp: Date.now() }]);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${character === 'barista' ? 'bg-[#2D6A4F] text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Barista
              </button>
              <button
                onClick={() => {
                  setCharacter('guide');
                  setMessages([{ id: '1', role: 'assistant', content: 'Hello! I am Sarah, your London tour guide. How can I help you navigate the city today?', timestamp: Date.now() }]);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${character === 'guide' ? 'bg-[#2D6A4F] text-white shadow' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Tour Guide
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spacious Full-Width Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                isUser ? 'bg-[#2D6A4F] text-white' : isKid ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[80%] sm:max-w-[70%] rounded-3xl p-4 shadow-sm ${
                isUser 
                  ? 'bg-[#2D6A4F] text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
              }`}>
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1.5" dir="ltr">
                    <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200">
                      {character === 'astronaut' ? 'Najm' : character === 'barista' ? 'Oliver' : 'Sarah'}
                    </span>
                    <span className="inline-flex items-center gap-0.5 bg-[#5865F2] text-white text-[9px] font-black px-1.5 py-0.5 rounded leading-none">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      <span>BOT</span>
                    </span>
                  </div>
                )}
                <div className="text-base font-medium leading-relaxed whitespace-pre-line" dir="auto">
                  {msg.content}
                </div>

                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <button
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
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 hover:underline"
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
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm text-gray-400 text-xs animate-pulse">
              AI character is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Clean Bottom Fixed Message Input Box */}
      <div className="mt-2 mb-2 flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder={isKid ? 'Type your English message here... 🚀' : 'Type your English message here...'}
          className="flex-1 px-4 py-3 bg-transparent text-gray-800 dark:text-gray-100 focus:outline-none text-base font-medium"
          dir="auto"
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !inputMessage.trim()}
          className={`p-3.5 rounded-xl text-white shadow-md transition-all ${
            loading || !inputMessage.trim() ? 'bg-gray-300 cursor-not-allowed' : isKid ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#2D6A4F] hover:bg-[#1b4332]'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
