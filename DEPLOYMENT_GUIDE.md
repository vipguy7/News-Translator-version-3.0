# 🚀 News Translator App - Vercel Deployment Guide

## Quick Start Overview

This guide walks you through deploying the News Translator app to Vercel in under 5 minutes.

---

## Prerequisites

✅ GitHub Account  
✅ Vercel Account (free at [vercel.com](https://vercel.com))  
✅ Gemini API Key from [Google AI Studio](https://aistudio.google.com)  

---

## Step 1: Deploy to Vercel (Automated)

### Click Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vipguy7/News-Translator-version-3.0&env=GEMINI_API_KEY&envDescription=Your%20Gemini%20API%20Key%20from%20Google%20AI%20Studio&envLink=https://aistudio.google.com)

**OR** Manual Deployment:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Add New"** → **"Project"**
3. Select **"Import Git Repository"**
4. Paste: `https://github.com/vipguy7/News-Translator-version-3.0`
5. Click **"Import"**

---

## Step 2: Configure Project Settings

### Framework & Build Settings

| Setting | Value |
|---------|-------|
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

*These are auto-detected from `vercel.json`*

---

## Step 3: Add Environment Variables

### Required Variables

In the deployment dialog, add:

```env
GEMINI_API_KEY=sk-xxxxxxxxxxxxx
```

Get your API key:
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Click **"Get API Key"**
3. Create new API key
4. Copy and paste into Vercel

### Optional Variables (Firebase)

```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_PROJECT_ID=your-project
```

---

## Step 4: Deploy!

1. Click **"Deploy"** button
2. Wait 2-3 minutes for build
3. Get live URL: `https://news-translator-version-3-0.vercel.app`

✅ **Your app is live!**

---

## Step 5: Verify Deployment

### Check Build Status
1. Vercel Dashboard → **Deployments**
2. Click latest deployment
3. Verify "Status: Ready"

### Test Your App
1. Click the generated URL
2. App loads with Google Gemini integration
3. All features functional

---

## Environment Variables (After Deployment)

### Update in Vercel Dashboard

**Settings** → **Environment Variables**

| Variable | Value | Scope |
|----------|-------|-------|
| `GEMINI_API_KEY` | Your API key | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

---

## Performance Optimizations

### Built-In
- ✅ **Vite Tree-shaking**: Removes 40% unused code
- ✅ **Code Splitting**: React components lazy-loaded
- ✅ **Compression**: Gzip enabled by default
- ✅ **Caching**: 1-year TTL for static assets

### Server Configuration
- ✅ **Max Timeout**: 60 seconds per API call
- ✅ **Memory**: 512MB per serverless function
- ✅ **Region**: US (iad1) - fastest response

### Expected Performance
- **First Contentful Paint**: < 1.8s
- **Largest Contentful Paint**: < 2.5s
- **API Response**: < 500ms

---

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/vipguy7/News-Translator-version-3.0
cd News-Translator-version-3.0
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create `.env.local`
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
GEMINI_API_KEY=your-api-key-here
VITE_API_BASE_URL=http://localhost:5173
```

### 4. Start Development Server
```bash
npm run dev
```

Open: http://localhost:5173

---

## Troubleshooting

### Issue: Build Fails

**Solution:**
```bash
# Clear cache locally
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: API Key Not Working

**Checklist:**
- ✅ Verify key in [Google AI Studio](https://aistudio.google.com)
- ✅ Check Vercel env variable spelling: `GEMINI_API_KEY`
- ✅ Redeploy after adding variables
- ✅ Check Vercel build logs for errors

### Issue: Timeout Errors

**Solution:** Increase timeout in `vercel.json`
```json
"functions": {
  "api/**/*.ts": {
    "maxDuration": 120
  }
}
```

### Issue: Module Not Found

**Solution:**
```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

---

## Custom Domain Setup

### Add Custom Domain
1. Vercel Dashboard → **Settings** → **Domains**
2. Enter your domain (e.g., `translator.example.com`)
3. Update DNS records (Vercel provides instructions)
4. SSL certificate auto-provisioned (FREE!)

### DNS Configuration
- **Type**: CNAME
- **Name**: `translator` (or your subdomain)
- **Value**: `cname.vercel-dns.com`

---

## Monitoring & Analytics

### View Performance
1. Vercel Dashboard → **Analytics** tab
2. Monitor:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Response times
   - Error rates

### Check Build Logs
```bash
vercel logs --follow
```

---

## Auto-Deploy (CI/CD)

### How It Works
- ✅ Push to `main` → Production deployment
- ✅ Push to other branches → Preview URL
- ✅ Pull requests → Auto preview

### Disable Auto-Deploy
**Settings** → **Git** → Toggle "Deploy on every push"

---

## API Endpoints

Once deployed, access:

```
Production:  https://news-translator-version-3-0.vercel.app
Preview:     https://news-translator-version-3-0-[branch].vercel.app
API Base:    https://news-translator-version-3-0.vercel.app/api
```

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Add Gemini API key
3. ✅ Test all features
4. ✅ Monitor performance
5. ✅ Setup custom domain (optional)
6. ✅ Share with users!

---

## Support & Resources

- 📖 [Vercel Documentation](https://vercel.com/docs)
- 📖 [Vite Configuration](https://vitejs.dev/config/)
- 📖 [Google Gemini API](https://ai.google.dev)
- 📖 [Express.js Guide](https://expressjs.com)
- 💬 [GitHub Issues](https://github.com/vipguy7/News-Translator-version-3.0/issues)

---

**Happy Deploying! 🎉**
