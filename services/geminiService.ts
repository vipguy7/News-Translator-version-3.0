

import { 
    SYSTEM_INSTRUCTION_TRANSLATOR_EN_TO_MY,
    SYSTEM_INSTRUCTION_TRANSLATOR_MY_TO_EN,
    SYSTEM_INSTRUCTION_AUTO_TRANSLATOR,
    SYSTEM_INSTRUCTION_SCRIPT_WRITER_BURMESE,
    SYSTEM_INSTRUCTION_SCRIPT_WRITER_ENGLISH,
    SYSTEM_INSTRUCTION_REPORT_WRITER,
    LANGUAGE_BURMESE, 
    LANGUAGE_ENGLISH,
    UI_STRINGS_MY
} from '../constants'; 
import { GeneratedScriptResponse, ScriptLength, ScriptTone, ScriptType } from '../types';
import { generateCacheKey, getFromCache, setInCache } from './cacheService';

let activeCustomApiKey: string | undefined = undefined;

export const setCustomApiKeyForGemini = (key?: string) => {
  activeCustomApiKey = key;
};

export const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (activeCustomApiKey && activeCustomApiKey.trim()) {
    headers['X-Custom-Gemini-Key'] = activeCustomApiKey.trim();
  }
  return headers;
};

const getScriptLengthInstruction = (scriptLength: ScriptLength): string => {
  switch (scriptLength) {
    case ScriptLength.ONE_MINUTE:
      return `The script should be concise, suitable for a 1-minute news broadcast (approximately 150-180 words).`;
    case ScriptLength.FIVE_MINUTES:
      return `The script should be detailed, suitable for a 5-minute news broadcast (approximately 750-900 words).`;
    case ScriptLength.LONG_ARTICLE:
      return `The script should be an in-depth long-form news article or feature story (minimum 1200 words). Provide detailed context, background, and expert analysis where the input information allows.`;
    case ScriptLength.STANDARD:
    default:
      return `The script length should be standard for a typical news report.`;
  }
};

const getScriptToneInstruction = (scriptTone: ScriptTone): string => {
  switch (scriptTone) {
    case ScriptTone.FORMAL:
      return `The narration tone of the script should be formal and objective.`;
    case ScriptTone.FRIENDLY:
      return `The narration tone of the script should be friendly and engaging.`;
    case ScriptTone.URGENT:
      return `The narration tone of the script should be urgent and impactful.`;
    case ScriptTone.INVESTIGATIVE:
      return `The narration tone of the script should be investigative and insightful.`;
    default:
      return `The narration tone of the script should be realistic and suitable for general news reporting.`;
  }
};

