import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  InputMode, 
  GeneratedScriptResponse, 
  GroundingChunk, 
  ScriptLength, 
  ScriptTone, 
  ScriptType, 
  SEOData 
} from './types';
import { UI_STRINGS_MY } from './constants';
import FileInput from './components/FileInput';
import UrlInput from './components/UrlInput';
import ReportInput from './components/ReportInput';
import TextAreaInput from './components/TextAreaInput';
import ScriptDisplay from './components/ScriptDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import ScriptLengthSelector from './components/ScriptLengthSelector';
import ScriptToneSelector from './components/ScriptToneSelector';
import ScriptTypeSelector from './components/ScriptTypeSelector';
import DisclaimerMessage from './components/DisclaimerMessage';
import ProofreadDiffView from './components/ProofreadDiffView';
import PolicyModal from './components/PolicyModal';
import ModuleTipsModal, { ModuleTipType } from './components/ModuleTipsModal';
import { 
  Settings, 
  HelpCircle, 
  BookOpen, 
  LogOut, 
  FileText, 
  Globe, 
  Languages, 
  Type, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  Info,
  Lightbulb,
  Cpu,
  Bookmark,
  Activity,
  Award,
  Upload,
  Coins,
  History,
  Compass
} from 'lucide-react';
import {
  generateScriptFromFileContent,
  generateScriptFromUrl,
  generateScriptFromReport,
  performEnToMyTranslationAndScriptGeneration,
  performMyToEnTranslationAndScriptGeneration,
  translatePastedText,
  proofreadScript,
  extractKeywords,
  generateSEOMetadata,
  categorizeNews,
  setCustomApiKeyForGemini
} from './services/geminiService';
import { clearAppCache } from './services/cacheService';

// Firebase core & auth services
import { 
  auth, 
  getOrCreateUserProfile, 
  updateUserApiKey, 
  consumeSystemCredit, 
  UserProfile 
} from './services/firebaseService';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';

