# 🔑 Quick Guide: Add BREVO_API_KEY to Render

## ⚡ Quick Copy-Paste

**Copy this value** (your Brevo API key):
```
YOUR_BREVO_API_KEY_HERE
```

---

## 📝 Step-by-Step Instructions

### 1. Open Render Dashboard
Go to: **https://dashboard.render.com**

### 2. Select Your Service
Click on: **pharmacare-api**

### 3. Go to Environment Tab
Click: **Environment** (in the left sidebar)

### 4. Add New Variable
Click: **"Add Environment Variable"** button

### 5. Enter Key and Value
```
Key:   BREVO_API_KEY
Value: YOUR_BREVO_API_KEY_HERE
```

**⚠️ IMPORTANT**: Copy the value EXACTLY - no spaces before or after!

### 6. Save Changes
Click: **"Save Changes"** button

### 7. Wait for Redeploy
Render will automatically redeploy your service
- Takes ~2-3 minutes
- Watch the "Events" tab for progress
- Wait for "Live" status

---

## ✅ Also Add These (If Missing)

While you're there, also add these two variables:

```
Key:   FROM_EMAIL
Value: dagmawitadeferes@gmail.com
```

```
Key:   FROM_NAME
Value: PharmaCare
```

---

## 🎯 Expected Result

After deployment completes, your Render logs should show:
```
✅ Verification email sent successfully via Brevo API to: user@example.com
   Message ID: <message-id>
```

---

## 🧪 Test It

After adding the key and waiting for redeploy:

1. Go to: https://frontend-1-beta-teal.vercel.app/register
2. Register with your email
3. Check inbox for verification code
4. ✅ Success!

---

**Time to completion**: ~5 minutes total
- 1 minute: Add variables
- 2-3 minutes: Redeploy
- 1 minute: Test

Let's get your email verification working! 🚀

