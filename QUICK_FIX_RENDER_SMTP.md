# 🚀 QUICK FIX: RENDER SMTP CONFIGURATION

## ⚡ FAST ACTION GUIDE

### 🎯 PROBLEM
Emails not sending because Render is missing SMTP credentials.

### ✅ SOLUTION (5 Minutes)

#### Step 1: Go to Render
Open: https://dashboard.render.com → Select **pharmacare-api** → Click **Environment**

#### Step 2: Add These 3 Variables

Copy and paste these **EXACTLY** into Render:

```
Key:   SMTP_USER
Value: 9e7d74001@smtp-brevo.com
```

```
Key:   SMTP_PASS
Value: YOUR_BREVO_API_KEY_HERE
```

```
Key:   SMTP_SECURE
Value: false
```

#### Step 3: Save
Click **"Save Changes"** → Wait 1-2 minutes for redeploy

---

## 🧪 TEST IT WORKS

### Quick Test:
1. Open: https://frontend-1-beta-teal.vercel.app/register
2. Register with **real email**
3. Check email inbox for verification code
4. ✅ Should receive email within 2 minutes

### Check Render Logs:
Open: Render dashboard → **pharmacare-api** → **Logs**

**Should see**:
```
✅ Verification code sent to <email>
✅ Verification email sent successfully
```

**Should NOT see**:
```
❌ SMTP not configured
```

---

## ⚠️ CRITICAL: SMTP_USER

**MUST BE**: `9e7d74001@smtp-brevo.com` (Brevo SMTP login)

**NOT**: `dagmawitadeferes@gmail.com` (your email)

This is the #1 mistake that causes email failures!

---

## 📋 FULL CONFIGURATION CHECKLIST

If quick fix doesn't work, verify ALL these on Render:

| Variable | Value | Status |
|----------|-------|--------|
| SMTP_HOST | `smtp-relay.brevo.com` | Should already be set |
| SMTP_PORT | `587` | Should already be set |
| **SMTP_USER** | `9e7d74001@smtp-brevo.com` | **ADD/VERIFY THIS** |
| **SMTP_PASS** | `YOUR_BREVO_API_KEY_HERE` | **ADD THIS** |
| SMTP_SECURE | `false` | **ADD THIS** |
| SMTP_FROM_EMAIL | `dagmawitadeferes@gmail.com` | Should already be set |

---

## 🎉 AFTER FIX

✅ Manager registration → Email sent → Email verified → Admin activates → Login works

✅ Staff creation → Email sent → Temporary password sent → Staff can login

✅ Password reset → Email sent → Temporary password sent → User can login

---

**Time to Fix**: 5 minutes  
**Difficulty**: Easy (copy & paste)  
**Impact**: Fixes ALL email functionality 🚀
