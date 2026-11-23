import React, { useState } from 'react';
import { AppMode, CloudUser } from '../types';
import { FooterCredits } from './FooterCredits';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CloudCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Languages,
  Lock,
  LogIn,
  LogOut,
  Star,
  Sun,
  User,
  UserPlus,
  Zap
} from 'lucide-react';

interface WelcomeModeScreenProps {
  currentUser: CloudUser | null;
  initialMode?: AppMode | null;
  onAuthSuccess: (token: string, user: CloudUser, selectedMode: AppMode) => void;
  onSelectModeWhileLoggedIn: (selectedMode: AppMode) => void;
  onLogout: () => void;
}

const ALLOWED_PASSWORD_REGEX = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?`~]+$/;
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

function validatePasswordClient(password: string, isSignup: boolean): string | null {
  if (!password) {
    return 'يرجى إدخال كلمة المرور.';
  }
  if (password.length > 8) {
    return 'كلمة المرور يجب ألا تتجاوز 8 خانات كحد أقصى.';
  }
  if (!ALLOWED_PASSWORD_REGEX.test(password)) {
    return 'كلمة المرور تقبل الأحرف الإنجليزية والأرقام والرموز فقط (بدون حروف عربية أو مسافات).';
  }
  if (isSignup) {
    if (password.length < 4) {
      return 'كلمة المرور قصيرة! يجب أن تكون بين 4 و 8 خانات.';
    }
    if (WEAK_PASSWORDS.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) {
      return 'كلمة المرور ضعيفة وسهلة التخمين! اختر كلمة مرور أقوى.';
    }
  }
  return null;
}

const AmbientBackdrop: React.FC = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    {/* Base Gradient Mesh */}
    <div className="absolute inset-0 ambient-canvas" />

    {/* Floating Organic Orbs (GPU-Accelerated) */}
    <div className="ambient-orb-emerald absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-[#1B4332]/20 dark:bg-[#2D6A4F]/35 blur-3xl" />
    <div className="ambient-orb-sage absolute top-1/4 -left-28 w-[30rem] h-[30rem] rounded-full bg-[#84A98C]/35 dark:bg-[#52796F]/25 blur-3xl" />
    <div className="ambient-orb-gold absolute -bottom-24 right-1/4 w-[26rem] h-[26rem] rounded-full bg-[#D4A373]/30 dark:bg-[#D4A373]/18 blur-3xl" />
    <div className="ambient-orb-sage absolute bottom-12 left-12 w-72 h-72 rounded-full bg-[#E9C46A]/25 dark:bg-[#1B4332]/30 blur-3xl" />

    {/* Subtle Organic Wave Silhouette */}
    <svg
      className="absolute bottom-0 left-0 right-0 w-full h-44 text-[#1B4332]/[0.05] dark:text-[#84A98C]/[0.06]"
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
    >
      <path
        fill="currentColor"
        d="M0,128 C240,210 480,50 760,120 C1040,190 1240,80 1440,130 L1440,220 L0,220 Z"
      />
    </svg>
  </div>
);

export const WelcomeModeScreen: React.FC<WelcomeModeScreenProps> = ({
  currentUser,
  initialMode,
  onAuthSuccess,
  onSelectModeWhileLoggedIn,
  onLogout
}) => {
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');
  const [selectedMode, setSelectedMode] = useState<AppMode>(initialMode || 'adult');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const handlePasswordChange = (val: string) => {
    setPassword(val.slice(0, 8));
    if (errorAlert) setErrorAlert(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAlert(null);

    const cleanUsername = username.trim();
    if (cleanUsername.length < 2 || cleanUsername.length > 24) {
      setErrorAlert('اسم المستخدم يجب أن يكون بين حرفين و 24 حرفاً.');
      return;
    }

    const pwError = validatePasswordClient(password, authTab === 'signup');
    if (pwError) {
      setErrorAlert(pwError);
      return;
    }

    setLoading(true);
    try {
      const endpoint = authTab === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password,
          mode: selectedMode
        })
      });
      const data = await res.json();
      if (!res.ok || !data.token || !data.user) {
        setErrorAlert(data.error || 'تعذر إتمام العملية، يرجى المحاولة مرة أخرى.');
        return;
      }
      onAuthSuccess(data.token, data.user, selectedMode);
    } catch {
      setErrorAlert('تعذر الاتصال بالخادم، يرجى التأكد من الشبكة والمحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Authenticated quick profile switcher
  if (currentUser) {
    return (
      <div
        className="min-h-screen relative flex items-center justify-center px-4 py-10 text-[#1B4332] dark:text-[#FAF8F5]"
        dir="rtl"
      >
        <AmbientBackdrop />

        <div className="relative z-10 w-full max-w-md glass-auth-card rounded-[2rem] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373] flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">مرحباً، {currentUser.username}</h1>
                <p className="text-xs text-[#4F6255] dark:text-emerald-300/80 flex items-center gap-1 mt-0.5">
                  <CloudCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>الحساب متزامن سحابياً</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-rose-500/10 text-[#5C665E] dark:text-gray-300 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>

          <p className="text-xs text-[#5C665E] dark:text-gray-300 mb-4">
            اختر القسم الذي تود المتابعة فيه:
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onSelectModeWhileLoggedIn('adult')}
              className="group w-full text-right rounded-2xl p-4 bg-white/80 dark:bg-white/5 border border-[#1B4332]/15 dark:border-white/10 hover:border-[#1B4332] transition-all flex items-center justify-between gap-3 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#1B4332] dark:text-white">قسم الكبار</h2>
                  <p className="text-xs text-[#5C665E] dark:text-gray-400 mt-0.5 flex items-center gap-1 tabular-nums">
                    <Zap className="w-3.5 h-3.5 text-[#D4A373]" />
                    <span>{currentUser.profiles.adult.progress.xp} XP</span>
                  </p>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#1B4332] dark:text-[#D4A373] transition-transform group-hover:-translate-x-1 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onSelectModeWhileLoggedIn('kid')}
              className="group w-full text-right rounded-2xl p-4 bg-white/80 dark:bg-white/5 border border-[#2EC4B6]/25 dark:border-white/10 hover:border-[#2EC4B6] transition-all flex items-center justify-between gap-3 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#2EC4B6]/15 text-[#2EC4B6] flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#1F2933] dark:text-white">قسم الصغار</h2>
                  <p className="text-xs text-[#5C665E] dark:text-gray-400 mt-0.5 flex items-center gap-1 tabular-nums">
                    <Star className="w-3.5 h-3.5 text-[#FF9F1C] fill-[#FF9F1C]" />
                    <span>{currentUser.profiles.kid.progress.stars} نجمة</span>
                  </p>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-[#2EC4B6] transition-transform group-hover:-translate-x-1 shrink-0" />
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-[#1B4332]/10 dark:border-white/10">
            <FooterCredits isKid={selectedMode === 'kid'} compact />
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated Welcome Screen: Centered Frosted-Glass Auth Card over Animated Ambient Mesh
  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 py-8 sm:py-12 text-[#1B4332] dark:text-[#FAF8F5]"
      dir="rtl"
    >
      <AmbientBackdrop />

      <div className="relative z-10 w-full max-w-md glass-auth-card rounded-[2rem] p-6 sm:p-8">
        {/* Compact Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373] flex items-center justify-center mx-auto mb-3.5">
            <Languages className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B4332] dark:text-[#FAF8F5]">
            رفيق الإنجليزية
          </h1>
          <p className="text-xs sm:text-sm text-[#5C665E] dark:text-gray-300 mt-1.5 leading-relaxed">
            سجّل دخولك لحفظ نقاطك ومفرداتك سحابياً والوصول إليها من أي جهاز.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Segmented Auth Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#1B4332]/[0.06] dark:bg-white/5 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthTab('signup');
                setErrorAlert(null);
              }}
              className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                authTab === 'signup'
                  ? 'bg-white dark:bg-[#1E2923] text-[#1B4332] dark:text-[#FAF8F5] shadow-sm'
                  : 'text-[#5C665E] dark:text-gray-400 hover:text-[#1B4332]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>مستخدم جديد</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setErrorAlert(null);
              }}
              className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                authTab === 'login'
                  ? 'bg-white dark:bg-[#1E2923] text-[#1B4332] dark:text-[#FAF8F5] shadow-sm'
                  : 'text-[#5C665E] dark:text-gray-400 hover:text-[#1B4332]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
          </div>

          {errorAlert && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-300 shrink-0 mt-0.5" />
              <span>{errorAlert}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A40] dark:text-gray-300 mb-1.5">
              اسم المستخدم
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#738277] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorAlert) setErrorAlert(null);
                }}
                placeholder="noor_star"
                maxLength={24}
                required
                className="w-full min-h-[46px] pr-10 pl-4 py-2.5 rounded-2xl bg-white/85 dark:bg-white/5 border border-[#1B4332]/15 dark:border-white/10 text-sm font-medium text-[#1B4332] dark:text-white placeholder:text-[#98A39B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/40 dark:focus:ring-[#D4A373]/50"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#3C4A40] dark:text-gray-300">
                كلمة المرور
              </label>
              <span className="text-[11px] font-medium text-[#738277] tabular-nums" dir="ltr">
                {password.length}/8
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#738277] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Abc@1234"
                maxLength={8}
                required
                dir="ltr"
                className="w-full min-h-[46px] pr-10 pl-10 py-2.5 rounded-2xl bg-white/85 dark:bg-white/5 border border-[#1B4332]/15 dark:border-white/10 text-sm font-medium text-[#1B4332] dark:text-white placeholder:text-[#98A39B] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/40 dark:focus:ring-[#D4A373]/50 text-left"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#738277] hover:text-[#1B4332] dark:hover:text-white p-1"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-[#6B756D] dark:text-gray-400 mt-1">
              أحرف إنجليزية وأرقام ورموز (4 إلى 8 خانات)
            </p>
          </div>

          {/* Mode Selection */}
          <div>
            <p className="text-xs font-semibold text-[#3C4A40] dark:text-gray-300 mb-2">
              اختر مسار التعلم
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMode('adult')}
                className={`text-right rounded-2xl p-3.5 border transition-all flex items-center gap-2.5 ${
                  selectedMode === 'adult'
                    ? 'border-[#1B4332] bg-[#1B4332]/[0.08] dark:bg-[#1B4332]/40'
                    : 'border-[#1B4332]/12 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:border-[#1B4332]/35'
                }`}
              >
                <span className="w-9 h-9 rounded-full bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-bold text-[#1B4332] dark:text-white truncate">
                      قسم الكبار
                    </span>
                    {selectedMode === 'adult' && (
                      <Check className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#D4A373] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B756D] dark:text-gray-400 truncate mt-0.5">
                    لهجة وعمل · XP
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('kid')}
                className={`text-right rounded-2xl p-3.5 border transition-all flex items-center gap-2.5 ${
                  selectedMode === 'kid'
                    ? 'border-[#2EC4B6] bg-[#2EC4B6]/10 dark:bg-[#2EC4B6]/20'
                    : 'border-[#1B4332]/12 dark:border-white/10 bg-white/60 dark:bg-white/5 hover:border-[#2EC4B6]/50'
                }`}
              >
                <span className="w-9 h-9 rounded-full bg-[#2EC4B6]/15 text-[#2EC4B6] flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-bold text-[#1F2933] dark:text-white truncate">
                      قسم الصغار
                    </span>
                    {selectedMode === 'kid' && (
                      <Check className="w-3.5 h-3.5 text-[#2EC4B6] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B756D] dark:text-gray-400 truncate mt-0.5">
                    5–11 سنة · نجوم
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Primary Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full min-h-[48px] px-5 py-3 rounded-2xl text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] mt-2 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : selectedMode === 'kid'
                  ? 'bg-[#2EC4B6] hover:bg-[#24A99D]'
                  : 'bg-[#1B4332] hover:bg-[#143326]'
            }`}
          >
            <span>
              {loading
                ? 'جاري المزامنة...'
                : authTab === 'signup'
                  ? 'إنشاء الحساب والبدء'
                  : 'تسجيل الدخول والمزامنة'}
            </span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        {/* Boutique Studio Signature neatly inside bottom of card */}
        <div className="mt-6 pt-5 border-t border-[#1B4332]/10 dark:border-white/10">
          <FooterCredits isKid={selectedMode === 'kid'} compact />
        </div>
      </div>
    </div>
  );
};
