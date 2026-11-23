import React from 'react';
import { TabType, AppMode } from '../types';
import {
  Languages,
  Camera,
  MessageSquareText,
  Trophy,
  Award,
  BookOpen,
  ShoppingBag
} from 'lucide-react';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  mode: AppMode;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, mode }) => {
  const isKid = mode === 'kid';

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    {
      id: 'translator',
      label: 'المترجم',
      icon: <Languages className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
    },
    {
      id: 'lens',
      label: 'العدسة',
      icon: <Camera className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
    },
    {
      id: 'chat',
      label: 'المحادثة',
      icon: <MessageSquareText className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
    },
    {
      id: 'practice',
      label: isKid ? 'التحديات' : 'التمارين',
      icon: <Trophy className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
    },
    ...(!isKid
      ? [
          {
            id: 'stories' as TabType,
            label: 'الستوري',
            icon: <BookOpen className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          }
        ]
      : []),
    {
      id: 'shop',
      label: 'المتجر',
      icon: <ShoppingBag className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
    },
    {
      id: 'progress',
      label: isKid ? 'نجومي' : 'الإنجازات',
      icon: <Award className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
    }
  ];

  return (
    <nav
      className="fixed bottom-4 inset-x-0 z-30 flex justify-center px-3 pointer-events-none"
      aria-label="التنقل الرئيسي"
    >
      <div
        className={`pointer-events-auto max-w-full overflow-x-auto no-scrollbar rounded-full p-1.5 flex items-center gap-1 backdrop-blur-2xl border transition-all ${
          isKid
            ? 'bg-[#FFFDF7]/92 dark:bg-[#1E1A16]/92 border-[#EFE5D1] dark:border-white/15 shadow-[0_14px_36px_-10px_rgba(46,196,182,0.28)]'
            : 'bg-[#FAF8F5]/92 dark:bg-[#161E1A]/92 border-[#E5DEC9] dark:border-white/15 shadow-[0_16px_40px_-12px_rgba(27,67,50,0.22)]'
        }`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[40px] px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 active:scale-95 whitespace-nowrap shrink-0 ${
                isActive
                  ? isKid
                    ? 'bg-[#2EC4B6] text-white font-semibold shadow-sm'
                    : 'bg-[#1B4332] text-[#FAF8F5] font-semibold shadow-sm'
                  : 'text-[#5C665E] dark:text-gray-400 hover:text-[#1B4332] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] font-medium'
              }`}
            >
              <span className="shrink-0">{tab.icon}</span>
              <span className={`text-xs ${isActive ? 'inline' : 'hidden sm:inline'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