const getScriptTypeInstruction = (scriptType: ScriptType): string => {
  switch (scriptType) {
    case ScriptType.BREAKING_NEWS:
      return `The script is intended as Spot/Breaking News (မြေပြင်သတင်းဦး). Your role is to write with extreme immediacy and impact.
1. Highlight the most crucial active event in the very first sentence.
2. Keep sentences short, active, and punchy.
3. Include known casualties, location, source validation, and current ongoing active relief or security updates.
4. Do NOT use markdown symbols (*, #). Just provide flowing, immediate paragraphs separated by double line breaks.`;
    
    case ScriptType.NEWS_ARTICLE:
      return `The script is intended as a News Feature or Article (သတင်းဆောင်းပါး). Your role is to write a well-rounded narrative in inverted pyramid format.
1. Start with an engaging lead outlining WHO, WHAT, WHEN, WHERE, and WHY.
2. Provide background context, key quotes, or developments in succeeding paragraphs.
3. Flow naturally with zero internal structural headers. Use double line breaks between paragraphs.`;

    case ScriptType.EDITORIAL:
      return `The script is intended as an Editorial/Opinion column (အယ်ဒီတာ့အာဘော်). Your role is to act as the chief editor, delivering an analytical or stance-driven commentary on current events.
1. Identify the core societal or political issue early on.
2. Formulate a reasoned perspective, balancing empirical critique with constructive alternative approaches.
3. Write with high-level editorial authority, intellectual vocabulary, and professional poise.`;

    case ScriptType.INVESTIGATIVE:
      return `The script is intended as an Investigative Report (စုံစမ်းစစ်ဆေးမှု သတင်း). Your role is to build a deeply detailed, evidence-backed journalistic investigation.
1. Put key evidence, public records, or local witness accounts at the center.
2. Detail underlying systemic failures, connections, or discrepancies.
3. Use objective, forensic vocabulary to analyze claims. Maintain strict factual accuracy.`;

    case ScriptType.INTERVIEW:
      return `The script is intended as an Interview Feature (အင်တာဗျူး သတင်း). Your role is to structure responses into a highly coherent, professional narrative.
1. Introduce the speaker/interviewee and their expertise or relevance.
2. Synthesize critical quotes and dialogue interactions to preserve voice and professional intent.
3. Maintain fluid narrative pacing, framing their stances objectively.`;

    case ScriptType.PRESS_RELEASE:
      return `The script is intended as a formal Press Release (သတင်းထုတ်ပြန်ချက်). Your role is to act as a public relations professional or press officer.
1. Start with a clear headline.
2. Include a dateline (e.g., "[CITY, NATION] — [Date]").
3. Present strong official announcements, objectives, and boilerplate media references. Use double line breaks between paragraphs.`;

    default:
      return `The script should be formatted as a professional and readable news article in ${LANGUAGE_BURMESE}. Provide a concise and compelling headline first, followed by the article content in a professional narrative flow without using explicit labels. Use double line breaks between paragraphs. Do NOT use Markdown formatting (* or #).`;
  }
};

const fetchAndCleanUrlContent = async (url: string): Promise<string> => {
    const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || UI_STRINGS_MY.ERROR_URL_FETCH_CLEAN);
    }
    const data = await response.json();
    return (data.title ? data.title + "\n\n" : "") + data.content;
};

const generateScriptInternal = async (
  prompt: string,
  useSearchGrounding: boolean = false,
  systemInstruction: string = SYSTEM_INSTRUCTION_SCRIPT_WRITER_BURMESE,
): Promise<GeneratedScriptResponse> => {
  const cachePayload = { prompt, useSearchGrounding, systemInstruction };
  const cacheKey = await generateCacheKey(cachePayload);
  const cached = getFromCache<GeneratedScriptResponse>(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const response = await fetch('/api/generate-script', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, useSearchGrounding, systemInstruction })
  });
  
  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || UI_STRINGS_MY.ERROR_GENERATING_SCRIPT);
  }

  const result = await response.json();
  setInCache(cacheKey, result);
  return result;
};

export const generateScriptFromFileContent = async (
  fileText: string, 
  scriptLength: ScriptLength,
  scriptTone: ScriptTone,
  scriptType: ScriptType
): Promise<GeneratedScriptResponse> => {
  const lengthInstruction = getScriptLengthInstruction(scriptLength);
  const toneInstruction = getScriptToneInstruction(scriptTone);
  const typeInstruction = getScriptTypeInstruction(scriptType);
  const prompt = `You are tasked with transforming raw text content extracted from a user-uploaded document (which may contain messy line break patterns, tables, transcripts, or unformatted notes) into a professional, highly readable news script.
Analyze the extracted text, filter out irrelevant file scaffolding (such as page numbers, file metadata, or system headers), and identify the central newsworthy topic.
Based *only* on the provided information, generate a beautifully crafted news story in ${LANGUAGE_BURMESE}.

User Extracted File Content:
\"\"\"
${fileText}
\"\"\"

Directives:
1. ${lengthInstruction}
2. ${toneInstruction}
3. ${typeInstruction}
4. Reorganize any disjointed raw details into a standard journalistic pyramid (most critical hook first, followed by key evidence, quotes, and background).
5. Translate tables or raw lists into fully cohesive, fluid literary Burmese prose.
6. Absolutely forbid inventing or hallucinating any facts, names, dates, or numbers not present in the source text.
7. Focus onproducing a polished title and clean paragraphs with double line-breaks.`;
  return generateScriptInternal(prompt, false, SYSTEM_INSTRUCTION_SCRIPT_WRITER_BURMESE);
};

