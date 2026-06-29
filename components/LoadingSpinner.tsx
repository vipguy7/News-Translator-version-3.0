import React, { useState, useEffect } from 'react';
import { UI_STRINGS_MY } from '../constants';

export type LoadingMode = 'auth' | 'generate' | 'keywords' | 'proofread';

interface LoadingSpinnerProps {
  mode?: LoadingMode;
}

interface LoadingStage {
  minSeconds: number;
  text: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ mode = 'generate' }) => {
  const [seconds, setSeconds] = useState<number>(0);
  const [progress, setProgress] = useState<number>(5);

  // Define stage wordings based on loading mode
  const stages: Record<LoadingMode, LoadingStage[]> = {
    auth: [
      { minSeconds: 0, text: 'လုံခြုံရေးစနစ် စစ်ဆေးနေသည်...' },
      { minSeconds: 3, text: 'အသုံးပြုသူ ပရိုဖိုင်ကို ရယူနေပါသည်...' },
      { minSeconds: 6, text: 'သတင်းလုပ်ငန်းစဉ်များ စတင်ပြင်ဆင်နေ...' }
    ],
    generate: [
      { minSeconds: 0, text: 'တင်သွင်းထားသော အချက်အလက်များကို အသေးစိတ် ဆန်းစစ်နေ...' },
      { minSeconds: 3.5, text: 'သတင်းခေါင်းစဉ်နှင့် သတင်းရေးမည့်ပုံစံကို စတင်ပြင်ဆင်...' },
      { minSeconds: 7.5, text: 'သတ်မှတ်ထားသော သတင်းအရေးအသားပုံစံဖြင့် စာပိုဒ်များရေးသားနေ...' },
      { minSeconds: 12, text: 'သတင်းအချက်အလက် တိကျမှန်ကန်မှုနှင့် စာလုံးပေါင်းသတ်ပုံများကို ပြန်လည်စိစစ်နေ...' }
    ],
    keywords: [
      { minSeconds: 0, text: 'ရေးသားပြီးသော သတင်းစာမူတစ်ခုလုံးကိုပြန်လည်စစ်ဆေးနေ...' },
      { minSeconds: 3, text: 'အဓိကကျသော အရေးကြီးစကားလုံးများနှင့် အကြောင်းအရာများကို ကောက်နုတ်တင်ပြရန် ပြင်ဆင်နေ...' },
      { minSeconds: 6, text: 'SEO Tagsနှင့် hashtags များရွေးထုတ်နေ...'}
    ],
    proofread: [
      { minSeconds: 0, text: 'မြန်မာစာလုံးပေါင်းသတ်ပုံ စံညွှန်းစနစ်ကို အသုံးပြုပြီး တစ်လုံးချင်း ဖတ်ရှုစစ်ဆေးနေပါသည်...' },
      { minSeconds: 4, text: 'မြန်မာဝါကျအဆင်အပြင်၊ ဝေါဟာရနှင့် သဒ္ဒါကျောရိုး အမှားများကို နှိုင်းယှဉ်စိစစ်နေပါသည်...' },
      { minSeconds: 8, text: 'မူရင်းစာမူနှင့် ပြင်ဆင်ပြီးစာမူအကြား နှိုင်းယှဉ်ချက် (Diff Visualization) ကို ပြင်ဆင်နေပါသည်...' }
    ]
  };

  const currentStages = stages[mode] || stages['generate'];

  // Determine current active stage index and text
  const activeIndex = currentStages.reduce((acc, stage, idx) => {
    if (seconds >= stage.minSeconds) {
      return idx;
    }
    return acc;
  }, 0);

  const currentStageText = currentStages[activeIndex].text;

  useEffect(() => {
    // Timer to track elapsed seconds
    const timer = setInterval(() => {
      setSeconds(prev => prev + 0.5);
    }, 500);

    // Dynamic progress bar simulation hook (reaches up to 98% smoothly)
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return 98;
        
        // Define max progress bounds depending on current elapsed time to make the progress feel native
        let limit = 98;
        if (seconds < 3) limit = 35;
        else if (seconds < 7) limit = 65;
        else if (seconds < 11) limit = 88;

        if (prev < limit) {
          const increment = Math.floor(Math.random() * 3) + 1; // 1% to 3%
          return Math.min(prev + increment, limit);
        }
        return prev;
      });
    }, 400);

    return () => {
      clearInterval(timer);
      clearInterval(progressTimer);
    };
  }, [seconds]);

  return (
    <div className="flex flex-col justify-center items-center my-12 p-6 sm:p-8 bg-sky-50/40 border border-sky-100 rounded-2xl max-w-xl mx-auto space-y-6 shadow-sm animate-fade-in" aria-label={UI_STRINGS_MY.LOADING} role="status">
      
      {/* Subtle, Slower 3-Dot Fluid Wave Animation */}
      <div className="flex space-x-3 items-center justify-center h-8">
        <div className="w-3.5 h-3.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full shadow-md shadow-blue-200/50 animate-fluid-bounce-1"></div>
        <div className="w-3.5 h-3.5 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-full shadow-md shadow-indigo-200/50 animate-fluid-bounce-2"></div>
        <div className="w-3.5 h-3.5 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-full shadow-md shadow-blue-200/50 animate-fluid-bounce-3"></div>
      </div>

      {/* Progress indicators */}
      <div className="w-full space-y-4">
        {/* Stage text and percent label */}
        <div className="flex justify-between items-end gap-3 px-1">
          <p className="text-xs sm:text-sm text-slate-800 font-serif font-semibold text-left flex-1 min-h-[30px] flex items-center leading-relaxed">
            {currentStageText}
          </p>
          <span className="text-xs sm:text-sm font-mono font-bold text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100">
            {progress}%
          </span>
        </div>

        {/* Custom Progress Bar container */}
        <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden shadow-inner border border-slate-200">
          <div 
            className="bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Detailed visual checklist showing complete, active, and pending stages */}
        <div className="pt-4 border-t border-sky-100 space-y-2.5 text-left font-serif text-xs px-1">
          {currentStages.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;
            return (
              <div 
                key={idx} 
                className={`flex items-start space-x-3 transition-colors duration-500 ${
                  isCompleted ? 'text-emerald-600' : isActive ? 'text-blue-600 font-semibold animate-pulse-slow' : 'text-slate-400'
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border text-[10px] mt-0.5 ${
                  isCompleted 
                    ? 'bg-emerald-50 border-emerald-300 font-bold' 
                    : isActive 
                      ? 'bg-blue-50 border-blue-300 font-bold' 
                      : 'bg-slate-50 border-slate-200'
                }`}>
                  {isCompleted ? '✓' : isActive ? '●' : '○'}
                </div>
                <span className="leading-tight">{stage.text}</span>
              </div>
            );
          })}
        </div>

        <p className="text-[10.5px] text-slate-400 italic text-center font-serif pt-1 select-none">
          💡 အပြည့်အစုံဆောင်ရွက်ပြီးစီးသည်အထိ ခေတ္တခဏ စောင့်ဆိုင်းပေးပါ...
        </p>
      </div>

      {/* Embedded Fluid Wave Animation styles */}
      <style>
        {`
          @keyframes fluid-bounce {
            0%, 100% {
              transform: translateY(0) scale(0.9);
              opacity: 0.5;
              filter: blur(0.1px);
            }
            50% {
              transform: translateY(-5px) scale(1.05);
              opacity: 1;
              filter: blur(0);
            }
          }
          .animate-fluid-bounce-1 {
            animation: fluid-bounce 2.2s infinite cubic-bezier(0.4, 0, 0.2, 1) 0s;
          }
          .animate-fluid-bounce-2 {
            animation: fluid-bounce 2.2s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.35s;
          }
          .animate-fluid-bounce-3 {
            animation: fluid-bounce 2.2s infinite cubic-bezier(0.4, 0, 0.2, 1) 0.7s;
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;
