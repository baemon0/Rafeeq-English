import React from 'react';
import { TabType, AppMode } from '../types';
import { Languages, Camera, MessageSquareText, Trophy, Award, BookOpen, Palmtree } from 'lucide-react';

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
      label: isKid ? 'المترجم السحري' : 'المترجم',
      icon: <Languages className="w-5 h-5" />
    },
    {
      id: 'lens',
      label: isKid ? 'العدسة السحرية' : 'العدسة',
      icon: <Camera className="w-5 h-5" />
    },
    {
      id: 'chat',
      label: isKid ? 'محادثة نجم' : 'المحادثة',
      icon: <MessageSquareText className="w-5 h-5" />
    },
    {
      id: 'practice',
      label: isKid ? 'ألعاب وتحديات' : 'التمارين',
      icon: <Trophy className="w-5 h-5" />
    },
    {
      id: 'island',
      label: isKid ? 'جزيرتي 🏝️' : 'الجزيرة',
      icon: <Palmtree className="w-5 h-5" />
    },
    ...(!isKid
      ? [
          {
            id: 'stories' as TabType,
            label: 'الستوري',
            icon: <BookOpen className="w-5 h-5" />
          }
        ]
      : []),
    {
      id: 'progress',
      label: isKid ? 'نجومي' : 'الإنجازات',
      icon: <Award className="w-5 h-5" />
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
      <div className="max-w-3xl mx-auto px-2 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all ${
                isActive
                  ? isKid 
                    ? 'text-rose-600 bg-rose-50 scale-105 font-bold shadow-sm' 
                    : 'text-[#2D6A4F] bg-emerald-50 scale-105 font-bold shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[11px] mt-1 font-medium tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
