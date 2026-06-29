import express from 'express';
import path from 'path';
import cors from 'cors';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import pdfParse from 'pdf-parse-fork';
import mammoth from 'mammoth';

// These would normally be imported from constants.ts, but to ensure 
// server-side execution without potential browser-only code in constants,
// we define the core ones here or use them directly if possible.
// For now, I'll import from constants.ts since it looks safe (no DOM dependecies).
import { 
    GEMINI_MODEL_TEXT, 
    SYSTEM_INSTRUCTION_PROOFREADER,
    SYSTEM_INSTRUCTION_SEO_OPTIMIZER,
    SYSTEM_INSTRUCTION_CATEGORIZER,
} from './constants.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Helper for Gemini API
  const getAiClient = (req: express.Request) => {
    const customKey = req.headers['x-custom-gemini-key'];
    const apiKey = (typeof customKey === 'string' && customKey.trim()) ? customKey.trim() : undefined;
    if (!apiKey) {
      throw new Error('ကိုယ်ပိုင် Gemini API Key မတွေ့ရှိပါ။ ကျေးဇူးပြု၍ Settings (ညာဘက်အပေါ်ဒေါင့်) တွင် သင့်ကိုယ်ပိုင် Gemini API Key (Google AI Studio Key) ကို ဦးစွာ ထည့်သွင်းသိမ်းဆည်းပေးပါ။ (No personal Gemini API Key supplied. Please enter your personal Gemini API Key under Settings in the top-right to proceed.)');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  // API Routes
  app.post('/api/parse-file', async (req, res) => {
    try {
      const { fileData, fileType, fileName, enhanced } = req.body;
      const buffer = Buffer.from(fileData, 'base64');
      let text = '';
      let isOcrUsed = false;
      let ocrError = '';

      if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        let localText = '';
        try {
          const data = await pdfParse(buffer);
          localText = data.text || '';
        } catch (e: any) {
          console.warn('Local pdfParse failed, will rely on enhanced parsing if available:', e);
        }

        // Auto-detect if standard PDF parser extracted almost nothing (e.g. Scanned Document)
        const isExtremelyShort = localText.trim().replace(/\s/g, '').length < 150;
        const shouldRunEnhanced = enhanced === true || (enhanced !== false && isExtremelyShort);

        if (shouldRunEnhanced) {
          try {
            console.log(`Running high-accuracy Gemini OCR & layout parsing for PDF: ${fileName} (Is Auto fallback: ${isExtremelyShort && enhanced !== true})`);
            const ai = getAiClient(req);
            
            const prompt = `Analyze the attached PDF document and extract all text, data, and information with extremely high fidelity. Follow these strict directives:
1. Maintain the natural reading order for multi-column layouts.
2. For any tables, charts, or structured metrics, transcribe them cleanly as readable Markdown tables to preserve relationship alignment.
3. Transcribe all text, numbers, dates, and names exactly. If pages are scanned images (OCR), perform precise OCR text extraction supporting both Burmese and English.
4. Preserve bullet points, lists, and headings so the structural hierarchy is clear.
5. Output ONLY the raw extracted transcript/text of the document. Do not summarize, translate, comment, or add any preamble. Just output the clean extracted document content.`;

            const geminiResponse = await ai.models.generateContent({
              model: GEMINI_MODEL_TEXT,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        data: fileData,
                        mimeType: 'application/pdf'
                      }
                    },
                    {
                      text: prompt
                    }
                  ]
                }
              ]
            });

            const extractedText = geminiResponse.text || '';
            if (extractedText.trim()) {
              text = extractedText;
              isOcrUsed = true;
            } else {
              text = localText;
            }
          } catch (geminiError: any) {
            console.error('Gemini enhanced parsing failed:', geminiError);
            ocrError = geminiError.message || String(geminiError);
            text = localText; // fallback to basic text
          }
        } else {
          text = localText;
        }
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.toLowerCase().endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else {
        res.status(400).json({ error: 'Unsupported file type' });
        return;
      }

      res.json({ text, isOcrUsed, ocrError: ocrError || undefined });
    } catch (error: any) {
      console.error('Error in /api/parse-file:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-script', async (req, res) => {
    try {
      const { prompt, useSearchGrounding, systemInstruction } = req.body;
      const ai = getAiClient(req);

      const tools: any[] = [];
      if (useSearchGrounding) {
        tools.push({ googleSearch: {} });
      }

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          tools: tools.length > 0 ? tools : undefined,
        }
      });

      const text = response.text || '';
      
      let sources = undefined;
      // Extract grounding sources if available
      const candidate = (response as any).candidates?.[0];
      if (candidate?.groundingMetadata?.groundingChunks) {
        sources = candidate.groundingMetadata.groundingChunks;
      }

      res.json({ script: text, sources });
    } catch (error: any) {
      console.error('Error in /api/generate-script:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-report-news', async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const ai = getAiClient(req);

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          script: {
            type: Type.STRING,
            description: "The main news script or article text. Divide into professional paragraphs with double line-breaks. Ensure there are no Markdown symbols (** or # or *), headers, or labels like 'နိဒါန်း', 'နိဂုံး', etc."
          },
          statistics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                metric: { type: Type.STRING, description: "Short name or metric label (e.g. 'လူဦးရေ', 'ခန့်မှန်းချက်')" },
                value: { type: Type.STRING, description: "Statistic or number including units (e.g. '၃၀%', '၁.၄ သန်း', 'USD 2.5B')" },
                detail: { type: Type.STRING, description: "Detailed explanation or citation context for this statistic in standard news language." }
              },
              required: ["metric", "value", "detail"]
            },
            description: "A list of key numerical statistics or core metrics parsed/understood from the report."
          },
          chartData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: "A very short visual label (1-3 words) representing the bar, line, or pie slice of the chart." },
                value: { type: Type.NUMBER, description: "Numerical value for plotting (MUST be a valid real number or integer, e.g. 30, 1400000, 25)." },
                unit: { type: Type.STRING, description: "Unit of the value (e.g. '%', 'millions', '$')." }
              },
              required: ["label", "value"]
            },
            description: "Structured numeric data points suitable for drawing a visual chart (Bar, Line, or Pie)."
          },
          chartTitle: {
            type: Type.STRING,
            description: "An appropriate descriptive and short title for the graphical chart in the target translation language."
          },
          chartType: {
            type: Type.STRING,
            description: "The ideal visualization chart type: 'bar' or 'line' or 'pie'."
          }
        },
        required: ["script"]
      };

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction + "\nYou MUST return a JSON matching the requested schema. Extracted statistics, charts, and metrics must correspond accurately to the data present in the report.",
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });

      const responseText = response.text || '{}';
      const output = JSON.parse(responseText);

      res.json(output);
    } catch (error: any) {
      console.error('Error in /api/generate-report-news:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/summarize-report', async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      const ai = getAiClient(req);

      const prompt = `You are a professional research analyst and investigative editor.
Analyze the following document/report and provide an incredibly concise, high-fidelity, and well-structured factual summary.
Output the summary in bullet points using ${targetLanguage === 'English' ? 'English' : 'Burmese'}.
Do not extrapolate, insert external facts, or use subjective filler. Just output a clean, bulleted list of 5-8 major factual takeaways and key statistics. Ensure absolutely no Markdown headings or bold titles are used other than simple list bullets.

Report Document Content:
"""
${text}
"""`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are an expert report summarizer. Output 5-8 bullet points of high-fidelity factual key findings. Do not add intro or outro conversational text."
        }
      });

      res.json({ summary: response.text || '' });
    } catch (error: any) {
      console.error('Error in /api/summarize-report:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/translate', async (req, res) => {
    try {
      const { text, systemInstruction } = req.body;
      const ai = getAiClient(req);

      const response = await ai.models.generateContent({ 
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          systemInstruction: systemInstruction
        }
      });

      res.json({ translatedText: response.text || '' });
    } catch (error: any) {
      console.error('Error in /api/translate:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/proofread', async (req, res) => {
    try {
      const { script } = req.body;
      const ai = getAiClient(req);

      const response = await ai.models.generateContent({ 
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: 'user', parts: [{ text: script }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_PROOFREADER 
        }
      });

      res.json({ editedScript: response.text || '' });
    } catch (error: any) {
      console.error('Error in /api/proofread:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-seo', async (req, res) => {
    try {
      const { script } = req.body;
      const ai = getAiClient(req);

      const response = await ai.models.generateContent({ 
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: 'user', parts: [{ text: `Generate SEO metadata for this script: ${script.substring(0, 5000)}` }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_SEO_OPTIMIZER,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '{}';
      const seoData = JSON.parse(text);
      res.json({ seoData });
    } catch (error: any) {
      console.error('Error in /api/generate-seo:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/categorize-news', async (req, res) => {
    try {
      const { script } = req.body;
      const ai = getAiClient(req);

      const response = await ai.models.generateContent({ 
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: 'user', parts: [{ text: `Categorize this news script: ${script.substring(0, 5000)}` }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_CATEGORIZER
        }
      });

      const category = response.text?.trim() || 'သတင်းဖော်ပြချက် (General News)';
      res.json({ category });
    } catch (error: any) {
      console.error('Error in /api/categorize-news:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/scrape-url', async (req, res) => {
    let browser;
    try {
      const { url } = req.body;
      const puppeteer = await import('puppeteer').then(m => m.default);
      
      browser = await puppeteer.launch({
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // helpful in some container environments
          '--disable-gpu'
        ],
        headless: true
      });

      const page = await browser.newPage();
      
      // Optimization: Block unnecessary resources
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media', 'other'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate with a generous timeout
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 45000 
      });

      // Extra wait for some SPAs
      await new Promise(resolve => setTimeout(resolve, 2000));

      const html = await page.content();
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article || !article.textContent) {
          throw new Error('Could not extract meaningful content from the URL. The page might be protected or empty.');
      }

      res.json({ 
          title: article.title,
          content: article.textContent.trim(),
          excerpt: article.excerpt
      });
    } catch (error: any) {
      console.error('Error in /api/scrape-url:', error);
      res.status(500).json({ error: `Scraping failed: ${error.message}` });
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error('Error closing browser:', e);
        }
      }
    }
  });

  app.post('/api/diagnose-api-status', async (req, res) => {
    try {
      const customKey = req.headers['x-custom-gemini-key'];
      const apiKey = (typeof customKey === 'string' && customKey.trim()) ? customKey.trim() : undefined;
      
      if (!apiKey) {
        return res.json({ 
          status: 'error', 
          reason: 'Gemini API Key ရှာမတွေ့ပါ။', 
          advice: 'Settings တွင် သင့်၏ ကိုယ်ပိုင် Google AI Studio API Key ကို ဦးစွာ ထည့်သွင်းသိမ်းဆည်းပေးပါ။ (No custom or platform API key exists. Enter a personal Gemini API Key)' 
        });
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const testResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: [{ role: 'user', parts: [{ text: 'OK' }] }],
        config: { maxOutputTokens: 2 }
      });
      
      if (testResponse.text) {
        return res.json({ 
          status: 'success', 
          message: 'Gemini API is fully operational.' 
        });
      } else {
        throw new Error('Empty response from model.');
      }
    } catch (error: any) {
      console.error('Diagnostic failed:', error);
      let reason = 'API key မမှန်ကန်ခြင်း (သို့) ချိတ်ဆက်မှု ပြတ်တောက်ခြင်း ဖြစ်နိုင်ပါသည်။ (Invalid key or general connectivity issue)';
      let advice = 'Settings တွင် သင့်၏ API Key အား ပြန်လည် စိစစ်ထည့်သွင်းပေးပါ။ အခမဲ့ API Scale Window Reset ဖြစ်ရန် ၁ မိနစ်ခန့် စောင့်ဆိုင်းပေးပါ။';
      
      if (error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('limit') || error.message?.toLowerCase().includes('exhausted') || error.message?.toLowerCase().includes('429')) {
        reason = 'အခမဲ့ အကြိမ်ရေ ကန့်သတ်ချက် ပြည့်သွားခြင်း (Quota Exhausted / 429 Rate Limit)။';
        advice = 'ဝင်းဒိုး Reset ဖြစ်ရန် ၁ မိနစ် စောင့်ဆိုင်းပေးပါ။ သို့မဟုတ် စည်းကမ်းသတ်မှတ်ချက်လွတ်ကင်းသည့် ကိုယ်ပိုင် API Key တစ်ခုကို ထည့်သွင်းပါ။';
      }
      
      res.json({ 
        status: 'error', 
        reason, 
        advice, 
        errorMessage: error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      console.log(`Catch-all route hit for path: ${req.path}`);
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
