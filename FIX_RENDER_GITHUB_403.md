# 🔧 Fix Render GitHub 403 Error

## Problem
Render is unable to clone your GitHub repository:
```
fatal: unable to access 'https://github.com/PharmaCare-web/PharmaCare-backend/': 
The requested URL returned error: 403
```

## Root Causes
1. Render lost connection to GitHub
2. GitHub repository permissions changed
3. Render service needs to reconnect to GitHub

---

## ✅ Solution: Reconnect Render to GitHub

### Option 1: Manual Redeploy (Quick Fix)

1. Go to: https://dashboard.render.com
2. Click on **pharmacare-api**
3. Click **"Manual Deploy"** button (top right)
4. Select **"Clear build cache & deploy"**
5. Click **"Deploy"**

This forces Render to use cached authentication.

---

### Option 2: Reconnect GitHub Integration (Recommended)

#### Step 1: Check GitHub Connection
1. Go to: https://dashboard.render.com
2. Click on **pharmacare-api**
3. Click **"Settings"** tab
4. Scroll to **"Source Repo"** section
5. Check if repository is still connected

#### Step 2: Reconnect if Needed
If repository shows as disconnected:

1. Click **"Connect Repository"**
2. Authorize Render to access GitHub
3. Select **PharmaCare-web/PharmaCare-backend**
4. Click **"Connect"**
5. Render will automatically redeploy

---

### Option 3: Check GitHub Repository Permissions

#### Verify Repository is Public or Accessible

1. Go to: https://github.com/PharmaCare-web/PharmaCare-backend
2. Click **"Settings"** (repo settings, not your account)
3. Scroll to **"Danger Zone"**
4. Check if repository is **Public** or **Private**

**If Private**:
- Go to: https://dashboard.render.com/select-repo
- Click **"Configure account"** next to GitHub
- Make sure **PharmaCare-web** organization has Render app installed
- Grant access to **PharmaCare-backend** repository

**If Public**:
- The 403 error shouldn't happen
- Try Option 1 (Manual Redeploy)

---

### Option 4: Check Render GitHub App Installation

1. Go to: https://github.com/settings/installations
2. Find **Render** in the list
3. Click **"Configure"**
4. Under **"Repository access"**, verify:
   - Either "All repositories" is selected
   - OR **PharmaCare-backend** is in the selected list
5. If not, add it and save

---

## 🚀 Quick Fix Steps (Try This First)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click**: pharmacare-api
3. **Click**: "Manual Deploy" (top right, blue button)
4. **Select**: "Clear build cache & deploy"
5. **Click**: "Deploy"
6. **Wait**: 1-2 minutes for deployment

This usually fixes the 403 error by forcing Render to re-authenticate.

---

## ✅ Verify Fix

After redeployment, check:

1. **Deployment Status**: Should show "Live" with green checkmark
2. **Logs**: Should show successful build
3. **No 403 errors**: Clone should succeed

---

## 🔍 If Still Not Working

### Check Render Logs
Look for specific error details:
```
fatal: unable to access...
fatal: repository not found
fatal: authentication failed
```

### Alternative: Use Deploy Hook

If GitHub connection is completely broken:

1. Go to Render dashboard → **pharmacare-api** → **Settings**
2. Find **"Deploy Hook"** section
3. Copy the deploy hook URL
4. In your local terminal, run:
   ```bash
   curl [DEPLOY_HOOK_URL]
   ```

This triggers deployment without GitHub connection.

---

## 📝 Summary

**Problem**: Render can't access GitHub repo (403 error)

**Quick Fix**: Manual deploy with cache clear

**Full Fix**: Reconnect GitHub integration

**Time**: 2-5 minutes

---

**Action Required**: Try Manual Deploy first! (See Quick Fix Steps above)
