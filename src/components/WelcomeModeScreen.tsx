import React, { useState } from 'react';
import { AppMode, CloudUser } from '../types';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Languages,
  Lock,
  LogIn,
  LogOut,
  Sparkles,
  Star,
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
      return 'كلمة المرور قصيرة وضعيفة! يجب أن تكون بين 4 و 8 خانات.';
    }
    if (WEAK_PASSWORDS.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) {
      return 'كلمة المرور ضعيفة وسهلة التخمين! اختر كلمة مرور أقوى.';
    }
  }
  return null;
}

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
    const trimmedMax = val.slice(0, 8);
    setPassword(trimmedMax);
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

  // Authenticated quick profile switcher (after clicking خروج / تبديل)
  if (currentUser) {
    return (
      <div
        className="min-h-screen bg-[#F4F8F6] dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col justify-center px-4 py-8 sm:py-12 font-sans antialiased"
        dir="rtl"
      >
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center shadow-lg mx-auto mb-4">
              <Languages className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              مرحباً بعودتك، {currentUser.username}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
              اختر القسم الذي تود المتابعة فيه — جميع نقاطك وتقدمك محفوظ سحابياً.
            </p>
          </div>

          {/* Account Bar */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm mb-6 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-[#2D6A4F] dark:text-emerald-300 flex items-center justify-center font-black">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                  {currentUser.username}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  الحساب متزامن سحابياً
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج (تبديل الحساب)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
            <button
              type="button"
              onClick={() => onSelectModeWhileLoggedIn('kid')}
              className="group text-right bg-white dark:bg-gray-900 rounded-3xl p-6 border-2 border-amber-200 dark:border-amber-800/70 shadow-md hover:shadow-xl hover:border-rose-400 active:scale-[0.98] transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white flex items-center justify-center shadow-sm shrink-0">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 dark:text-amber-300 tabular-nums">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {currentUser.profiles.kid.progress.stars} نجمة
                  </span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1.5">
                  قسم الصغار 🧸
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
                  متابعة تحديات النجوم، محادثة نجم، والعدسة السحرية.
                </p>
              </div>
              <div className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-sm flex items-center justify-between shadow-sm">
                <span>الدخول لقسم الصغار</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectModeWhileLoggedIn('adult')}
              className="group text-right bg-white dark:bg-gray-900 rounded-3xl p-6 border-2 border-emerald-200 dark:border-emerald-800/70 shadow-md hover:shadow-xl hover:border-[#2D6A4F] active:scale-[0.98] transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center shadow-sm shrink-0">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-[#2D6A4F] dark:text-emerald-300 tabular-nums" dir="ltr">
                    <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {currentUser.profiles.adult.progress.xp} XP
                  </span>
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1.5">
                  قسم الكبار 🎓
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
                  متابعة المترجم الذكي، المحادثات الواقعية، وتحديات XP.
                </p>
              </div>
              <div className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[#2D6A4F] text-white font-bold text-sm flex items-center justify-between shadow-sm">
                <span>الدخول لقسم الكبار</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated Welcome Screen: Sign Up / Login + Profile Selection
  return (
    <div
      className="min-h-screen bg-[#F4F8F6] dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col justify-center px-4 py-8 font-sans antialiased"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto w-full">
        {/* App Welcome Logo & Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center shadow-lg mx-auto mb-4">
            <Languages className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight text-balance">
            مرحباً بك في رفيق الإنجليزية
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 max-w-lg mx-auto leading-relaxed">
            سجّل حسابك لحفظ تقدمك، نقاطك، وترجماتك في السحابة والوصول إليها من أي جهاز.
          </p>
        </div>

        {/* Auth & Profile Selection Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-7 shadow-lg border border-gray-200 dark:border-gray-800"
        >
          {/* Sign Up / Login Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthTab('signup');
                setErrorAlert(null);
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                authTab === 'signup'
                  ? 'bg-white dark:bg-gray-950 text-[#2D6A4F] dark:text-emerald-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
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
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all ${
                authTab === 'login'
                  ? 'bg-white dark:bg-gray-950 text-[#2D6A4F] dark:text-emerald-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
          </div>

          {/* Clear Arabic Validation / Auth Alert */}
          {errorAlert && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-bold flex items-start gap-2.5"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorAlert}</span>
            </div>
          )}

          {/* Username & Password Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5">
                اسم المستخدم
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorAlert) setErrorAlert(null);
                  }}
                  placeholder="مثال: noor_star"
                  maxLength={24}
                  required
                  className="w-full min-h-[48px] pr-10 pl-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300">
                  كلمة المرور (حد أقصى 8 خانات)
                </label>
                <span className="text-[11px] font-bold text-gray-400 tabular-nums" dir="ltr">
                  {password.length}/8
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Abc@1234"
                  maxLength={8}
                  required
                  dir="ltr"
                  className="w-full min-h-[48px] pr-10 pl-10 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                أحرف إنجليزية، أرقام، ورموز فقط (4 إلى 8 خانات)
              </p>
            </div>
          </div>

          {/* Profile Type Selector Cards */}
          <div className="mb-6">
            <p className="text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-2.5">
              اختر نوع القسم:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kids Card */}
              <button
                type="button"
                onClick={() => setSelectedMode('kid')}
                className={`text-right rounded-2xl p-4 border-2 transition-all flex items-start gap-3.5 ${
                  selectedMode === 'kid'
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/50 hover:border-rose-300'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">
                      قسم الصغار 🧸
                    </h2>
                    {selectedMode === 'kid' && (
                      <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    مغامرات نجم، جمع النجوم ⭐، ومهام العدسة للأعمار 5–11 سنة.
                  </p>
                </div>
              </button>

              {/* Adults Card */}
              <button
                type="button"
                onClick={() => setSelectedMode('adult')}
                className={`text-right rounded-2xl p-4 border-2 transition-all flex items-start gap-3.5 ${
                  selectedMode === 'adult'
                    ? 'border-[#2D6A4F] bg-emerald-50/70 dark:bg-emerald-950/30 shadow-md'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/50 hover:border-emerald-300'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center shadow-sm shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">
                      قسم الكبار 🎓
                    </h2>
                    {selectedMode === 'adult' && (
                      <CheckCircle2 className="w-5 h-5 text-[#2D6A4F] dark:text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    اللهجة السعودية، بيئة العمل، ونظام نقاط الخبرة XP والرتب.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Primary Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full min-h-[52px] px-6 py-3.5 rounded-2xl text-white font-black text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : selectedMode === 'kid'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95'
                  : 'bg-[#2D6A4F] hover:bg-[#1b4332]'
            }`}
          >
            <span>
              {loading
                ? 'جاري المزامنة...'
                : authTab === 'signup'
                  ? 'إنشاء الحساب والبدء'
                  : 'تسجيل الدخول والمزامنة'}
            </span>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
