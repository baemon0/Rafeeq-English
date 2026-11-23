import React, { useState, useRef, useEffect } from 'react';
import { AppMode, LensResult, VocabularyWord } from '../types';
import { speakText } from '../utils/speech';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Compass,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Star,
  Upload,
  Volume2,
  XCircle,
  Zap
} from 'lucide-react';

interface SmartLensTabProps {
  mode: AppMode;
  authToken?: string | null;
  onActivity: (type: 'lens', points: number) => void;
  onVocabularySynced?: (vocabulary: VocabularyWord[]) => void;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  targetCategory: string;
  hint: string;
}

interface VerifyResult {
  success: boolean;
  feedback: string;
  stars: number;
}

export const SmartLensTab: React.FC<SmartLensTabProps> = ({
  mode,
  authToken,
  onActivity,
  onVocabularySynced
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LensResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Kids Treasure Hunt state
  const [mission, setMission] = useState<Mission | null>(null);
  const [missionLoading, setMissionLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isKid = mode === 'kid';

  useEffect(() => {
    if (isKid) {
      fetchNewMission();
    }
  }, [isKid]);

  const fetchNewMission = async () => {
    setMissionLoading(true);
    setVerifyResult(null);
    setPreviewImage(null);
    try {
      const res = await fetch('/api/lens/mission');
      const data = await res.json();
      setMission(data);
    } catch (err) {
      console.error('Mission fetch error:', err);
      setMission({
        id: '1',
        title: 'Find something blue!',
        description: 'Take a photo of any object that is blue.',
        targetCategory: 'blue object',
        hint: 'Look around your room for blue items.'
      });
    } finally {
      setMissionLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('تعذر الوصول إلى الكاميرا. يمكنك رفع صورة من جهازك بدلاً من ذلك.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreviewImage(dataUrl);
      stopCamera();
      if (isKid && mission) {
        verifyMissionPhoto(dataUrl);
      } else {
        analyzeImage(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCameraError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setPreviewImage(resultStr);
      if (isKid && mission) {
        verifyMissionPhoto(resultStr);
      } else {
        analyzeImage(resultStr);
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageBase64: string) => {
    setLoading(true);
    setResult(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await fetch('/api/lens', {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: imageBase64, mode })
      });
      const data = await res.json();
      setResult(data);
      if (res.ok && !data.error) {
        if (Array.isArray(data.vocabulary) && onVocabularySynced) {
          onVocabularySynced(data.vocabulary);
        }
        onActivity('lens', isKid ? data.stars || 15 : 15);
      }
    } catch (err) {
      console.error('Smart lens error:', err);
      setResult({
        englishName: 'Object',
        arabicName: 'عنصر',
        phonetic: 'ˈɒbʤɪkt',
        sentence: 'This is a fascinating item to explore.',
        stars: 5,
        funFact: 'Every object has its own story in English!'
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyMissionPhoto = async (imageBase64: string) => {
    setLoading(true);
    setVerifyResult(null);

    try {
      const res = await fetch('/api/lens/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, mission })
      });
      const data = await res.json();
      setVerifyResult(data);
      if (res.ok && data.success) {
        onActivity('lens', data.stars || 20);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerifyResult({
        success: false,
        feedback: 'Connection issue while checking your photo. Please try again!',
        stars: 0
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-32 space-y-8">
      {/* Header Banner */}
      <div className="editorial-card rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
        {isKid && (
          <svg
            className="pointer-events-none absolute bottom-0 left-0 right-0 w-full h-10 text-[#2EC4B6]/10"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M0,48 C220,110 460,5 740,64 C960,110 1100,32 1200,56 L1200,120 L0,120 Z"
            />
          </svg>
        )}

        <div className="relative z-10">
          <div
            className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${
              isKid
                ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                : 'bg-[#1B4332]/10 dark:bg-[#D4A373]/15 text-[#1B4332] dark:text-[#D4A373]'
            }`}
          >
            <Camera className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1B4332] dark:text-[#FAF8F5]">
            {isKid ? 'مهمة العدسة الذكية' : 'العدسة الذكية للتعرف على الأشياء'}
          </h2>
          <p className="text-sm text-[#5C665E] dark:text-gray-400 mt-1.5 max-w-lg mx-auto leading-relaxed">
            {isKid
              ? mission?.description || 'جاري تجهيز مهمة البحث القادمة...'
              : 'التقط صورة أو ارفع ملفاً للتعرف على اسم الشيء بالإنجليزية، نطقه الصوتي، ومثال عملي له.'}
          </p>

          {isKid && mission && (
            <div className="mt-6 p-4 rounded-2xl bg-[#FF9F1C]/10 border border-[#FF9F1C]/30 flex items-center justify-between gap-4 flex-wrap text-right">
              <div className="flex items-center gap-3 text-left" dir="ltr">
                <div className="w-10 h-10 rounded-full bg-[#FF9F1C]/20 text-[#D97706] flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1F2933] dark:text-white">
                    {mission.title}
                  </h4>
                  <p className="text-xs text-[#5C665E] dark:text-gray-300 mt-0.5">{mission.hint}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchNewMission}
                disabled={missionLoading}
                className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 text-[#1F2933] dark:text-white border border-[#EFE5D1] dark:border-white/10 font-semibold text-xs flex items-center gap-1.5 hover:border-[#2EC4B6] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${missionLoading ? 'animate-spin' : ''}`} />
                <span>مهمة جديدة</span>
              </button>
            </div>
          )}

          {cameraError && (
            <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className={`px-6 py-3 rounded-2xl font-semibold text-sm text-white flex items-center gap-2 transition-all active:scale-95 ${
                  isKid ? 'bg-[#2EC4B6] hover:bg-[#24A99D]' : 'bg-[#1B4332] hover:bg-[#143326]'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>فتح الكاميرا</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={capturePhoto}
                className="px-7 py-3 rounded-2xl font-semibold text-sm bg-[#FF9F1C] hover:bg-[#E88D14] text-white flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>التقاط الصورة الآن</span>
              </button>
            )}

            <label className="px-6 py-3 rounded-2xl font-semibold text-sm bg-black/[0.04] dark:bg-white/5 border border-[#E5DEC9] dark:border-white/10 text-[#1B4332] dark:text-gray-200 hover:bg-black/[0.08] cursor-pointer flex items-center gap-2 transition-colors">
              <Upload className="w-4 h-4" />
              <span>رفع صورة</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {cameraActive && (
            <div className="mt-6 relative rounded-3xl overflow-hidden shadow-xl border-2 border-[#2EC4B6] max-w-md mx-auto bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
              <button
                type="button"
                onClick={stopCamera}
                className="absolute top-3 left-3 bg-black/65 text-white px-3 py-1.5 rounded-full text-xs font-semibold"
              >
                إغلاق الكاميرا
              </button>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="editorial-card rounded-3xl p-8 text-center">
          <RefreshCw
            className={`w-8 h-8 animate-spin mx-auto mb-3 ${
              isKid ? 'text-[#2EC4B6]' : 'text-[#1B4332] dark:text-[#D4A373]'
            }`}
          />
          <h3 className="text-base font-bold text-[#1B4332] dark:text-white">
            جاري تحليل الصورة واستخراج المفردات...
          </h3>
          <p className="text-xs text-[#6B756D] mt-1">
            يتم التعرف على العناصر وحفظها تلقائياً في سجل المراجعة
          </p>
        </div>
      )}

      {/* Kids Verification Result */}
      {isKid && verifyResult && !loading && (
        <div
          className={`editorial-card rounded-3xl p-6 sm:p-8 ${
            verifyResult.success ? 'border-[#2EC4B6]/50' : 'border-[#FF9F1C]/50'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                verifyResult.success
                  ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]'
                  : 'bg-[#FF9F1C]/15 text-[#D97706]'
              }`}
            >
              {verifyResult.success ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#1F2933] dark:text-white mb-1">
                {verifyResult.success ? 'أحسنت! أتممت المهمة بنجاح' : 'قريب جداً! حاول مرة أخرى'}
              </h3>
              <p className="text-sm text-[#5C665E] dark:text-gray-300 leading-relaxed" dir="ltr">
                {verifyResult.feedback}
              </p>
            </div>
          </div>
          {verifyResult.success && (
            <div className="mt-5 pt-4 border-t border-[#1B4332]/[0.08] flex justify-between items-center gap-3 flex-wrap">
              <span className="font-bold text-sm text-[#B45309] flex items-center gap-1.5 tabular-nums">
                <Star className="w-4 h-4 fill-[#FF9F1C] text-[#FF9F1C]" />
                <span>+{verifyResult.stars} نجوم إضافية</span>
              </span>
              <button
                type="button"
                onClick={fetchNewMission}
                className="px-5 py-2 rounded-xl bg-[#2EC4B6] hover:bg-[#24A99D] text-white font-semibold text-xs"
              >
                المهمة التالية
              </button>
            </div>
          )}
        </div>
      )}

      {/* Adult Result Card */}
      {result && !loading && !isKid && (
        <div className="editorial-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center">
          {previewImage && (
            <div className="w-full md:w-1/3 rounded-2xl overflow-hidden h-48 border border-[#E5DEC9] dark:border-white/10">
              <img
                src={previewImage}
                alt={result.englishName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 w-full text-left space-y-4" dir="ltr">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#9C6644] dark:text-[#D4A373] flex items-center gap-1 tabular-nums">
                <Zap className="w-3.5 h-3.5" />
                <span>+15 XP</span>
              </span>
              <button
                type="button"
                onClick={() => speakText(result.englishName)}
                className="flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-[#FAF8F5] px-4 py-2 rounded-xl text-xs font-semibold"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen Pronunciation</span>
              </button>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-[#1B4332] dark:text-white">
                {result.englishName}
              </h3>
              <p className="text-sm text-[#5C665E] dark:text-gray-300 mt-1" dir="rtl">
                {result.arabicName}
              </p>
              {result.phonetic && (
                <p className="text-sm font-mono text-[#9C6644] dark:text-[#D4A373] mt-1">
                  /{result.phonetic}/
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-[#1B4332]/[0.08] dark:border-white/10">
              <p className="text-xs font-semibold text-[#6B756D] mb-1">Practical Sentence</p>
              <p className="text-base font-medium text-[#1B4332] dark:text-gray-100">
                "{result.sentence}"
              </p>
            </div>

            {result.funFact && (
              <div className="p-3.5 rounded-2xl bg-[#D4A373]/12 border border-[#D4A373]/30 text-[#5C3D24] dark:text-[#E9C46A] text-xs flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-[#C87D55] shrink-0 mt-0.5" />
                <span>
                  <strong>Fun Fact: </strong> {result.funFact}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