export const generateScriptFromUrl = async (
  url: string, 
  scriptLength: ScriptLength,
  scriptTone: ScriptTone,
  scriptType: ScriptType
): Promise<GeneratedScriptResponse> => {
  const fetchedContent = await fetchAndCleanUrlContent(url);
  const lengthInstruction = getScriptLengthInstruction(scriptLength);
  const toneInstruction = getScriptToneInstruction(scriptTone);
  const typeInstruction = getScriptTypeInstruction(scriptType);
  const prompt = `The following text was extracted from the URL: ${url}. Based *only* on this information, generate a professional news script in ${LANGUAGE_BURMESE}.
${lengthInstruction} ${toneInstruction} ${typeInstruction}
The script must strictly summarize the provided text and not introduce any new facts.
Focus on producing the news script body and titles with Burmese native writing style.

Extracted Content:
"""
${fetchedContent}
"""`;
  return generateScriptInternal(prompt, false, SYSTEM_INSTRUCTION_SCRIPT_WRITER_BURMESE);
};

export const generateScriptFromReport = async (
  reportText: string,
  scriptLength: ScriptLength,
  scriptTone: ScriptTone,
  scriptType: ScriptType,
  targetLanguage: 'Burmese' | 'English' = 'Burmese'
): Promise<GeneratedScriptResponse> => {
  const lengthInstruction = getScriptLengthInstruction(scriptLength);
  const toneInstruction = getScriptToneInstruction(scriptTone);
  const typeInstruction = getScriptTypeInstruction(scriptType);

  const systemInstruction = targetLanguage === 'English'
    ? `You are an elite senior editor for esteemed international news agencies covering Myanmar (such as Reuters, BBC News, and AP). Your core competency is examining dense organizational data, research papers, human rights briefings, and UN publications, and translating them into clear, compelling, objective, and premium news copy in English.
Always format into logical paragraph structures separated by double line-breaks. Adopt a formal, balanced broadcast or print journalistic tone. Strictly avoid any Markdown tags (such as **, *, or # for headings) or text labels like 'Lead:', 'Body:', 'Conclusion:', or 'Headline:'.`
    : SYSTEM_INSTRUCTION_REPORT_WRITER;

  const prompt = `The following is an official news report, census data, research journal, UN report, human rights briefing, or institutional press release.
Based on this raw content, generate an elite, premium news story written cleanly in ${targetLanguage === 'English' ? 'English' : LANGUAGE_BURMESE}.

User Report/Document Text:
\"\"\"
${reportText}
\"\"\"

Instructions and Style Guides:
1. ${lengthInstruction}
2. ${toneInstruction}
3. ${typeInstruction}
4. Write a compelling, objective title at the start of the script.
5. Identify the source institution (UNHCR, WHO, UNOCHA, etc.) in the lead.
6. Extract key metrics, rates, comparisons, or dates to represent in the 'statistics' and 'chartData' JSON structures. Translate any chart labels or titles to the output language (${targetLanguage === 'English' ? 'English' : LANGUAGE_BURMESE}).
7. Maintain absolute, uncompromising factual conformity with the original document. Do not extrapolate, assume, or insert external facts.`;

  const cachePayload = { prompt, purpose: 'report-news-v2', targetLanguage, scriptLength, scriptTone, scriptType };
  const cacheKey = await generateCacheKey(cachePayload);
  const cached = getFromCache<GeneratedScriptResponse>(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const response = await fetch('/api/generate-report-news', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, systemInstruction })
  });
  
  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || UI_STRINGS_MY.ERROR_GENERATING_SCRIPT);
  }

  const result = await response.json();
  setInCache(cacheKey, result);
  return result;
};

