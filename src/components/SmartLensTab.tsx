import React, { useState, useRef, useEffect } from 'react';
import { AppMode, LensResult, ResourceInventory, ResourceType } from '../types';
import { EMPTY_RESOURCES, RESOURCE_CATALOG } from '../data/avatarCatalog';
import { speakText } from '../utils/speech';
import { Camera, Upload, Sparkles, Volume2, Star, RefreshCw, CheckCircle, XCircle, Compass, Zap, Hammer } from 'lucide-react';

interface SmartLensTabProps {
  mode: AppMode;
  onActivity: (
    type: 'lens',
    points: number,
    scannedObjectName?: string,
    resourceDrop?: { type: ResourceType; amount: number }
  ) => void;
  scannedObjectsCount?: number;
  hasEnchantedAura?: boolean;
  resources?: ResourceInventory;
  onOpenWorkshop?: () => void;
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
  resourceDrop?: { type: ResourceType; amount: number };
}

const RESOURCE_ORDER: ResourceType[] = ['wool', 'glass', 'iron', 'wood', 'paper'];

export const SmartLensTab: React.FC<SmartLensTabProps> = ({
  mode,
  onActivity,
  scannedObjectsCount = 0,
  hasEnchantedAura = false,
  resources = EMPTY_RESOURCES,
  onOpenWorkshop
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LensResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [lastDrop, setLastDrop] = useState<{ type: ResourceType; amount: number } | null>(null);
  const [lastApplied2x, setLastApplied2x] = useState(false);

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
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Camera access denied or unavailable. Please upload an image.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
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
    setLastDrop(null);
    setLastApplied2x(false);

    try {
      const res = await fetch('/api/lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, mode })
      });
      const data = await res.json();
      setResult(data);
      if (res.ok && !data.error) {
        const drop = data.resourceDrop;
        setLastDrop(drop || null);
        setLastApplied2x(hasEnchantedAura);
        onActivity('lens', isKid ? (data.stars || 15) : 15, data.englishName, drop);
      }
    } catch (err) {
      console.error('Smart lens error:', err);
      setResult({
        englishName: 'Object',
        arabicName: 'شيء',
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
    setLastDrop(null);
    setLastApplied2x(false);

    try {
      const res = await fetch('/api/lens/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, mission })
      });
      const data = await res.json();
      setVerifyResult(data);
      if (res.ok && data.success) {
        const drop = data.resourceDrop;
        setLastDrop(drop || null);
        setLastApplied2x(hasEnchantedAura);
        onActivity(
          'lens',
          data.stars || 20,
          mission?.targetCategory || mission?.title || 'mission_object',
          drop
        );
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
    <div className="max-w-3xl mx-auto px-4 py-6 pb-28">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-md border border-gray-100 mb-6 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 mb-3 shadow-inner">
          <Camera className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 dark:text-white">
          {isKid ? 'مهمة العدسة السحرية للصغار 🕵️‍♂️⭐' : 'العدسة الذكية للتعرف على الأشياء'}
        </h2>
        <p className="text-sm text-gray-500 mt-1 max-w-lg mx-auto">
          {isKid 
            ? mission?.description || 'Loading endless treasure hunt missions...'
            : 'Take a photo or upload an object to identify it with Gemini AI Vision, learn its English pronunciation, and see a practical sentence.'}
        </p>

        {/* Camera Explorer 10-Object Milestone Progress */}
        <div className="mt-4 max-w-md mx-auto bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 text-right">
          <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-amber-900 dark:text-amber-200 mb-1.5">
            <span>📸 تحدي مستكشف الكاميرا (10 أغراض فريدة)</span>
            <span className="tabular-nums" dir="ltr">
              {Math.min(scannedObjectsCount, 10)} / 10
            </span>
          </div>
          <div className="w-full h-2 bg-amber-200/70 dark:bg-amber-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((Math.min(scannedObjectsCount, 10) / 10) * 100))}%` }}
            />
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300 mt-1.5 font-semibold">
            {scannedObjectsCount >= 10
              ? '🎉 مبروك! فتحت قبعة المستكشف والكاميرا الذهبية في المتجر!'
              : `صوّر ${10 - scannedObjectsCount} أغراض مختلفة أخرى لفتح قبعة المستكشف والكاميرا الذهبية مجاناً! (+10 🪙 لكل مسح)`}
          </p>
        </div>

        {/* Camera Resources & Crafting Workshop Shortcut */}
        <div className="mt-3 max-w-md mx-auto bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 text-right">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <span className="text-[11px] font-black text-gray-800 dark:text-gray-100">
              🎁 موارد الصياغة الواقعية من الكاميرا:
            </span>
            {onOpenWorkshop && (
              <button
                type="button"
                onClick={onOpenWorkshop}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black flex items-center gap-1 shadow-xs"
              >
                <Hammer className="w-3 h-3" />
                <span>طاولة الصياغة والتطوير ⚒️</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {RESOURCE_ORDER.map((resKey) => {
              const meta = RESOURCE_CATALOG[resKey];
              return (
                <div
                  key={resKey}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-1.5 px-1 text-center"
                  title={`${meta.nameAr} (${meta.examplesAr})`}
                >
                  <div className="text-sm leading-none">{meta.emoji}</div>
                  <div className="text-[10px] font-black text-gray-700 dark:text-gray-200 tabular-nums mt-0.5">
                    ×{resources[resKey] || 0}
                  </div>
                </div>
              );
            })}
          </div>
          {hasEnchantedAura && (
            <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-purple-600/15 border border-purple-400/40 text-purple-800 dark:text-purple-200 text-[11px] font-extrabold text-center">
              ✨ هالة التطوير السحري مفعّلة: تحصل على 2x LangCoins و 2x نقاط مع كل مسح!
            </div>
          )}
        </div>

        {/* Kids Mission Banner */}
        {isKid && mission && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-100 via-rose-100 to-teal-100 text-gray-900 border border-amber-300 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3 text-left" dir="ltr">
              <Compass className="w-6 h-6 text-rose-600 animate-spin-slow" />
              <div>
                <h4 className="font-black text-base text-rose-900">{mission.title}</h4>
                <p className="text-xs text-gray-700">{mission.hint}</p>
              </div>
            </div>
            <button
              onClick={fetchNewMission}
              disabled={missionLoading}
              className="px-3 py-1.5 rounded-xl bg-white text-rose-600 font-bold text-xs shadow hover:bg-rose-50"
            >
              New Mission 🔄
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className={`px-6 py-3 rounded-2xl font-bold text-white shadow-lg flex items-center gap-2 transition-transform active:scale-95 ${
                isKid ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-[#2D6A4F] hover:bg-[#1b4332]'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>Open Live Camera</span>
            </button>
          ) : (
            <button
              onClick={capturePhoto}
              className="px-8 py-3 rounded-2xl font-bold bg-rose-600 text-white shadow-lg animate-bounce flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Capture Photo Now! 📸</span>
            </button>
          )}

          <label className="px-6 py-3 rounded-2xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 cursor-pointer shadow-sm flex items-center gap-2 transition-all">
            <Upload className="w-5 h-5" />
            <span>Upload Image</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Camera Viewport */}
        {cameraActive && (
          <div className="mt-6 relative rounded-3xl overflow-hidden shadow-2xl border-4 border-rose-500 max-w-md mx-auto bg-black">
            <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
            <button
              onClick={stopCamera}
              className="absolute top-3 left-3 bg-black/60 text-white p-2 rounded-full text-xs font-bold"
            >
              Close Camera
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-lg animate-pulse">
          <RefreshCw className="w-10 h-10 text-[#2D6A4F] animate-spin mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Gemini AI Vision is analyzing your image...</h3>
          <p className="text-xs text-gray-400 mt-1">Identifying exact objects and verifying treasure hunt mission</p>
        </div>
      )}

      {/* Kids Verification Result */}
      {isKid && verifyResult && !loading && (
        <div className={`rounded-3xl p-6 shadow-xl border mb-6 animate-fade-in ${
          verifyResult.success ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200' : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${verifyResult.success ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
              {verifyResult.success ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black mb-1">
                {verifyResult.success ? 'Mission Accomplished! 🎉' : 'Almost there! Try again!'}
              </h3>
              <p className="text-sm font-medium leading-relaxed" dir="ltr">
                {verifyResult.feedback}
              </p>
            </div>
          </div>
          {verifyResult.success && (
            <div className="mt-4 pt-4 border-t border-emerald-200 flex justify-between items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  <span>
                    +{lastApplied2x ? verifyResult.stars * 2 : verifyResult.stars} Stars Awarded!
                  </span>
                </span>
                {lastApplied2x && (
                  <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white text-[11px] font-black">
                    ✨ 2x هالة سحرية!
                  </span>
                )}
                {lastDrop && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs font-black">
                    🎁 مورد مستخرج: {RESOURCE_CATALOG[lastDrop.type].emoji} +{lastDrop.amount}{' '}
                    {RESOURCE_CATALOG[lastDrop.type].nameAr}
                  </span>
                )}
              </div>
              <button
                onClick={fetchNewMission}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow hover:bg-emerald-700"
              >
                Next Mission 🚀
              </button>
            </div>
          )}
        </div>
      )}

      {/* Adult Result Card */}
      {result && !loading && !isKid && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-emerald-100 dark:border-emerald-900 animate-fade-in flex flex-col md:flex-row gap-6 items-center">
          {previewImage && (
            <div className="w-full md:w-1/3 rounded-2xl overflow-hidden shadow-md h-48 border border-gray-200">
              <img src={previewImage} alt="Captured" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 w-full text-left" dir="ltr">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-[#2D6A4F] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>
                    +{lastApplied2x ? 30 : 15} XP · +{lastApplied2x ? 20 : 10} 🪙
                    {lastApplied2x ? ' (2x Aura!)' : ''}
                  </span>
                </span>
                {lastDrop && (
                  <span
                    className="text-xs font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1"
                    dir="rtl"
                  >
                    <span>
                      🎁 مورد: {RESOURCE_CATALOG[lastDrop.type].emoji} +{lastDrop.amount}{' '}
                      {RESOURCE_CATALOG[lastDrop.type].nameAr}
                    </span>
                  </span>
                )}
              </div>
              <button
                onClick={() => speakText(result.englishName)}
                className="flex items-center gap-1.5 bg-[#2D6A4F] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#1b4332] shadow"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen Pronunciation</span>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                  {result.englishName}
                </h3>
              </div>
              <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                /{result.phonetic}/
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl mb-3 border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-400 mb-1">Practical Sentence:</p>
              <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                "{result.sentence}"
              </p>
            </div>

            {result.funFact && (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-200 text-blue-900 dark:text-blue-200 text-xs">
                💡 <strong>Fun Fact: </strong> {result.funFact}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
