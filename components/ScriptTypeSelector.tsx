
import React from 'react';
import { ScriptType } from '../types';
import { UI_STRINGS_MY } from '../constants';
import { Newspaper, Zap, AlertCircle, FileText, HelpCircle, FileCheck, Award } from 'lucide-react';

interface ScriptTypeSelectorProps {
  selectedType: ScriptType;
  onTypeChange: (type: ScriptType) => void;
}

const ScriptTypeSelector: React.FC<ScriptTypeSelectorProps> = ({ selectedType, onTypeChange }) => {
  const typeOptions = [
    { 
      value: ScriptType.BREAKING_NEWS, 
      label: "မြေပြင်သတင်းဦး (Spot / Breaking News)", 
      desc: "ဖြစ်ပွားဆဲ ပူပူနွေးနွေး ဖြစ်ရပ်များကို ချက်ချင်းလက်ငင်း ဦးစားပေးထုတ်လွှင့်ရန်ပုံစံ",
      icon: Zap,
      color: "text-amber-500 bg-amber-50 border-amber-200"
    },
    { 
      value: ScriptType.NEWS_ARTICLE, 
      label: "သတင်းဆောင်းပါး (News Feature / Article)", 
      desc: "နောက်ခံအကြောင်းခြင်းရာများနှင့် အချက်အလက်များ ပြည့်ပြည့်စုံစုံ ပါဝင်သော ဆောင်းပါးရှည်",
      icon: Newspaper,
      color: "text-blue-500 bg-blue-50 border-blue-200"
    },
    { 
      value: ScriptType.EDITORIAL, 
      label: "အယ်ဒီတာ့အာဘော် (Editorial / Opinion)", 
      desc: "သတင်းဌာန၏ တရားဝင် စီးဆင်းမှု၊ ကိုယ်စားပြု သဘောထားနှင့် သုံးသပ်ဝေဖန်ချက်",
      icon: Award,
      color: "text-purple-500 bg-purple-50 border-purple-200"
    },
    { 
      value: ScriptType.INVESTIGATIVE, 
      label: "စုံစမ်းစစ်ဆေးမှုသတင်း (Investigative Report)", 
      desc: "မြေပြင်အဖြစ်မှန်၊ စာရွက်စာတမ်းများနှင့် အခိုင်အမာသက်သေများဖြင့် နက်ရှိုင်းစွာ ဖော်ထုတ်ခြင်း",
      icon: AlertCircle,
      color: "text-red-500 bg-red-50 border-red-200"
    },
    { 
      value: ScriptType.INTERVIEW, 
      label: "အင်တာဗျူး သတင်း (Interview Feature)", 
      desc: "ကာယကံရှင်များ၏ တိုက်ရိုက်ပြောစကား၊ မေးမြန်းချက်များနှင့် အာဘော်များ အမေးအဖြေပြုစုပုံစံ",
      icon: HelpCircle,
      color: "text-emerald-500 bg-emerald-50 border-emerald-200"
    },
    { 
      value: ScriptType.PRESS_RELEASE, 
      label: "သတင်းထုတ်ပြန်ချက် (Press Release)", 
      desc: "အဖွဲ့အစည်းများ၏ သတင်းထုတ်ပြန်ချက်နှင့် တရားဝင်သဘောထား ထုတ်လွှင့်မှုပုံစံ",
      icon: FileCheck,
      color: "text-sky-500 bg-sky-50 border-sky-200"
    },
  ];

  return (
    <div className="pt-5 border-t border-slate-300 mt-5">
      <label className="block text-sm font-bold text-slate-800 mb-3 font-serif flex items-center gap-1.5">
        <Newspaper className="w-4 h-4 text-slate-600" />
        {UI_STRINGS_MY.SCRIPT_TYPE_LABEL}
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {typeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onTypeChange(option.value)}
              className={`flex items-start text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 
                ${isSelected 
                  ? 'bg-blue-50/40 border-blue-500 shadow-sm ring-1 ring-blue-500/20' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }
              `}
            >
              <div className={`p-2 rounded-lg mr-3 snap-none border ${option.color} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 font-serif leading-tight">
                  {option.label}
                </p>
                <p className="text-[10px] text-slate-500 font-serif leading-normal">
                  {option.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(ScriptTypeSelector);