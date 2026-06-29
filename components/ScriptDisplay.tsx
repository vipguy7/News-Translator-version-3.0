import React, { useState } from 'react';
import { GroundingChunk, SEOData, ReportStatistic, ReportChartData } from '../types';
import { UI_STRINGS_MY } from '../constants';
import { 
  Copy, 
  Newspaper, 
  LayoutGrid, 
  Sparkles, 
  Bookmark, 
  Link as LinkIcon, 
  Check, 
  TrendingUp, 
  Tag 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const COLORS = ['#3bb2f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

interface ScriptDisplayProps {
  script: string | null;
  sources?: GroundingChunk[] | null;
  seoData?: SEOData[] | SEOData | null; // Support array or single object representation securely
  category?: string | null;
  wasServedFromCache?: boolean;
  statistics?: ReportStatistic[] | null;
  chartData?: ReportChartData[] | null;
  chartTitle?: string | null;
  chartType?: string | null;
}

const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ 
  script, 
  sources, 
  seoData, 
  category, 
  wasServedFromCache = false,
  statistics = null,
  chartData = null,
  chartTitle = null,
  chartType = null
}) => {
  const [activeLayout, setActiveLayout] = useState<'newspaper' | 'bento'>('newspaper');
  const [copied, setCopied] = useState<boolean>(false);

  if (!script) {
    return (
      <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-550 font-serif text-sm">
        {UI_STRINGS_MY.NO_SCRIPT_YET}
      </div>
    );
  }

  // Support varying representations of SEOData securely
  const singleSeoData: SEOData | null = seoData 
    ? (Array.isArray(seoData) ? seoData[0] : seoData) as SEOData
    : null;

  // Split script by the custom separator for additional details
  const scriptParts = script.split(/\n\n---\n/);
  const mainScriptContent = scriptParts[0];
  const additionalInfo = scriptParts.length > 1 ? scriptParts[1] : null;

  // Split content into clean logical paragraphs
  const paragraphs = mainScriptContent
    .split(/\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const cleanParagraphText = (text: string) => {
    return text
      .replace(/^(နိဒါန်း|အဓိက အကြောင်းအရာ|နိဂုံး|နိဂုံးနှင့် တိုက်တွန်းချက်|သတင်းခေါင်းစဉ်|နိဒါန်း \(Opening Hook\)|အဓိက အကြောင်းအရာ \(Narration Body\)|နိဂုံး \(Conclusion & Call-to-Action\)|Lead:|Body:|Conclusion:)\s*:\s*/i, '')
      .trim();
  };

  const getSectionHeader = (originalText: string, index: number, total: number) => {
    const lower = originalText.toLowerCase();
    
    // Explicit keyword matching
    if (lower.startsWith('နိဒါန်း') || lower.startsWith('lead') || lower.startsWith('intro')) {
      return 'နိဒါန်း (Lead Hook)';
    }
    if (lower.startsWith('နိဂုံး') || lower.startsWith('conclusion') || lower.startsWith('outro') || lower.startsWith('call-to-action')) {
      return 'နိဂုံးနှင့် တိုက်တွန်းချက် (Closing Summary)';
    }
    if (lower.startsWith('အဓိက') || lower.startsWith('body') || lower.startsWith('narration')) {
      return 'အဓိကသတင်းအချက်အလက် (Core Highlights)';
    }
    
    // Positional fallback defaults
    if (index === 0) return 'နိဒါန်း (Lead Hook)';
    if (index === total - 1 && total > 1) return 'နိဂုံးနှင့် နိဂုံးချုပ် (Concluding Take)';
    return `သတင်းအချက်အလက် အပိုင်း (${index + 1})`;
  };

  const handleCopy = () => {
    const stripFormat = (text: string) => {
      return text.replace(/^#+\s+/gm, '') // Remove Markdown headers
                 .replace(/\*\*/g, '')   // Remove bold
                 .replace(/\*/g, '')     // Remove italic/bullets
                 .replace(/^(နိဒါန်း|အဓိက အကြောင်းအရာ|နိဂုံး|နိဂုံးနှင့် တိုက်တွန်းချက်|သတင်းခေါင်းစဉ်|နိဒါန်း \(Opening Hook\)|အဓိက အကြောင်းအရာ \(Narration Body\)|နိဂုံး \(Conclusion & Call-to-Action\)):/gm, '')
                 .trim();
    };

    let textToCopy = singleSeoData ? `${singleSeoData.optimizedTitle}\n\n` : '';
    textToCopy += stripFormat(mainScriptContent || '');
    
    // Ensure we copy additional info if present
    if (additionalInfo) {
      textToCopy += `\n\n---\n${stripFormat(additionalInfo)}`;
    }

    if (singleSeoData) {
      textToCopy += `\n\n${UI_STRINGS_MY.SEO_TITLE_LABEL} ${singleSeoData.optimizedTitle}`;
      textToCopy += `\n${UI_STRINGS_MY.SEO_META_DESCRIPTION_LABEL} ${singleSeoData.metaDescription}`;
      textToCopy += `\n${UI_STRINGS_MY.SEO_HASHTAGS_LABEL} ${singleSeoData.hashtags.map(t => `#${t.replace(/^#/, '')}`).join(' ')}`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-2 space-y-6">
      
      {/* Dynamic Navigation Dashboard within results */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 mb-2 gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
            {UI_STRINGS_MY.GENERATED_SCRIPT_HEADING}
          </h2>
          <p className="text-xs text-slate-550 font-serif mt-1">အလိုအလျောက် ရေးသားပြင်ဆင်ထားသော သတင်းဆောင်းပါး</p>
        </div>

        {/* Layout Switcher & Actions Panel */}
        <div className="flex flex-wrap items-center gap-3">
          {wasServedFromCache && (
            <span className="text-[10px] font-sans bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/80 flex items-center gap-1">
              <span>🕒 Cached</span>
            </span>
          )}

          {/* Interactive Layout Tabs Block */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 shadow-inner">
            <button
              onClick={() => setActiveLayout('newspaper')}
              className={`px-3 py-1.5 rounded-md text-xs font-serif font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeLayout === 'newspaper'
                  ? 'bg-blue-600 text-white shadow font-bold'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>သတင်းစာပုံစံ</span>
            </button>
            <button
              onClick={() => setActiveLayout('bento')}
              className={`px-3 py-1.5 rounded-md text-xs font-serif font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeLayout === 'bento'
                  ? 'bg-blue-600 text-white shadow font-bold'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ကတ်ပြားပုံစံ</span>
            </button>
          </div>

          <button 
            onClick={handleCopy}
            className={`text-xs font-serif font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
              copied 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-550 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Side-by-Side Dynamic Section Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Hand: Article content block */}
        <div className="lg:col-span-8 space-y-6">
          {activeLayout === 'newspaper' ? (
            <div className="bg-[#FAF8F5] text-slate-900 border border-amber-200/60 shadow-md rounded-2xl p-6 sm:p-8 font-serif select-text">
              {/* Retro Editorial Header banner */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-6">
                <p className="text-[10px] tracking-widest font-sans font-bold text-slate-500 uppercase">MZM NEWS DISPATCH • MULTI-MODULE HUB</p>
                <div className="text-2xl sm:text-3xl font-black text-slate-950 font-serif my-1">မြန်မာသတင်းစာတိုဒီဂျစ်တယ်</div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-sans px-2 mt-2 border-t border-slate-200 pt-1.5">
                  <span>နေ့စဉ်ထုတ်သတင်း</span>
                  <span>နေပြည်တော် မေတ္တာ</span>
                </div>
              </div>

              {/* Title Header */}
              {singleSeoData?.optimizedTitle ? (
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 leading-snug tracking-tight mb-5 border-b border-dashed border-slate-300 pb-4">
                  {singleSeoData.optimizedTitle}
                </h3>
              ) : null}

              {/* Pure paragraphs rendered professionally */}
              <div className="space-y-4">
                {paragraphs.map((p, idx) => {
                  const cleaned = cleanParagraphText(p);
                  if (idx === 0) {
                    return (
                      <p key={idx} className="text-lg font-medium text-slate-900 leading-relaxed bg-blue-50 border-l-4 border-blue-600 pl-4 py-2 rounded-r">
                        {cleaned}
                      </p>
                    );
                  }
                  return (
                    <p key={idx} className="text-base text-slate-800 leading-relaxed text-justify">
                      {cleaned}
                    </p>
                  );
                })}
              </div>
            </div>
          ) : (
            // Card-Based Bento Segmentation View
            <div className="space-y-4">
              {paragraphs.map((p, idx) => {
                const cleaned = cleanParagraphText(p);
                const header = getSectionHeader(p, idx, paragraphs.length);
                
                let cardTheme = 'bg-white border-slate-200 hover:border-slate-350 hover:shadow-md';
                let accentBar = 'bg-slate-400';
                let tagStyle = 'text-slate-600 bg-slate-100';

                if (idx === 0) {
                  cardTheme = 'bg-blue-50/50 border-blue-200/80 hover:border-blue-300 hover:shadow-md';
                  accentBar = 'bg-blue-500';
                  tagStyle = 'text-blue-700 bg-blue-105/80';
                } else if (idx === paragraphs.length - 1 && paragraphs.length > 1) {
                  cardTheme = 'bg-emerald-50/50 border-emerald-200/80 hover:border-emerald-300 hover:shadow-md';
                  accentBar = 'bg-emerald-500';
                  tagStyle = 'text-emerald-700 bg-emerald-105/80';
                } else {
                  cardTheme = 'bg-stone-50/40 border-slate-200 hover:border-indigo-200 hover:shadow-md';
                  accentBar = 'bg-indigo-500';
                  tagStyle = 'text-indigo-700 bg-indigo-105/80';
                }

                return (
                  <div 
                    key={idx} 
                    className={`border rounded-xl md:rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${cardTheme}`}
                  >
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-inherit bg-slate-50/70">
                      <div className={`w-1.5 h-6 rounded-full ${accentBar}`} />
                      <h4 className="font-serif text-sm font-bold text-slate-850">
                        {header}
                      </h4>
                      <span className={`ml-auto text-[10px] uppercase font-sans font-semibold tracking-wider px-2.5 py-0.5 rounded-full ${tagStyle}`}>
                        PART {idx + 1}
                      </span>
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="font-serif text-slate-905 leading-relaxed text-base whitespace-pre-wrap">
                        {cleaned}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Subscript / Additional details generated implicitly */}
          {additionalInfo && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-serif whitespace-pre-wrap flex gap-3">
              <span className="text-slate-500">ℹ️</span>
              <div className="space-y-1">
                {additionalInfo.split('\n').map((line, index) => (
                  <p key={index} className="mb-0.5">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Hand: Interactive Meta and SEO Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Metrics Dashboard */}
          {category && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-serif font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  {UI_STRINGS_MY.CATEGORIZATION_LABEL}
                </span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold font-serif px-3 py-1 rounded-full border border-indigo-100">
                  {category}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] font-serif text-slate-650">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="block text-slate-500 uppercase tracking-widest text-[8px] mb-0.5">အက္ခရာစုစုပေါင်း</span>
                  <span className="font-sans font-semibold text-slate-800">{mainScriptContent.length} လုံး</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="block text-slate-500 uppercase tracking-widest text-[8px] mb-0.5">သတင်းပုံစံ</span>
                  <span className="font-sans font-semibold text-slate-800">Unicode ဥပဒေ</span>
                </div>
              </div>
            </div>
          )}

          {/* SEO Optimizations Meta Card */}
          {singleSeoData && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-150 pb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse shrink-0" />
                <h3 className="font-serif text-sm font-bold text-slate-800">SEO Optimizations</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-serif font-bold text-slate-500 uppercase tracking-wider">
                    {UI_STRINGS_MY.SEO_TITLE_LABEL}
                  </span>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl hover:border-slate-350 transition-colors">
                    <p className="text-xs text-slate-800 font-serif font-medium leading-normal">{singleSeoData.optimizedTitle}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-serif font-bold text-slate-500 uppercase tracking-wider">
                    {UI_STRINGS_MY.SEO_META_DESCRIPTION_LABEL}
                  </span>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl hover:border-slate-350 transition-colors">
                    <p className="text-[11px] text-slate-700 font-serif leading-relaxed italic">"{singleSeoData.metaDescription}"</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-serif font-bold text-slate-500 uppercase tracking-wider">
                    {UI_STRINGS_MY.SEO_HASHTAGS_LABEL}
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {singleSeoData.hashtags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors font-medium cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(`#${tag.replace(/^#/, '')}`);
                        }}
                        title="ကူးယူရန်"
                      >
                        #{tag.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Grounding Links collection */}
          {sources && sources.length > 0 && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-150 pb-3">
                <Bookmark className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="font-serif text-sm font-bold text-slate-800">{UI_STRINGS_MY.SOURCES_HEADING}</h3>
              </div>

              <ul className="space-y-3 font-serif text-xs">
                {sources.map((source, index) =>
                  source.web && source.web.uri ? (
                    <li key={index} className="flex items-start gap-2.5">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <a
                        href={source.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline break-all font-medium transition-colors"
                        title={source.web.title || source.web.uri}
                      >
                        {source.web.title || source.web.uri}
                      </a>
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          )}
        </div>

      </div>

      {/* Extracted Stats & Charts Block */}
      {((statistics && statistics.length > 0) || (chartData && chartData.length > 0)) && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 space-y-6 mt-6 animate-fade-in">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-2">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900 leading-tight">
                ဆန်းစစ်ချက် ကိန်းဂဏန်းများနှင့် ဇယားများ (Statistical Analysis & Diagrams)
              </h3>
              <p className="text-[11px] text-slate-500 font-serif mt-0.5">Gemini AI မှ အစီရင်ခံစာအပေါ် အခြေခံပြီး တိကျစွာ ခွဲခြမ်းဆန်းစစ်ထားသော အချက်ပြဇယား</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* List of Key stats */}
            {statistics && statistics.length > 0 && (
              <div className="lg:col-span-5 space-y-4">
                <h4 className="font-serif text-xs font-bold text-slate-700 tracking-wider uppercase">
                  📈 ကောက်နုတ်ချက် ကိန်းဂဏန်းများ (Key Metrics)
                </h4>
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {statistics.map((stat, i) => (
                    <div key={i} className="p-3.5 bg-[#FAF8F5] border border-amber-200/50 rounded-xl hover:border-amber-350 hover:shadow-xs transition-all space-y-1">
                      <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-205 pb-1.5">
                        <span className="font-serif text-xs font-bold text-slate-800 leading-normal">{stat.metric}</span>
                        <span className="font-mono text-xs font-black text-blue-600 bg-blue-50/80 px-2.5 py-0.5 rounded-md border border-blue-105 shrink-0 select-all">{stat.value}</span>
                      </div>
                      <p className="font-serif text-[11px] text-slate-600 leading-relaxed pt-1 select-text">{stat.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recharts Graphical Chart */}
            {chartData && chartData.length > 0 && (
              <div className={`${statistics && statistics.length > 0 ? "lg:col-span-7" : "lg:col-span-12"} space-y-4`}>
                <h4 className="font-serif text-xs font-bold text-slate-705 tracking-wider uppercase">
                  📊 အချက်အလက်ပြဇယား: {chartTitle || "အစီရင်ခံစာ ကိန်းဂဏန်းများ (Visual Chart)"}
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <div className="w-full h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'line' ? (
                        <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontFamily: 'serif' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'serif' }} />
                          <Line type="monotone" dataKey="value" name="Value" stroke="#2563eb" strokeWidth={2.5} activeDot={{ r: 7 }} />
                        </LineChart>
                      ) : chartType === 'pie' ? (
                        <PieChart>
                          <Pie 
                            data={chartData} 
                            cx="50%" 
                            cy="50%" 
                            labelLine={true}
                            label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={95} 
                            fill="#3b82f6" 
                            dataKey="value"
                            nameKey="label"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontFamily: 'serif' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'serif' }} />
                        </PieChart>
                      ) : (
                        <BarChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontFamily: 'serif' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'serif' }} />
                          <Bar dataKey="value" name="Value" fill="#2563eb" radius={[5, 5, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ScriptDisplay;
