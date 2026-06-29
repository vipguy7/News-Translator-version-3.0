
import React from 'react';

interface ErrorMessageProps {
  message: string | null;
  onOpenSettings?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onOpenSettings }) => {
  if (!message) return null;

  const isQuotaError = 
    message.toLowerCase().includes('quota') ||
    message.toLowerCase().includes('limit') ||
    message.toLowerCase().includes('429') ||
    message.toLowerCase().includes('exhausted') ||
    message.toLowerCase().includes('rate_limit') ||
    message.toLowerCase().includes('resource_exhausted');

  return (
    <div className="bg-red-50 border-l-4 border-red-500 text-slate-800 p-5 my-5 rounded-2xl shadow-sm border border-red-200 animate-fade-in" role="alert">
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5">⚠️</span>
        <div className="space-y-1.5 flex-1">
          <p className="font-bold font-serif text-red-800 text-sm">
            {isQuotaError ? "လက်ရှိအခမဲ့အကြိမ်ရေ (သို့) API Quota ကန့်သတ်ချက် ပြည့်သွားပါသည်" : "လုပ်ဆောင်ချက် အမှားအယွင်းရှိပါသည်"}
          </p>
          <p className="font-serif text-xs text-slate-650 leading-relaxed break-words max-h-40 overflow-y-auto pr-1 select-text">
            {message}
          </p>
          
          {isQuotaError && (
            <div className="mt-3.5 p-3.5 bg-orange-50 border border-orange-200 rounded-xl space-y-2.5 font-serif text-xs text-amber-900 leading-relaxed">
              <p>
                <strong>💡 ဖြေရှင်းရန် နည်းလမ်းများ (Instructions to solve):</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>၁ မိနစ်ခန့်စောင့်ဆိုင်းပါ-</strong> Standard အခမဲ့ API Limit သည် တစ်မိနစ်လျှင် ပြန်လည်သက်တမ်းတိုးပေးသည့်အတွက် ခေတ္တစောင့်ပြီး ထပ်မံလုပ်ဆောင်နိုင်ပါသည်။ (Wait 1 minute for the free-tier API quota window to reset, then try running it again).
                </li>
                <li>
                  <strong>ကိုယ်ပိုင် API Key ထည့်သွင်းအသုံးပြုပါ-</strong> အကန့်အသတ်မရှိ မြန်ဆန်စွာ အသုံးပြုနိုင်ရန်အတွက် သင်၏ကိုယ်ပိုင် <strong>Google AI Studio API Key</strong> ကို Settings တွင် အလွယ်တကူ ထည့်သွင်းနိုင်ပါသည်။
                </li>
              </ul>
              {onOpenSettings && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="cursor-pointer inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-xs transition-transform active:scale-95"
                  >
                    ⚙️ ကိုယ်ပိုင် API Key သတ်မှတ်ရန် Settings သို့သွားမည်
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