const App: React.FC = () => {
  // Authentication & Profile states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState<boolean>(false);
  const [resetEmailSent, setResetEmailSent] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Modals visibility states
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState<boolean>(false);
  const [isTipsOpen, setIsTipsOpen] = useState<boolean>(false);
  const [tipsActiveTab, setTipsActiveTab] = useState<ModuleTipType>('file');
  const [tempApiKey, setTempApiKey] = useState<string>('');

  // Primary application states
  const [selectedInputMode, setSelectedInputMode] = useState<InputMode>(InputMode.FILE);
  const [selectedScriptLength, setSelectedScriptLength] = useState<ScriptLength>(ScriptLength.STANDARD);
  const [selectedScriptTone, setSelectedScriptTone] = useState<ScriptTone>(ScriptTone.FORMAL);
  const [selectedScriptType, setSelectedScriptType] = useState<ScriptType>(ScriptType.NEWS_ARTICLE);
  
  const [fileContent, setFileContent] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [englishUrlInput, setEnglishUrlInput] = useState<string>('');
  const [reportInput, setReportInput] = useState<string>('');
  const [pastedTextInput, setPastedTextInput] = useState<string>('');
  
  const [reportTargetLanguage, setReportTargetLanguage] = useState<'Burmese' | 'English'>('Burmese');
  const [reportStatistics, setReportStatistics] = useState<any[] | null>(null);
  const [reportChartData, setReportChartData] = useState<any[] | null>(null);
  const [reportChartTitle, setReportChartTitle] = useState<string | null>(null);
  const [reportChartType, setReportChartType] = useState<string | null>(null);
  
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [intermediateTranslation, setIntermediateTranslation] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingChunk[] | null>(null);
  const [proofreadScriptContent, setProofreadScriptContent] = useState<string | null>(null);
  const [extractedKeywords, setExtractedKeywords] = useState<string[] | null>(null);
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [useSEO, setUseSEO] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProofreading, setIsProofreading] = useState<boolean>(false);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [wasServedFromCache, setWasServedFromCache] = useState<boolean>(false);
  const [diagnosticStatus, setDiagnosticStatus] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getOrCreateUserProfile(user);
          setUserProfile(profile);
          setTempApiKey(profile.customApiKey || '');
          
          // Inject custom API key directly into Gemini service if present
          if (profile.customApiKey && profile.customApiKey.trim()) {
            setCustomApiKeyForGemini(profile.customApiKey.trim());
          } else {
            setCustomApiKeyForGemini(undefined);
          }
        } catch (err: any) {
          console.error("Error creating user profile:", err);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setCustomApiKeyForGemini(undefined);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Set default api key if profile modifications occurs
  useEffect(() => {
    if (userProfile && userProfile.customApiKey) {
      setCustomApiKeyForGemini(userProfile.customApiKey.trim());
    } else {
      setCustomApiKeyForGemini(undefined);
    }
  }, [userProfile]);

  // Check Mizzima AI Policy agreement status
  useEffect(() => {
    if (currentUser) {
      const agreed = localStorage.getItem('mzm_ai_policy_agreed');
      if (agreed !== 'true') {
        setIsPolicyOpen(true);
      }
    }
  }, [currentUser]);

  // Auth Handlers
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setResetEmailSent(false);
    if (!authEmail) {
      setAuthError('စကားဝှက်အသစ်သတ်မှတ်ရန် အီးမေးလ်လိပ်စာ ထည့်သွင်းပေးပါ။ (Please enter your email address to reset password.)');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, authEmail);
      setResetEmailSent(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setAuthError('ဤအီးမေးလ်ဖြင့် ဖွင့်ထားသောအကောင့်မရှိပါ။ (No account found with this email.)');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('အီးမေးလ်လိပ်စာ ပုံစံမမှန်ကန်ပါ။ (Invalid email address format.)');
      } else {
        setAuthError(err.message || 'စကားဝှက်အသစ်သတ်မှတ်ရန် လင့်ခ်ပေးပို့ခြင်း မအောင်မြင်ပါ။ (Failed to send reset email. Please try again.)');
      }
    }
  };

  const handleAuthEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail || !authPassword) {
      setAuthError('အီးမေးလ်နှင့် စကားဝှက်ကို ဖြည့်စွက်ပါ။');
      return;
    }
    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/weak-password') {
        setAuthError('စကားဝှက်သည် အနည်းဆုံး စာလုံး ၆ လုံး ရှိရမည်');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('ဤအီးမေးလ်ဖြင့် အကောင့်ဖွင့်ထားပြီး ဖြစ်သည်။');
      } else if (err.code === 'auth/invalid-credential') {
        setAuthError('အီးမေးလ် သို့မဟုတ် စကားဝှက် လွဲမှားနေသည်');
      } else {
        setAuthError(err.message || 'အကောင့်ဝင်ရောက်မှု မအောင်မြင်ပါ။ ပြန်လည်ကြိုးစားပါ။');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      const isPopupBlocked = err.code === 'auth/cancelled-popup-request' || 
                             err.message?.includes('cancelled-popup-request') || 
                             err.message?.includes('Pending promise') || 
                             err.message?.includes('popup');
      if (isPopupBlocked) {
        setAuthError('Google Sign-In popup window was closed, blocked, or restricted by third-party iframe cookies. Please sign up or log in using the Email & Password form below, which is 100% stable and works beautifully in all browsers.');
      } else {
        setAuthError(err.message || 'Google Level Sign-in failed.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      resetOutputs();
    } catch (err) {
      console.error("Signout error:", err);
    }
  };

  // Profile Custom API Key management
  const handleSaveApiKey = async () => {
    if (!currentUser) return;
    try {
      await updateUserApiKey(currentUser.uid, tempApiKey);
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          customApiKey: tempApiKey
        });
      }
      if (tempApiKey.trim()) {
        setCustomApiKeyForGemini(tempApiKey.trim());
      } else {
        setCustomApiKeyForGemini(undefined);
      }
      setIsSettingsOpen(false);
      alert('Gemini API KEY ကို သိမ်းဆည်းပြီးပါပြီ');
    } catch (err: any) {
      console.error(err);
      alert('ဆက်တင် မှတ်ထားခြင်း မအောင်မြင်ပါ။');
    }
  };

  const handleAgreePolicy = useCallback(() => {
    localStorage.setItem('mzm_ai_policy_agreed', 'true');
    setIsPolicyOpen(false);
  }, []);

  const handleOpenActiveModuleTips = useCallback(() => {
    let modeTip: ModuleTipType = 'file';
    switch (selectedInputMode) {
      case InputMode.FILE:
        modeTip = 'file';
        break;
      case InputMode.URL:
        modeTip = 'url';
        break;
      case InputMode.REPORT:
        modeTip = 'report';
        break;
      case InputMode.TRANSLATE_EN_TO_MY:
        modeTip = 'en2my';
        break;
      case InputMode.TRANSLATE_MY_TO_EN:
        modeTip = 'my2en';
        break;
      case InputMode.TRANSLATE_TEXT:
        modeTip = 'text';
        break;
      default:
        modeTip = 'file';
    }
    setTipsActiveTab(modeTip);
    setIsTipsOpen(true);
  }, [selectedInputMode]);

  // Reset core states
  const resetOutputs = useCallback((keepError: boolean = false) => {
    setGeneratedScript(null);
    setIntermediateTranslation(null);
    setGroundingSources(null);
    setProofreadScriptContent(null);
    setExtractedKeywords(null);
    setSeoData(null);
    setCategory(null);
    setReportStatistics(null);
    setReportChartData(null);
    setReportChartTitle(null);
    setReportChartType(null);
    if (!keepError) setError(null);
    setWasServedFromCache(false);
  }, []);

  const handleInputModeChange = useCallback((mode: InputMode) => {
    setSelectedInputMode(mode);
    resetOutputs();
    setFileContent(''); 
    setUrlInput('');
    setEnglishUrlInput('');
    setReportInput('');
    setPastedTextInput('');
  }, [resetOutputs]);

  const handleScriptLengthChange = useCallback((length: ScriptLength) => {
    setSelectedScriptLength(length);
    if (generatedScript) resetOutputs();
  }, [generatedScript, resetOutputs]);

  const handleScriptToneChange = useCallback((tone: ScriptTone) => {
    setSelectedScriptTone(tone);
    if (generatedScript) resetOutputs();
  }, [generatedScript, resetOutputs]);

  const handleScriptTypeChange = useCallback((type: ScriptType) => {
    setSelectedScriptType(type);
    if (generatedScript) resetOutputs();
  }, [generatedScript, resetOutputs]);

  const handleFileProcessed = useCallback((content: string) => {
    setFileContent(content);
    resetOutputs(!!error);
  }, [error, resetOutputs]); 
  
  const handleUrlChange = useCallback((value: string) => {
    setUrlInput(value);
    resetOutputs(!!error);
  }, [error, resetOutputs]);

  const handleEnglishUrlChange = useCallback((value: string) => {
    setEnglishUrlInput(value);
    resetOutputs(!!error);
  }, [error, resetOutputs]);

  const handleReportChange = useCallback((value: string) => {
    setReportInput(value);
    resetOutputs(!!error);
  }, [error, resetOutputs]);

  const handlePastedTextChange = useCallback((value: string) => {
    setPastedTextInput(value);
    resetOutputs(!!error);
  }, [error, resetOutputs]);

  const handleFileError = useCallback((message: string) => {
    setError(message);
    setFileContent(''); 
    resetOutputs(true); 
  }, [resetOutputs]);

  const validateInputs = (): boolean => {
    let currentError: string | null = null;
    const checkUrl = (inputUrl: string) : boolean => {
      if (!inputUrl.trim()){ return false; }
      try {
        new URL(inputUrl); 
        if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
          currentError = "URL သည် 'http://' သို့မဟုတ် 'https://' ဖြင့် စတင်ပါ";
          return false;
        }
      } catch (_) {
        currentError = "ထည့်သွင်းထားသော URL မမှန်ပါ။";
        return false;
      }
      return true;
    };

    switch (selectedInputMode) {
      case InputMode.FILE:
        if (!fileContent.trim()) currentError = UI_STRINGS_MY.ERROR_NO_INPUT + " (ဖိုင် အကြောင်းအရာ မရှိပါ (သို့မဟုတ်) ဖတ်မရပါ)";
        break;
      case InputMode.URL:
        if (!urlInput.trim()) currentError = UI_STRINGS_MY.ERROR_NO_INPUT + " (URL)";
        else if (!checkUrl(urlInput)) { /* error set in checkUrl */ }
        break;
      case InputMode.TRANSLATE_EN_TO_MY:
        if (!englishUrlInput.trim()) currentError = UI_STRINGS_MY.ERROR_NO_INPUT + " (အင်္ဂလိပ်သင်း URL)";
        else if (!checkUrl(englishUrlInput)) { /* error set in checkUrl */ }
        break;
      case InputMode.TRANSLATE_MY_TO_EN:
        if (!urlInput.trim()) currentError = UI_STRINGS_MY.ERROR_NO_INPUT + " (မြန်မာသတင်း URL)";
        else if (!checkUrl(urlInput)) { /* error set in checkUrl */ }
        break;
      case InputMode.TRANSLATE_TEXT:
        if (!pastedTextInput.trim()) currentError = UI_STRINGS_MY.ERROR_NO_INPUT + " (စာသား)";
        break;
      case InputMode.REPORT:
        if (!reportInput.trim()) currentError = UI_STRINGS_MY.ERROR_NO_INPUT + " (အစီရင်ခံစာ သို့မဟုတ် သတင်းထုတ်ပြန်ချက်ဖိုင်)";
        break;
      default:
        currentError = "မမှန်ကန်သော ထည့်သွင်းမှုအမျိုးအစား။"; 
    }
    
    if (currentError) {
      setError(currentError);
      return false;
    }
    setError(null); 
    return true;
  };

  // Perform AI transaction & Manage custom keys or daily credits
  const handlePerformTransaction = async (actionFn: () => Promise<any>): Promise<any> => {
    if (!currentUser || !userProfile) {
      throw new Error('အကောင့်ဝင်ရန် လိုအပ်သည်');
    }

    const hasCustomKey = userProfile.customApiKey && userProfile.customApiKey.trim().length > 0;
    
    // If NO custom key is set, we must deduct a free systems credit first!
    if (!hasCustomKey) {
      if (userProfile.credits <= 0) {
        throw new Error('ယနေ့အတွက် အခမဲ့အသုံးပြုနိုင်သော စနစ်ခရက်ဒစ် (၃၀) ကြိမ် ကုန်ဆုံးသွားပါပြီ။ ဆက်တင် (Settings) တွင် သင်၏ကိုယ်ပိုင် Gemini API Key အခမဲ့ထည့်သွင်း၍ အကန့်အသတ်မရှိ ဆက်လက်သုံးစွဲပါ.');
      }
      // Consume 1 credit from Firebase
      const remainingCredits = await consumeSystemCredit(currentUser.uid, userProfile.credits);
      setUserProfile({
        ...userProfile,
        credits: remainingCredits
      });
    }

    // Call actual generator
    return await actionFn();
  };

  const handleGenerateScript = async () => {
    resetOutputs(); 
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    
    try {
      let response: GeneratedScriptResponse | null = null;
      
      const triggerAction = async () => {
        switch (selectedInputMode) {
          case InputMode.FILE:
            return fileContent ? await generateScriptFromFileContent(fileContent, selectedScriptLength, selectedScriptTone, selectedScriptType) : null;
          case InputMode.URL:
            return urlInput ? await generateScriptFromUrl(urlInput, selectedScriptLength, selectedScriptTone, selectedScriptType) : null;
          case InputMode.REPORT:
            return reportInput ? await generateScriptFromReport(reportInput, selectedScriptLength, selectedScriptTone, selectedScriptType, reportTargetLanguage) : null;
          case InputMode.TRANSLATE_EN_TO_MY:
            return englishUrlInput ? await performEnToMyTranslationAndScriptGeneration(englishUrlInput, selectedScriptLength, selectedScriptTone, selectedScriptType) : null;
          case InputMode.TRANSLATE_MY_TO_EN:
            return urlInput ? await performMyToEnTranslationAndScriptGeneration(urlInput, selectedScriptLength, selectedScriptTone, selectedScriptType) : null;
          case InputMode.TRANSLATE_TEXT:
            return pastedTextInput ? await translatePastedText(pastedTextInput) : null;
          default:
            return null;
        }
      };

      response = await handlePerformTransaction(triggerAction);

      if (response?.script) {
        setGeneratedScript(response.script);
        setIntermediateTranslation(response.intermediateTranslation || null);
        setGroundingSources(response.sources || null);
        setWasServedFromCache(!!response.fromCache);

        // Report Analysis Statistics and Chart Data
        setReportStatistics(response.statistics || null);
        setReportChartData(response.chartData || null);
        setReportChartTitle(response.chartTitle || null);
        setReportChartType(response.chartType || null);

        setError(null);

        // SEO Optimization
        if (useSEO) {
          try {
            const seo = await generateSEOMetadata(response.script);
            setSeoData(seo || null);
          } catch (seoErr) {
            console.error("SEO generation failed:", seoErr);
          }
        }

        // Categorization
        try {
          const cat = await categorizeNews(response.script);
          setCategory(cat);
        } catch (catErr) {
          console.error("Categorization failed:", catErr);
        }
      } else { 
        setError(UI_STRINGS_MY.ERROR_GENERATING_SCRIPT + " (သက်ဆိုင်ရာ အကြောင်းအရာ ပြန်လည်မရရှိပါ)");
      }
    } catch (e: any) {
      console.error("Generation error:", e);
      setError(e.message || UI_STRINGS_MY.ERROR_GENERATING_SCRIPT);
      setGeneratedScript(null);
      setIntermediateTranslation(null);
      setGroundingSources(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProofreadScript = async () => {
    if (!generatedScript || isLoading || isProofreading) {
      return;
    }
    
    setWasServedFromCache(false); 
    setProofreadScriptContent(null); 
    setError(null);
    setIsProofreading(true);

    try {
      const editAction = async () => {
        return await proofreadScript(generatedScript);
      };
      const editedScript = await handlePerformTransaction(editAction);
      setProofreadScriptContent(editedScript);
      setError(null);
    } catch (e: any) {
      console.error("Proofreading error:", e);
      setError(e.message || UI_STRINGS_MY.ERROR_PROOFREADING_SCRIPT);
      setProofreadScriptContent(null);
    } finally {
      setIsProofreading(false);
    }
  };

  const handleExtractKeywords = async () => {
    if (!generatedScript || isLoading || isProofreading || isExtractingKeywords) {
      return;
    }

    setIsExtractingKeywords(true);
    setError(null);
    setExtractedKeywords(null);

    try {
      const keywordAction = async () => {
        const mainScriptContent = generatedScript.split(/\n\n---\n/)[0];
        return await extractKeywords(mainScriptContent);
      };
      const keywords = await handlePerformTransaction(keywordAction);
      setExtractedKeywords(keywords); 
    } catch (e: any) {
      console.error("Keyword extraction error:", e);
      setError(e.message || UI_STRINGS_MY.ERROR_EXTRACTING_KEYWORDS);
      setExtractedKeywords(null);
    } finally {
      setIsExtractingKeywords(false);
    }
  };

  const handleClearCache = () => {
    clearAppCache();
    alert(UI_STRINGS_MY.CACHE_CLEARED_SUCCESS);
  };

  const handleAutoDiagnoseApi = async () => {
    setIsDiagnosing(true);
    setDiagnosticStatus("စနစ် ဆန်းစစ်စစ်ဆေးမှု စတင်နေပါသည်... (Initializing Diagnostics)");
    
    try {
      const customKey = userProfile?.customApiKey || localStorage.getItem('mzm_custom_api_key');
      const response = await fetch('/api/diagnose-api-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'X-Custom-Gemini-Key': customKey } : {})
        }
      });
      
      const result = await response.json();
      if (response.ok && result?.status === 'success') {
        setDiagnosticStatus("✅ အောင်မြင်ပါသည်။ API Key နှင့် neuronal network ချိတ်ဆက်မှု အဆင်ပြေချောမွေ့နေပါသည် (Gemini API operational).");
        setTimeout(() => setDiagnosticStatus(null), 5000); // clear status after 5s if successful
      } else {
        setDiagnosticStatus(`⚠️ ပြဿနာ စစ်ဆေးတွေ့ရှိရပါသည် (Issue Detected):\nရလဒ်: ${result.reason || 'ခန့်မှန်းရခက်ခဲသော အခြေအနေ'}\n\nလမ်းညွှန်ချက်: ${result.advice || 'စာမျက်နှာအား ပြန်ဖွင့်ပါ သို့မဟုတ် ကိုယ်ပိုင် API Key အား ပြန်လည်စစ်ဆေးပါ။'}`);
      }
    } catch (e: any) {
      setDiagnosticStatus(`❌ ချိတ်ဆက်မှု အဆင်မပြေပါ (Connection Failed): ${e.message || 'ကွန်ရက် အမှားအယွင်း'}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const isGenerateDisabled = (): boolean => {
    if (isLoading || isProofreading) return true; 
    switch (selectedInputMode) {
      case InputMode.FILE: return !fileContent.trim();
      case InputMode.URL: return !urlInput.trim();
      case InputMode.REPORT: return !reportInput.trim();
      case InputMode.TRANSLATE_EN_TO_MY: return !englishUrlInput.trim();
      case InputMode.TRANSLATE_MY_TO_EN: return !urlInput.trim();
      case InputMode.TRANSLATE_TEXT: return !pastedTextInput.trim();
      default: return true;
    }
  };

  const downloadFile = (content: string | null, baseFileName: string, extension: 'txt') => {
    if (!content) return;
    
    const mimeType = 'text/plain;charset=utf-8';
    const cleanContent = content
      .replace(/^#+\s+/gm, '') 
      .replace(/\*\*/g, '')   
      .replace(/\*/g, '')     
      .replace(/^(နိဒါန်း|အဓိက အကြောင်းအရာ|နိဂုံး|နိဂုံးနှင့် တိုက်တွန်းချက်|သတင်းခေါင်းစဉ်|နိဒါန်း \(Opening Hook\)|အဓိက အကြောင်းအရာ \(Narration Body\)|နိဂုံး \(Conclusion & Call-to-Action\)):/gm, '')
      .trim();

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([cleanContent], { type: mimeType }));
    link.download = `${baseFileName}_${new Date().toISOString().slice(0,10)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
  const renderInputs = () => {
    switch(selectedInputMode) {
      case InputMode.FILE:
        return <FileInput onFileProcessed={handleFileProcessed} onError={handleFileError} />;
      case InputMode.URL:
        return <UrlInput value={urlInput} onChange={handleUrlChange} />;
      case InputMode.REPORT:
        return (
          <ReportInput 
            value={reportInput} 
            onChange={handleReportChange} 
            targetLanguage={reportTargetLanguage}
            onLanguageChange={setReportTargetLanguage}
          />
        );
      case InputMode.TRANSLATE_EN_TO_MY:
        return <UrlInput value={englishUrlInput} onChange={handleEnglishUrlChange} placeholder={UI_STRINGS_MY.URL_PLACEHOLDER} label={UI_STRINGS_MY.ENTER_ENGLISH_URL_PROMPT}/>;
      case InputMode.TRANSLATE_MY_TO_EN:
        return <UrlInput value={urlInput} onChange={handleUrlChange} placeholder={UI_STRINGS_MY.URL_PLACEHOLDER} label={UI_STRINGS_MY.ENTER_BURMESE_URL_PROMPT} />;
      case InputMode.TRANSLATE_TEXT:
        return <TextAreaInput value={pastedTextInput} onChange={handlePastedTextChange} />;
      default:
        return null;
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      if (selectedInputMode === InputMode.TRANSLATE_EN_TO_MY || selectedInputMode === InputMode.TRANSLATE_MY_TO_EN) {
        return UI_STRINGS_MY.TRANSLATING_AND_GENERATING_BUTTON;
      }
      if (selectedInputMode === InputMode.TRANSLATE_TEXT) {
        return UI_STRINGS_MY.TRANSLATING_BUTTON;
      }
      return UI_STRINGS_MY.GENERATING_SCRIPT_BUTTON;
    }
    if (selectedInputMode === InputMode.TRANSLATE_TEXT) {
      return UI_STRINGS_MY.TRANSLATE_BUTTON_TEXT;
    }
    return UI_STRINGS_MY.GENERATE_SCRIPT_BUTTON;
  };

  // -------------------------------------------------------------
  // Render Auth Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4">
        <LoadingSpinner mode="auth" />
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render Auth Login view if not currently logged in
  if (!currentUser) {
    if (isForgotPasswordMode) {
      return (
        <div className="min-h-screen bg-stone-50/70 flex flex-col justify-center items-center py-10 px-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-md space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-blue-600 font-serif tracking-tight">
                MZM News Reset
              </h1>
              <p className="mt-2 text-sm text-slate-500 font-serif">
                လျှို့ဝှက်နံပါတ် ပြန်လည်သတ်မှတ်ခြင်း
              </p>
            </div>

            {resetEmailSent ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg font-serif">
                  ✉️ စကားဝှက်အသစ်သတ်မှတ်ရန် လင့်ခ်ကို သင်၏ အီးမေးလ်လိပ်စာ <strong>{authEmail}</strong> သို့ ပို့ပေးလိုက်ပါပြီ။ ကျေးဇူးပြု၍ သင်၏ inbox သို့မဟုတ် spam folder ကို စစ်ဆေးပေးပါ။
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmailSent(false);
                    setIsForgotPasswordMode(false);
                    setAuthError(null);
                  }}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-serif cursor-pointer shadow-md transition-all"
                >
                  အကောင့်ဝင်ရန် မျက်နှာပြင်သို့ ပြန်သွားမည်
                </button>
              </div>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
                <div className="rounded-md shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1 font-serif">
                      အီးမေးလ်
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-white border border-slate-350 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                      placeholder="name@example.com"
                    />
                    <p className="mt-2 text-xs text-slate-400 font-serif leading-relaxed">
                      စကားဝှက် အသစ်သတ်မှတ်နိုင်မည့် လင့်ခ်ပို့ပေးရန် သင့်အကောင့်၏ အီးမေးလ်ကို ရိုက်ထည့်ပါ။
                    </p>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-serif">
                    ⚠️ {authError}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-serif cursor-pointer shadow-md transition-all"
                  >
                    လင့်ခ် ပေးပို့မည် (Send Reset Link)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordMode(false);
                      setAuthError(null);
                    }}
                    className="w-full flex justify-center items-center py-3 px-4 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none font-serif cursor-pointer transition-all gap-2 shadow-sm"
                  >
                    မေ့တော့ဘူး၊ ပြန်ထွက်မည်
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-stone-50/70 flex flex-col justify-center items-center py-10 px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-blue-600 font-serif tracking-tight">
              MZM News Writer
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-serif">
              သတင်းထုတ်လုပ်ရာတွင် ပိုမိုမြန်ဆန်စေမည်
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleAuthEmailPassword}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1 font-serif">
                  အီးမေးလ်
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-white border border-slate-350 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-500 mb-1 font-serif">
                  လျှို့ဝှက်နံပါတ် (စကားဝှက်)
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-white border border-slate-350 rounded-lg px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-serif">
                ⚠️ {authError}
              </div>
            )}

            {!isSignUpMode && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setResetEmailSent(false);
                    setIsForgotPasswordMode(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 transition-colors font-serif font-medium cursor-pointer"
                >
                  စကားဝှက် မေ့နေပါသလား? (Forgot Password?)
                </button>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-serif cursor-pointer shadow-md transition-all"
              >
                {isSignUpMode ? 'အကောင့်အသစ်ဖွင့်ရန်' : 'App ကို အသုံးပြုရန်'}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex justify-center items-center py-3 px-4 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none font-serif cursor-pointer transition-all gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-6.19-4.53z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Google အကောင့်ဖြင့် ဝင်မည်
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setIsSignUpMode(!isSignUpMode);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-serif font-medium cursor-pointer"
              >
                {isSignUpMode ? 'အကောင့်ရှိပြီးသားလား? ဖုန်းဖြင့် တိုက်ရိုက်ဝင်မည်' : 'အကောင့်အသစ် ဖွင့်ရန် ဤနေရာကို နှိပ်ပါ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render Authorized App Dashboard
  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Dynamic Navigation & User Profiles Block */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-md">
            <span className="text-2xl font-bold tracking-tight text-white font-sans">MZM</span>
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-slate-900">{UI_STRINGS_MY.APP_TITLE}</h1>
            <p className="text-xs text-slate-500 font-serif"> ထောက်ကူပြုမြန်မာသတင်းအေအိုင်</p>
          </div>
        </div>

        {/* User Statistics Control Center */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
          <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-serif text-slate-700">
            📧 {currentUser.email}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/85 rounded-lg text-xs font-serif font-semibold text-blue-600">
            {userProfile?.customApiKey ? (
              <span>🔑 ကိုယ်ပိုင် API KEY သုံးနေပါသည်</span>
            ) : (
              <span>⚡ လက်ကျန် အခမဲ့အကြိမ်ရေ: {userProfile?.credits ?? 0} (၃၀ ကြိမ်)</span>
            )}
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1 px-3 bg-white hover:bg-slate-50 text-xs rounded-lg font-serif border border-slate-200 shadow-sm cursor-pointer flex items-center gap-1 transition-colors text-slate-700"
            title="Setting"
          >
            ⚙️ Settomg
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-1 px-3 bg-emerald-50 hover:bg-emerald-100 text-xs rounded-lg font-serif border border-emerald-200 shadow-sm cursor-pointer flex items-center gap-1 transition-colors text-emerald-700"
          >
            💡 အသုံးပြုနည်းလမ်းညွှန်
          </button>

          <button
            onClick={() => setIsPolicyOpen(true)}
            className="p-1 px-3 bg-purple-50 hover:bg-purple-100 text-xs rounded-lg font-serif border border-purple-200 shadow-sm cursor-pointer flex items-center gap-1 transition-colors text-purple-700 font-medium"
            title="Mizzima Newsroom AI Policy"
          >
            📋 မဇ္ဈိမသတင်းခန်း၏ AI မူဝါဒ
          </button>

          <button
            onClick={handleSignOut}
            className="p-1 px-3 bg-red-50 hover:bg-red-100 text-xs rounded-lg font-serif border border-red-200 cursor-pointer text-red-650 shadow-sm transition-colors"
          >
            ထွက်မည်
          </button>
        </div>
      </div>

      <DisclaimerMessage />

      <main className="max-w-6xl mx-auto space-y-8 mt-6">
        
        {/* --- Section 1: Inputs & Controls --- */}
        <motion.section 
          className="w-full"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                သတင်းရေးသားမှုဆော့ဖ်ဝဲ ပင်မအလုပ်ခွင် (MZM Production Deck)
              </h2>
              <button
                onClick={handleOpenActiveModuleTips}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200/80 rounded-xl text-xs font-serif font-semibold text-amber-800 cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="ရွေးချယ်ထားသော ရေးသားနည်းအလုပ်လုပ်ပုံနှင့် အကြံပြုချက်များ အကျဉ်းဖတ်ရန်"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                ရေးသားနည်းလမ်းညွှန်ချက် ဖတ်ရန်
              </button>
            </div>
            
            {/* Consolidated Input Selector and Options Workspace */}
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl space-y-4">
                <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 font-serif flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                  သတင်းရင်းမြစ် ရွေးချယ်စင်တာ (Content Source Selector)
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {[
                    { mode: InputMode.FILE, label: "ဖိုင်တင်သွင်းရန်", icon: Upload },
                    { mode: InputMode.URL, label: "ဝဘ်လင့်ခ် (URL)", icon: Globe },
                    { mode: InputMode.REPORT, label: "အစီရင်ခံစာသတင်း", icon: TrendingUp },
                    { mode: InputMode.TRANSLATE_EN_TO_MY, label: "En to My ပြန်ရန်", icon: Languages },
                    { mode: InputMode.TRANSLATE_MY_TO_EN, label: "My to En ပြန်ရန်", icon: Languages },
                    { mode: InputMode.TRANSLATE_TEXT, label: "စာသားဘာသာပြန်", icon: Type },
                  ].map(({ mode, label, icon: Icon }) => {
                    const isSelected = selectedInputMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleInputModeChange(mode)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50
                          ${isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md font-bold scale-[1.02]' 
                            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-300 hover:shadow-sm'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                        <span className="text-[10px] font-semibold font-serif leading-tight">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Combined Input Field Container */}
              <div className="p-5 border border-slate-100 bg-slate-50/30 rounded-xl space-y-4">
                {renderInputs()}
              </div>

              {/* Unified Adjustments Panel */}
              {selectedInputMode !== InputMode.TRANSLATE_TEXT && (
                <div className="p-5 bg-stone-50 border border-stone-200 rounded-xl space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ScriptLengthSelector 
                      selectedLength={selectedScriptLength}
                      onLengthChange={handleScriptLengthChange}
                    />
                    <ScriptToneSelector
                      selectedTone={selectedScriptTone}
                      onToneChange={handleScriptToneChange}
                    />
                  </div>

                  {/* The Script Type is not applicable when generating an English script from a Burmese source */}
                  {selectedInputMode !== InputMode.TRANSLATE_MY_TO_EN && (
                    <ScriptTypeSelector
                      selectedType={selectedScriptType}
                      onTypeChange={handleScriptTypeChange}
                    />
                  )}

                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="flex items-center cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={useSEO}
                          onChange={() => setUseSEO(!useSEO)}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${useSEO ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useSEO ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <div className="ml-3 text-xs font-bold text-slate-755 font-serif group-hover:text-blue-600 transition-colors">
                        SEO ရှာဖွေမှု အကောင်းဆုံးပြင်ဆင်မည် (SEO Opt-In)
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTipsActiveTab('seo');
                        setIsTipsOpen(true);
                      }}
                      className="self-start sm:self-auto text-xs text-blue-600 hover:text-blue-750 hover:underline font-serif font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      SEO သီအိုရီ ဖတ်ရှုရန်
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Self-Healing Connection & Code Diagnostics Block */}
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-slate-855 font-serif flex items-center gap-1.5 justify-center sm:justify-start">
                    <Cpu className="w-4 h-4 text-emerald-500 animate-pulse animate-duration-1000" />
                    ကွန်ရက်နှင့် API ကျန်းမာရေး စစ်ဆေးပြင်ဆင်မှုစနစ် (Self-Healing Diagnostic Hub)
                  </h4>
                  <p className="text-[10px] text-slate-500 font-serif font-medium">
                    Gemini API Key ချိတ်ဆက်မှု အဆင်မပြေခြင်း၊ ကန့်သတ်ချက်ပြည့်ခြင်းနှင့် server သတ်မှတ်ချက် အမှားများကို စစ်ဆေးကြည့်ရှုပါ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDiagnoseApi}
                  disabled={isDiagnosing}
                  className="bg-slate-900 text-white font-semibold hover:bg-slate-800 text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  {isDiagnosing ? 'ဆန်းစစ်နေပါသည်...' : 'ကျန်းမာရေး စစ်ဆေးမည်'}
                </button>
              </div>

              {diagnosticStatus && (
                <div className="mt-3 p-4 bg-slate-900 text-slate-200 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px] whitespace-pre-wrap leading-relaxed animate-fade-in relative shadow-inner">
                  <div className="absolute top-2 right-2 text-[9px] uppercase font-bold text-slate-500 tracking-wider">Diagnostic Terminal</div>
                  {diagnosticStatus}
                </div>
              )}
            </div>
            
            {error && <ErrorMessage message={error} onOpenSettings={() => setIsSettingsOpen(true)} />}

            <div className="mt-8">
              <button
                onClick={handleGenerateScript}
                disabled={isGenerateDisabled()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-white font-semibold py-3.5 px-10 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transform transition-all cursor-pointer font-serif text-base flex items-center justify-center gap-2"
                aria-live="polite"
              >
                <Sparkles className="w-4 h-4" />
                {getButtonText()}
              </button>
            </div>
          </div>
        </motion.section>

        {/* --- Section 2: Outputs & Results (Refined layout and rich display) --- */}
        <motion.section 
          className="w-full space-y-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          {isLoading && <LoadingSpinner mode="generate" />}
          
          {!isLoading && (
            <>
              {intermediateTranslation && (
                <div className="p-6 bg-blue-50/50 border border-blue-200 rounded-2xl shadow-sm">
                  <h2 className="font-serif text-xl font-bold text-blue-700 mb-4 pb-2 border-b border-blue-200">
                    {UI_STRINGS_MY.INTERMEDIATE_TRANSLATION_HEADING}
                  </h2>
                  <div className="font-newspaper-body text-base text-slate-755 whitespace-pre-wrap leading-relaxed">
                    {intermediateTranslation}
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm relative">
                {generatedScript ? (
                  <ScriptDisplay 
                    script={generatedScript} 
                    sources={groundingSources || undefined} 
                    seoData={seoData} 
                    category={category} 
                    wasServedFromCache={wasServedFromCache} 
                    statistics={reportStatistics}
                    chartData={reportChartData}
                    chartTitle={reportChartTitle}
                    chartType={reportChartType}
                  />
                ) : (
                  <div className="py-20 text-center text-slate-450 font-serif text-sm">
                    {UI_STRINGS_MY.NO_SCRIPT_YET}
                  </div>
                )}
              </div>

              {generatedScript && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => downloadFile(generatedScript, "myanmar_news_script", 'txt')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3.5 px-6 rounded-xl border border-slate-250 shadow-sm hover:shadow transform active:translate-y-0 hover:-translate-y-0.5 transition-all text-xs sm:text-sm font-serif cursor-pointer"
                    >
                      💾 Text ဖိုင်အဖြစ်သိမ်းရန်
                    </button>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={handleProofreadScript}
                        disabled={isProofreading || isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-150 disabled:text-slate-400 disabled:border-slate-200 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transform active:translate-y-0 hover:-translate-y-0.5 transition-all text-xs sm:text-sm font-serif cursor-pointer"
                      >
                        {isProofreading ? '🔍 ပြင်ဆင်ချက်များကို စစ်ဆေးနေပါသည်...' : '🔍 စာလုံးပေါင်းနှင့်သဒ္ဒါပြင်ရန်'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipsActiveTab('proofreader');
                          setIsTipsOpen(true);
                        }}
                        className="self-end text-[11px] text-indigo-605 hover:text-indigo-750 hover:underline font-serif font-semibold cursor-pointer"
                      >
                        💡 AI သတ်ပုံစစ်ဆေးရေးစနစ်အကြောင်းသိရန်
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <h2 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-2">
                        🏷️ သတင်း၏အဓိက Keyword များ
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setTipsActiveTab('seo');
                          setIsTipsOpen(true);
                        }}
                        className="self-start sm:self-auto text-xs text-blue-600 hover:text-blue-700 hover:underline font-serif font-semibold cursor-pointer"
                      >
                        💡 SEO နှင့် Keyword စနစ် အသုံးပြုပုံဖတ်ရန်
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <button
                        onClick={handleExtractKeywords}
                        disabled={isLoading || isProofreading || isExtractingKeywords}
                        className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs py-2 px-5 rounded-lg border border-slate-250 font-serif cursor-pointer transition-colors"
                      >
                        {isExtractingKeywords ? 'ထုတ်ယူနေပါသည်...' : 'Keyword ထုတ်ယူမည်'}
                      </button>
                    </div>
                    {isExtractingKeywords && <LoadingSpinner mode="keywords" />}
                    {extractedKeywords && !isExtractingKeywords && (
                      <div className="mt-4">
                        {extractedKeywords.length > 0 ? (
                          <div className="flex flex-wrap gap-2.5">
                            {extractedKeywords.map((keyword, index) => (
                              <span key={index} className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                                #{keyword}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 font-serif">Keyword စကားလုံး ရှာမတွေ့ပါ။</p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {isProofreading && <LoadingSpinner mode="proofread" />}

              {!isProofreading && proofreadScriptContent && generatedScript && (
                <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 animate-fade-in">
                  <ProofreadDiffView
                    originalScript={generatedScript}
                    proofreadScript={proofreadScriptContent}
                  />
                  <div className="text-center pt-2">
                    <button
                      onClick={() => downloadFile(proofreadScriptContent, "proofread_myanmar_news_script", 'txt')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-8 rounded-xl shadow-sm border border-transparent font-serif text-sm cursor-pointer transition-all"
                    >
                      💾 ပြင်ဆင်ပြီးစာသား သိမ်းဆည်းရန်
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.section>
      </main>

      {/* --- Settings Modal --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-blue-400 font-serif">⚙️ ဆက်တင်များ (Settings)</h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-100 font-serif cursor-pointer text-xl p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 font-serif leading-relaxed">
                စံသတ်မှတ်ချက်အရ အကောင့်တစ်ခုလျှင် <strong>တစ်ရက် အခမဲ့ (၃၀) ကြိမ်</strong> အသုံးပြု သုံးစွဲနိုင်သည်။ ကန့်သတ်ချက်မရှိ သုံးစွဲလိုလျှင် ကိုယ်ပိုင် Gemini API Key ထည့်သွင်းအသုံးပြုပါ. API KEY ကို အခမဲ့ရယူနည်းဆက်လက်ကြည့်ရှုပါ။
              </p>

              <div>
                <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-1.5 font-serif">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="AIzaSy..."
                />
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200 font-serif">🔑 အခမဲ့ Gemini API Key ရယူနည်း</h4>
                <ol className="list-decimal text-[11px] text-slate-400 pl-4 space-y-1 font-serif leading-relaxed">
                  <li>Google AI Studio (<a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">aistudio.google.com</a>) သို့ သွားရောက်ပါ။</li>
                  <li>"Create API Key" ကို နှိပ်ပြီး အခမဲ့ API key အသစ်တစ်ခု ဖန်တီးပါ။</li>
                  <li>ရရှိလာသော Key ကို ကူးယူပြီး app တွင် ဖြည့်သွင်း သိမ်းဆည်းပါ။</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 px-4 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-serif cursor-pointer"
              >
                မှတ်သားမထားဘဲ ပိတ်မည်
              </button>
              <button
                onClick={handleSaveApiKey}
                className="p-2 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-serif font-semibold cursor-pointer shadow-md"
              >
                မှတ်သားထားမည်
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Help Guidelines Pop-up Modal --- */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-emerald-400 font-serif flex items-center gap-1.5">
                💡အသုံ့းပြုနည်း လမ်းညွှန်
              </h3>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-100 font-serif cursor-pointer text-xl p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs font-serif text-slate-300 leading-relaxed">
              <p className="text-sm text-slate-200">
                Appတွင်ပါရှိသော လုပ်ဆောင်ချက်များအလိုက် 
                အလုပ်လုပ်ပုံများနှင့် အသုံးပြုနည်းများ-
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-blue-400 text-sm">📁 စာကြမ်းဖိုင်မှ သတင်းအချော ရေးသားခြင်း (File Input)</h4>
                  <p className="text-slate-400 text-[11px]">
                    မိမိရေးသားထားသည့် စာကြမ်းဖိုင် .txt, .pdf သို့မဟုတ် .docx ဖိုင်ကို ရွေးချယ်ပြီး၊ ဗီဒီယိုသတင်း script သို့မဟုတ် သတင်းစာသား အချောကို ပြန်လည် ရေးသားပေးသည်။ ရေးသားပြီးသော သတင်းတွင် ထပ်မံဖြည့်စွက်အချက်အလက်များ/ ဖန်တီးထားသော အကြောင်းအရာများ မပါရှိစေရန် ထိန်းညှိထားသည်။
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-blue-400 text-sm">🌐 ဝဘ်ဆိုက် (URL)မှ သတင်းထုတ်လုပ်ခြင်း</h4>
                  <p className="text-slate-400 text-[11px]">
                    အသုံးပြုလိုသည့် သတင်း web linkကို ထည့်သွင်းလိုက်ပါက Gemini AIက  ၎င်းစာမျက်နှာမှ သတင်းစာသားများကို အလိုအလျောက် သီးသန့်ဆွဲထုတ်ပြီး ရွေးချယ်ထားသော သတင်းပုံစံသို့ ပြန်လည်ရေးသားပေးပါသည်။
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-blue-400 text-sm">ဘာသာပြန်သတင်း အင်္ဂလိပ်- မြန်မာ</h4>
                  <p className="text-slate-400 text-[11px]">
                    မူရင်း အင်္ဂလိပ်ဘာသာ သတင်းလင့်ခ်ကို ထည့်သွင်းပေးပြီး မြန်မာဘာသာသို့ တိုက်ရိုက်ပြန်ဆို ရေးသားပေးသည်။ မူရင်းသတင်းအရင်းအမြစ်၏ သတင်းအရည်အသွေးအား မထိခိုက်စေရန် ဘာသာပြန်ဆိုသည့် စနစ်တွင်ထိန်းညှိပေးထားသည်။
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-blue-400 text-sm">ဘာသာပြန်သတင်း မြန်မာ-အင်္ဂလိပ်</h4>
                  <p className="text-slate-400 text-[11px]">
                    မူရင်းမြန်မာဘာသာ သတင်းလင့်ခ်ကို ထည့်သွင်းပေးပြီး အင်္ဂလိပ်ဘာသာသို့ တိုက်ရိုက်ပြန်ဆို ရေးသားပေးသည်။ မူရင်းသတင်းအရင်းအမြစ်၏ သတင်းအရည်အသွေးအား မထိခိုက်စေရန် ဘာသာပြန်ဆိုသည့် စနစ်တွင်ထိန်းညှိပေးထားသည်။
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-blue-400 text-sm">📋 အစီရင်ခံစာ သတင်းရေးသားခြင်း(Report Option)</h4>
                  <p className="text-slate-400 text-[11px]">
                    ကုလသမဂ္ဂ (UN)၊ နိုင်ငံတကာအဖွဲ့အစည်းများနှင့် လွတ်လပ်သော သုတေသနအစီရင်ခံစာများ၊ ထုတ်ပြန်ချက်များကို ထည့်သွင်းပေးပါက အဓိကအချက်အလက်များကို အခြေတည်ပြီး စံသတ်မှတ်ချက်များနှင့်အညီ သတင်းဆောင်းပါး ဖန်တီးပေးသည်။
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-blue-400 text-sm">✍️ဘာသာပြန် စစ်ဆေးခြင်းနှင့် ပြင်ဆင်ခြင်း</h4>
                  <p className="text-slate-400 text-[11px]">
                    သတင်းရေးသားပြီးချိန်တွင် "စစ်ဆေးပြင်ဆင်ရန်" ခလုတ်အားနှိပ်ပါက မြန်မာစာလုံးပေါင်း၊ သဒ္ဒါအမှားများနှင့် သတ်ပုံများကို စနစ်တကျ ပြင်ဆင်၍ မူရင်းစာသားနှင့် နှိုင်းယှဉ်ပြသပေးသည်။
                  </p>
                </div>

              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-serif font-semibold cursor-pointer"
              >
                သဘောတူ နားလည်ပါသည်။ (ပိတ်မည်)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Mizzima Newsroom AI Policy Modal --- */}
      <PolicyModal
        isOpen={isPolicyOpen}
        onAgree={handleAgreePolicy}
        onClose={() => setIsPolicyOpen(false)}
        showCloseButton={localStorage.getItem('mzm_ai_policy_agreed') === 'true'}
      />

      {/* --- Interactive Pop-up Tips System Modal --- */}
      <ModuleTipsModal
        isOpen={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
        initialSelectedModule={tipsActiveTab}
      />

      {/* --- Elegant Human Footer Credits --- */}
      <footer className="text-center mt-16 py-6 border-t border-slate-850 space-y-4">
        <button
          onClick={handleClearCache}
          className="text-xs text-slate-500 hover:text-blue-400 hover:underline font-serif focus:outline-none rounded cursor-pointer"
        >
          {UI_STRINGS_MY.CLEAR_CACHE_BUTTON}
        </button>
        <p className="text-sm text-slate-500 font-serif">&copy; {new Date().getFullYear()} Burmese Newsroom AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