const translateToBurmese = async (englishText: string): Promise<string> => {
    const response = await fetch('/api/translate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text: englishText, systemInstruction: SYSTEM_INSTRUCTION_TRANSLATOR_EN_TO_MY })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || UI_STRINGS_MY.ERROR_TRANSLATING_CONTENT);
    }
    const data = await response.json();
    return data.translatedText;
};

const translateToEnglish = async (burmeseText: string): Promise<string> => {
    const response = await fetch('/api/translate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text: burmeseText, systemInstruction: SYSTEM_INSTRUCTION_TRANSLATOR_MY_TO_EN })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || UI_STRINGS_MY.ERROR_TRANSLATING_CONTENT);
    }
    const data = await response.json();
    return data.translatedText;
};

export const translatePastedText = async (text: string): Promise<GeneratedScriptResponse> => {
    const response = await fetch('/api/translate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text, systemInstruction: SYSTEM_INSTRUCTION_AUTO_TRANSLATOR })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || UI_STRINGS_MY.ERROR_TRANSLATING_CONTENT);
    }
    const data = await response.json();
    return { script: data.translatedText };
};


export const extractKeywords = async (scriptText: string): Promise<string[]> => {
  const prompt = `Based on the following news script in ${LANGUAGE_BURMESE}, generate exactly 3 relevant keywords in ${LANGUAGE_BURMESE}. List only the keywords, separated by commas.

News Script:
"""
${scriptText}
"""

Keywords:`;
  
  const response = await fetch('/api/generate-script', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, systemInstruction: `You are an AI assistant that extracts relevant keywords from text. Respond only with the keywords.` })
  });
  
  if (!response.ok) return [];
  const data = await response.json();
  const keywordsText = data.script;
  if (!keywordsText) return [];
  return keywordsText.split(',').map((kw: string) => kw.trim()).filter((kw: string) => kw.length > 0).slice(0, 3);
}

export const performEnToMyTranslationAndScriptGeneration = async (
  englishUrl: string,
  scriptLength: ScriptLength,
  scriptTone: ScriptTone,
  scriptType: ScriptType
): Promise<GeneratedScriptResponse> => {
  const fetchedEnglishContent = await fetchAndCleanUrlContent(englishUrl);
  const translatedContent = await translateToBurmese(fetchedEnglishContent);

  const lengthInstruction = getScriptLengthInstruction(scriptLength);
  const toneInstruction = getScriptToneInstruction(scriptTone);
  const typeInstruction = getScriptTypeInstruction(scriptType);

  const promptForScript = `The following ${LANGUAGE_BURMESE} text is a translation from an English news source. Based *only* on this translated information, **restructure and format it into a professional news script** in ${LANGUAGE_BURMESE}.
${lengthInstruction} ${toneInstruction} ${typeInstruction}
The script must strictly summarize and adapt the provided translated text into a news format. Do not invent new facts.
Focus on producing the news script body and titles with a professional Burmese news writing style.

Translated ${LANGUAGE_BURMESE} Content:
"""
${translatedContent}
"""`;

  const scriptResponse = await generateScriptInternal(promptForScript, false, SYSTEM_INSTRUCTION_SCRIPT_WRITER_BURMESE);
  
  let finalScriptText = scriptResponse.script;
  let mediaName = "Unknown Source";
  try {
      const urlObj = new URL(englishUrl);
      mediaName = urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
      console.warn("Could not parse English URL for media name:", englishUrl);
  }
  
  const keywords = await extractKeywords(scriptResponse.script.substring(0, 1500)); 

  const additionalInfo = [
    `${UI_STRINGS_MY.ORIGINAL_SOURCE_LABEL}: ${mediaName}`,
    ...(keywords.length > 0 ? [`${UI_STRINGS_MY.KEYWORDS_LABEL}: ${keywords.join(', ')}`] : [])
  ];
  
  finalScriptText += `\n\n---\n${additionalInfo.join('\n')}`;

  return {
    script: finalScriptText,
    intermediateTranslation: translatedContent,
    sources: scriptResponse.sources,
    fromCache: scriptResponse.fromCache,
  };
};

