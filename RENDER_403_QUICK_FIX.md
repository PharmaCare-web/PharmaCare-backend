# ⚡ Quick Fix: Render 403 Error

## Problem
Render shows: `fatal: unable to access... error: 403`

## ✅ Quick Fix (2 minutes)

### Step 1: Go to Render
Open: https://dashboard.render.com

### Step 2: Select Your Service
Click on: **pharmacare-api**

### Step 3: Manual Deploy
1. Look for **"Manual Deploy"** button (top right, blue button)
2. Click it
3. Select: **"Clear build cache & deploy"**
4. Click: **"Deploy"**

### Step 4: Wait
- Deployment takes 1-2 minutes
- Watch the logs - should see successful clone now
- Should deploy without 403 error

---

## ✅ Alternative: Reconnect GitHub

If manual deploy doesn't work:

### Option A: In Render Dashboard
1. Go to **pharmacare-api** → **Settings**
2. Find **"Source Repo"** section
3. Click **"Connect Repository"** (if disconnected)
4. Select your repo again
5. Auto-redeploys

### Option B: In GitHub Settings
1. Go to: https://github.com/settings/installations
2. Find **Render** app
3. Click **"Configure"**
4. Make sure **PharmaCare-backend** has access
5. Save

---

## 🎯 Expected Result

After fix:
- ✅ Deployment succeeds
- ✅ No 403 errors
- ✅ Service shows "Live"
- ✅ Can test email functionality

---

**Do this now**: Try Manual Deploy first!
