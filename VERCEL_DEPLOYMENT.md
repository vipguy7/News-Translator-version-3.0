# News Translator App - Vercel Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18+
- Vercel Account
- Gemini API Key

---

## **Step 1: Deploy to Vercel**

### Option A: Using Vercel Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Import the repository: `https://github.com/vipguy7/News-Translator-version-3.0`
4. Click **"Import"**
5. Configure project settings:
   - **Project Name**: `news-translator-app`
   - **Framework**: Vite
   - **Root Directory**: `./`

### Option B: Using Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy
vercel
```

---

## **Step 2: Set Environment Variables**

### In Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variables:

| Variable | Value | Scope |
|----------|-------|-------|
| `GEMINI_API_KEY` | Your API key from [Google AI Studio](https://aistudio.google.com) | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

### For Local Development:
Create `.env.local` file:
```env
GEMINI_API_KEY=your-api-key-here
VITE_API_BASE_URL=http://localhost:5173
```

---

## **Step 3: Build & Deployment Settings**

### Build Command
```bash
npm run build
```

### Start Command
```bash
npm run start
```

### Output Directory
```
dist
```

These are pre-configured in `vercel.json`.

---

## **Step 4: Optimize for Production**

### Performance Checklist:
- ✅ **Tree Shaking**: Vite automatically removes unused code
- ✅ **Code Splitting**: React components are lazy-loaded
- ✅ **Compression**: Vercel handles gzip compression
- ✅ **Caching**: Static assets cached with long TTL
- ✅ **API Optimization**: Server-side rendering via Express

### Light-Weight Optimizations:
```typescript
// server.ts - Keep serverless functions under 50MB
const MAX_PAYLOAD_SIZE = '10mb';
app.use(express.json({ limit: MAX_PAYLOAD_SIZE }));
```

---

## **Step 5: Monitor & Debug**

### Check Deployment Status:
```bash
vercel list
vercel logs [project-name]
```

### View Build Logs:
1. Vercel Dashboard → **Deployments** tab
2. Click latest deployment
3. View build & runtime logs

### Troubleshoot Common Issues:

| Issue | Solution |
|-------|----------|
| Build timeout | Increase `maxDuration` in `vercel.json` |
| API key not found | Verify env variables in Vercel dashboard |
| Module not found | Run `npm install` locally, commit `package-lock.json` |
| Port conflicts | Vercel auto-assigns ports (ignore local port 3000) |

---

## **Step 6: Custom Domain (Optional)**

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain
4. Update DNS records (Vercel provides instructions)
5. SSL certificate auto-provisioned (free)

---

## **Step 7: CI/CD Pipeline**

Vercel auto-deploys on:
- ✅ Push to `main` branch (Production)
- ✅ Push to other branches (Preview URL)
- ✅ Pull requests (Automatic preview)

### Disable Auto-Deploy:
**Settings** → **Git** → Toggle "Deploy on every push"

---

## **API Endpoints Available**

Once deployed, access:
- **Frontend**: `https://your-domain.vercel.app`
- **API**: `https://your-domain.vercel.app/api/*`

---

## **Performance Metrics**

Check Vercel Analytics:
1. **Dashboard** → **Analytics** tab
2. Monitor:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Response times

**Target Metrics:**
- FCP < 1.8s
- LCP < 2.5s
- API response < 500ms

---

## **Next Steps**

1. ✅ Deploy to Vercel
2. ✅ Set Gemini API key
3. ✅ Test all features
4. ✅ Monitor performance
5. ✅ Setup custom domain
6. ✅ Configure CI/CD rules

**Deploy URL**: https://your-project.vercel.app

---

## **Support Resources**

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Configuration](https://vitejs.dev/config/)
- [Google Gemini API Docs](https://ai.google.dev)
- [Express.js Guide](https://expressjs.com)