export const performMyToEnTranslationAndScriptGeneration = async (
  burmeseUrl: string,
  scriptLength: ScriptLength,
  scriptTone: ScriptTone,
  scriptType: ScriptType 
): Promise<GeneratedScriptResponse> => {
  const fetchedBurmeseContent = await fetchAndCleanUrlContent(burmeseUrl);
  const translatedContent = await translateToEnglish(fetchedBurmeseContent);

  const lengthInstruction = getScriptLengthInstruction(scriptLength);
  const toneInstruction = getScriptToneInstruction(scriptTone);
  
  const promptForScript = `The following ${LANGUAGE_ENGLISH} text is a translation from a Burmese news source. Based *only* on this translated information, **restructure and format it into a professional news script** in ${LANGUAGE_ENGLISH}.
${lengthInstruction} ${toneInstruction}
The script must strictly summarize and adapt the provided translated text into a news format. Do not invent new facts.

Translated ${LANGUAGE_ENGLISH} Content:
"""
${translatedContent}
"""`;

  const scriptResponse = await generateScriptInternal(promptForScript, false, SYSTEM_INSTRUCTION_SCRIPT_WRITER_ENGLISH);
  
  let finalScriptText = scriptResponse.script;
  let mediaName = "Unknown Source";
  try {
      const urlObj = new URL(burmeseUrl);
      mediaName = urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
      console.warn("Could not parse Burmese URL for media name:", burmeseUrl);
  }
  
  const additionalInfo = `Original Source: ${mediaName}`;
  finalScriptText += `\n\n---\n${additionalInfo}`;

  return {
    script: finalScriptText,
    intermediateTranslation: translatedContent,
    fromCache: scriptResponse.fromCache,
  };
};


export const proofreadScript = async (originalScript: string): Promise<string> => { 
  const cachePayload = { originalScript, purpose: 'proofread' };
  const cacheKey = await generateCacheKey(cachePayload);
  const cached = getFromCache<string>(cacheKey);
  if (cached) {
      return cached;
  }

  const response = await fetch('/api/proofread', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ script: originalScript })
  });

  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || UI_STRINGS_MY.ERROR_PROOFREADING_SCRIPT);
  }

  const data = await response.json();
  setInCache(cacheKey, data.editedScript);
  return data.editedScript;
};

export const generateSEOMetadata = async (scriptText: string): Promise<GeneratedScriptResponse['seoData']> => {
  const cachePayload = { scriptText, purpose: 'seo' };
  const cacheKey = await generateCacheKey(cachePayload);
  const cached = getFromCache<GeneratedScriptResponse['seoData']>(cacheKey);
  if (cached) {
      return cached;
  }

  const response = await fetch('/api/generate-seo', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ script: scriptText })
  });

  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "SEO generation failed");
  }

  const data = await response.json();
  setInCache(cacheKey, data.seoData);
  return data.seoData;
};

export const categorizeNews = async (scriptText: string): Promise<string> => {
    const cachePayload = { scriptText, purpose: 'categorization' };
    const cacheKey = await generateCacheKey(cachePayload);
    const cached = getFromCache<string>(cacheKey);
    if (cached) {
        return cached;
    }

    const response = await fetch('/api/categorize-news', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ script: scriptText })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Categorization failed");
    }

    const data = await response.json();
    setInCache(cacheKey, data.category);
    return data.category;
};
