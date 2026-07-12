# 🚀 Deploy PharmaCare Frontend

Your backend is already deployed at: **https://pharmacare-api.onrender.com**

Now let's deploy the frontend!

---

## Option 1: Deploy to Vercel (Recommended - Free & Easy)

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Test Locally

```bash
npm run dev
```

Open http://localhost:3000 and test that it connects to the deployed backend.

### Step 3: Build for Production

```bash
npm run build
```

This creates an optimized build in `frontend/dist/`

### Step 4: Deploy to Vercel

**Option A - Using Vercel CLI:**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from frontend directory)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? pharmacare-frontend
# - Directory? ./ (current)
# - Override settings? No

# Deploy to production
vercel --prod
```

**Option B - Using Vercel Website:**

1. Go to https://vercel.com/
2. Sign in with GitHub/GitLab/Bitbucket
3. Click "Add New" → "Project"
4. Import your repository
5. Configure:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://pharmacare-api.onrender.com`
7. Click "Deploy"

### Step 5: Update Backend CORS

After deployment, update your backend's `.env` on Render:

```env
FRONTEND_URL=https://your-frontend.vercel.app
```

Go to your Render dashboard → pharmacare-api → Environment → Add:
- Key: `FRONTEND_URL`
- Value: `https://your-frontend.vercel.app`

Then redeploy the backend.

---

## Option 2: Deploy to Netlify

### Step 1: Build

```bash
cd frontend
npm install
npm run build
```

### Step 2: Deploy

**Option A - Using Netlify CLI:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
netlify deploy

# Deploy to production
netlify deploy --prod --dir=dist
```

**Option B - Using Netlify Website:**

1. Go to https://www.netlify.com/
2. Sign in
3. Click "Add new site" → "Deploy manually"
4. Drag and drop the `frontend/dist` folder
5. Configure environment variables:
   - Go to Site settings → Environment variables
   - Add: `VITE_API_URL` = `https://pharmacare-api.onrender.com`

### Step 3: Update Backend CORS

Same as Vercel - add your Netlify URL to backend's `FRONTEND_URL`

---

## Option 3: Deploy to Render (Static Site)

### Step 1: Create render.yaml in frontend folder

```yaml
services:
  - type: web
    name: pharmacare-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_API_URL
        value: https://pharmacare-api.onrender.com
```

### Step 2: Deploy

1. Push your code to GitHub
2. Go to Render dashboard
3. New → Static Site
4. Connect your repository
5. Set root directory: `frontend`
6. Deploy

---

## Option 4: Serve from Backend (All-in-One)

Deploy frontend and backend together on Render.

### Step 1: Build Frontend

```bash
cd frontend
npm install
npm run build
```

### Step 2: Copy Build to Backend

```bash
# From root directory
cp -r frontend/dist/* ./public/
```

Or on Windows:
```cmd
xcopy /E /I frontend\dist public
```

### Step 3: Update Backend server.js

Your `server.js` already has this configured:
```javascript
// Serve static files from frontend
app.use(express.static(path.join(__dirname, 'frontend/dist')));
```

### Step 4: Deploy to Render

Push to GitHub and redeploy your backend. The frontend will be served at:
**https://pharmacare-api.onrender.com**

---

## Testing Deployment

After deployment, test these URLs:

### Backend
- Health: https://pharmacare-api.onrender.com/api/health
- Auth: https://pharmacare-api.onrender.com/api/auth

### Frontend
- Home: https://your-frontend-url.com
- Login: https://your-frontend-url.com/login

### Test Login Flow
1. Go to your frontend URL
2. Try to login
3. Check browser console for any CORS errors
4. If you see CORS errors, update backend `FRONTEND_URL`

---

## Environment Variables Reference

### Frontend (.env)
```env
VITE_API_URL=https://pharmacare-api.onrender.com
VITE_APP_NAME=PharmaCare
```

### Backend (.env on Render)
```env
# Add your frontend URL
FRONTEND_URL=https://your-frontend.vercel.app

# Or multiple URLs (comma-separated)
FRONTEND_URL=https://your-frontend.vercel.app,https://your-custom-domain.com
```

---

## Custom Domain (Optional)

### Vercel Custom Domain
1. Go to your project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Netlify Custom Domain
1. Go to Site settings → Domain management
2. Add custom domain
3. Update DNS records

---

## Continuous Deployment

### Vercel
- Auto-deploys on git push to main branch
- Preview deployments for pull requests

### Netlify
- Auto-deploys on git push
- Branch deploys for feature branches

### Render
- Auto-deploys on git push
- Can configure deploy hooks

---

## Troubleshooting

### CORS Error
**Problem:** Browser shows "CORS policy" error

**Solution:**
1. Check backend `.env` has correct `FRONTEND_URL`
2. Redeploy backend after updating
3. Clear browser cache

### API Connection Failed
**Problem:** Frontend can't connect to backend

**Solution:**
1. Verify backend is running: https://pharmacare-api.onrender.com/api/health
2. Check `frontend/.env` has correct `VITE_API_URL`
3. Rebuild frontend: `npm run build`
4. Redeploy

### 404 on Page Refresh
**Problem:** Refreshing page shows 404

**Solution for Vercel:**
Create `frontend/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Solution for Netlify:**
Create `frontend/public/_redirects`:
```
/*    /index.html   200
```

### Environment Variables Not Working
**Problem:** `import.meta.env.VITE_API_URL` is undefined

**Solution:**
1. Environment variables must start with `VITE_`
2. Restart dev server after changing `.env`
3. Rebuild for production

---

## Production Checklist

Before deploying to production:

- [ ] Test all pages locally
- [ ] Test login/logout flow
- [ ] Test role-based access
- [ ] Check console for errors
- [ ] Test on mobile devices
- [ ] Optimize images
- [ ] Enable HTTPS
- [ ] Set up custom domain (optional)
- [ ] Configure environment variables
- [ ] Update backend CORS
- [ ] Test API connections
- [ ] Set up error monitoring (optional)
- [ ] Set up analytics (optional)

---

## Cost Estimate

### Free Tier Options
- **Vercel:** Free for personal projects
- **Netlify:** Free with 100GB bandwidth
- **Render Static Site:** Free

### Paid Options (if needed)
- **Vercel Pro:** $20/month
- **Netlify Pro:** $19/month
- **Custom Domain:** $10-15/year

---

## Next Steps

1. ✅ Backend deployed: https://pharmacare-api.onrender.com
2. ⏳ Deploy frontend using one of the options above
3. ⏳ Update backend CORS with frontend URL
4. ⏳ Test the deployed application
5. ⏳ Set up custom domain (optional)

**Recommended:** Use Vercel for fastest and easiest deployment!

---

## Quick Deploy Commands

### For Vercel:
```bash
cd frontend
npm install
npm run build
vercel --prod
```

### For Netlify:
```bash
cd frontend
npm install
npm run build
netlify deploy --prod --dir=dist
```

**That's it! Your PharmaCare application will be live! 🎉**
