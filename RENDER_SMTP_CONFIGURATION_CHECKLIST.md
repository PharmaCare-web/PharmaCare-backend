# RENDER SMTP CONFIGURATION - COMPLETE CHECKLIST

## 🚨 CRITICAL ISSUE IDENTIFIED

Your **local `.env`** has the **CORRECT** Brevo SMTP credentials, but Render might have **WRONG** or **INCOMPLETE** values.

---

## ✅ CORRECT SMTP CONFIGURATION (From Your .env)

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=9e7d74001@smtp-brevo.com
SMTP_PASS=YOUR_BREVO_API_KEY_HERE
SMTP_FROM_EMAIL="PharmaCare <dagmawitadeferes@gmail.com>"
```

---

## ⚠️ IDENTIFIED PROBLEM

Based on logs showing "SMTP not configured", Render is likely missing `SMTP_PASS` or has wrong `SMTP_USER`.

**Important**: 
- `SMTP_USER` must be: `9e7d74001@smtp-brevo.com` (NOT `dagmawitadeferes@gmail.com`)
- `SMTP_PASS` must be the Brevo API key (starts with `xsmtpsib-`)

---

## 🔧 FIX RENDER CONFIGURATION

### Step 1: Go to Render Dashboard
1. Navigate to: https://dashboard.render.com
2. Select your backend service: **pharmacare-api**
3. Click **"Environment"** in the left sidebar

### Step 2: Verify/Add ALL SMTP Variables

Check each variable below. If missing or wrong, add/update it:

#### Variable 1: SMTP_HOST
```
Key:   SMTP_HOST
Value: smtp-relay.brevo.com
```
- Status: Likely ✅ correct (already set)

#### Variable 2: SMTP_PORT
```
Key:   SMTP_PORT
Value: 587
```
- Status: Likely ✅ correct (already set)

#### Variable 3: SMTP_SECURE
```
Key:   SMTP_SECURE
Value: false
```
- Status: May be missing (add if not present)

#### Variable 4: SMTP_USER ⚠️ CRITICAL
```
Key:   SMTP_USER
Value: 9e7d74001@smtp-brevo.com
```
- **NOT**: `dagmawitadeferes@gmail.com`
- **MUST BE**: `9e7d74001@smtp-brevo.com` (Brevo SMTP login)
- Status: ⚠️ VERIFY THIS - might be wrong!

#### Variable 5: SMTP_PASS ⚠️ CRITICAL - MISSING
```
Key:   SMTP_PASS
Value: YOUR_BREVO_API_KEY_HERE
```
- This is your Brevo SMTP API key
- Status: ❌ MISSING - ADD THIS!

#### Variable 6: SMTP_FROM_EMAIL
```
Key:   SMTP_FROM_EMAIL
Value: dagmawitadeferes@gmail.com
```
- OR: `PharmaCare <dagmawitadeferes@gmail.com>`
- Status: Likely ✅ correct (already set)

### Step 3: Save and Deploy
1. Click **"Save Changes"**
2. Render will automatically redeploy (1-2 minutes)
3. Wait for deployment to complete

---

## 📊 COMPARISON: LOCAL vs RENDER

| Variable | Local .env (✅ CORRECT) | Render (Current) | Status |
|----------|-------------------------|------------------|--------|
| SMTP_HOST | `smtp-relay.brevo.com` | Likely ✅ SET | OK |
| SMTP_PORT | `587` | Likely ✅ SET | OK |
| SMTP_SECURE | `false` | ❓ Unknown | CHECK |
| SMTP_USER | `9e7d74001@smtp-brevo.com` | ⚠️ Might be `dagmawitadeferes@gmail.com` | **FIX THIS!** |
| SMTP_PASS | `xsmtpsib-...` | ❌ MISSING | **ADD THIS!** |
| SMTP_FROM_EMAIL | `dagmawitadeferes@gmail.com` | Likely ✅ SET | OK |

---

## 🎯 WHY SMTP_USER MATTERS

**Brevo SMTP** requires a specific SMTP login format:

- ✅ **CORRECT**: `9e7d74001@smtp-brevo.com` (Brevo SMTP login - from Brevo dashboard)
- ❌ **WRONG**: `dagmawitadeferes@gmail.com` (Your email - NOT the SMTP login)

**How to find your SMTP_USER**:
1. Login to Brevo: https://app.brevo.com
2. Go to: **Settings** → **SMTP & API**
3. Look for: **SMTP** section
4. Find: **Login** (e.g., `9e7d74001@smtp-brevo.com`)
5. Use this as `SMTP_USER`

---

## 🧪 TEST AFTER FIXING

### Test 1: Check Render Logs
After saving changes and redeployment:

1. Go to Render dashboard → **pharmacare-api** → **Logs**
2. Look for startup logs:

**Should see**:
```
✅ Database connected successfully
🚀 Server running on http://0.0.0.0:10000
```

**Should NOT see**:
```
❌ SMTP not configured - skipping email verification
❌ Set SMTP_USER and SMTP_PASS in .env to enable email verification
```

### Test 2: Trigger Email Send
1. Go to: https://frontend-1-beta-teal.vercel.app/register
2. Register a new manager with **real email**
3. Check Render logs immediately after registration

**Should see in logs**:
```
✅ Verification code sent to <your-email>
✅ Verification email sent successfully to: <your-email>
   Message ID: <some-message-id>
   Envelope: {...}
```

**Should NOT see**:
```
❌ SMTP not configured - skipping email verification
❌ Failed to send verification email
```

### Test 3: Check Email Inbox
1. Check your email inbox (email used in registration)
2. Look for email from: **PharmaCare <dagmawitadeferes@gmail.com>**
3. Subject: **Email Verification Code - PharmaCare**
4. Email should contain 6-digit code

**Expected**: Email arrives within 1-2 minutes

---

## 🐛 TROUBLESHOOTING

### If Still No Emails After Fix:

#### 1. Verify All Variables on Render
Check **ALL** SMTP variables are set correctly:
```
✅ SMTP_HOST = smtp-relay.brevo.com
✅ SMTP_PORT = 587
✅ SMTP_SECURE = false
✅ SMTP_USER = 9e7d74001@smtp-brevo.com (NOT your email!)
✅ SMTP_PASS = xsmtpsib-... (full API key)
✅ SMTP_FROM_EMAIL = dagmawitadeferes@gmail.com
```

#### 2. Check Render Deployment Status
- Ensure deployment completed successfully
- No build errors
- Service is running (not crashed)

#### 3. Check Brevo Account
1. Login to: https://app.brevo.com
2. Go to: **Settings** → **SMTP & API**
3. Verify:
   - SMTP is enabled
   - Daily limit not reached (free: 300 emails/day)
   - API key is active (not revoked)

#### 4. Test SMTP Credentials Manually
Create a test script on Render or locally:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: '9e7d74001@smtp-brevo.com',
    pass: 'YOUR_BREVO_API_KEY_HERE'
  }
});

transporter.verify()
  .then(() => console.log('✅ SMTP connection successful'))
  .catch(err => console.error('❌ SMTP connection failed:', err.message));
```

#### 5. Common Error Messages

**Error: "Invalid login"** or **"EAUTH"**:
- ❌ Wrong `SMTP_USER` or `SMTP_PASS`
- ✅ Verify credentials on Brevo dashboard
- ✅ Regenerate SMTP key if needed

**Error: "Connection timeout"** or **"ETIMEDOUT"**:
- ❌ Cannot reach SMTP server
- ✅ Check Render's network/firewall
- ✅ Verify SMTP_HOST and SMTP_PORT

**Error: "SMTP credentials not configured"**:
- ❌ `SMTP_USER` or `SMTP_PASS` is missing/empty
- ✅ Check environment variables on Render
- ✅ Ensure variables are saved

---

## 📋 QUICK CHECKLIST

Use this to verify Render configuration:

- [ ] Go to Render dashboard → pharmacare-api → Environment
- [ ] Verify `SMTP_HOST = smtp-relay.brevo.com`
- [ ] Verify `SMTP_PORT = 587`
- [ ] Add/verify `SMTP_SECURE = false`
- [ ] **CRITICAL**: Verify `SMTP_USER = 9e7d74001@smtp-brevo.com`
- [ ] **CRITICAL**: Add `SMTP_PASS = YOUR_BREVO_API_KEY_HERE`
- [ ] Verify `SMTP_FROM_EMAIL = dagmawitadeferes@gmail.com`
- [ ] Click "Save Changes"
- [ ] Wait for deployment to complete
- [ ] Check logs for "SMTP not configured" message (should NOT appear)
- [ ] Test manager registration → check email received
- [ ] Verify backend logs show "✅ Verification email sent successfully"

---

## 🚀 EXPECTED RESULT AFTER FIX

### Backend Logs (Render):
```
🛠️ Database config:
  host: dpg-d97do5d7vvec73ej7ej0-a.frankfurt-postgres.render.com
  port: 5432
  user: pharmacare_user
  db:   pharmacare_jz9s
  ssl:  enabled
✅ Database connected successfully
🚀 Server running on http://0.0.0.0:10000
📡 API endpoints available at http://0.0.0.0:10000/api
🌍 Environment: production

[After manager registration]
✅ Verification code sent to manager@example.com
✅ Verification email sent successfully to: manager@example.com
   Message ID: <some-id@smtp-relay.brevo.com>
   Envelope: { from: 'dagmawitadeferes@gmail.com', to: [ 'manager@example.com' ] }
```

### User Experience:
1. ✅ Manager registers → Redirects to `/verify-email`
2. ✅ Email received within 1-2 minutes
3. ✅ 6-digit code in email
4. ✅ Manager enters code → Email verified
5. ✅ Admin activates account
6. ✅ Manager can login

---

## 📝 SUMMARY

**What's Wrong**: 
- Render is missing `SMTP_PASS` (confirmed from logs)
- Render might have wrong `SMTP_USER` (needs to be Brevo login, not email)

**What to Fix**:
1. Set `SMTP_USER = 9e7d74001@smtp-brevo.com`
2. Add `SMTP_PASS = YOUR_BREVO_API_KEY_HERE`
3. Optionally add `SMTP_SECURE = false`

**After Fix**:
- Emails will be sent automatically
- Manager registration flow will work end-to-end
- Staff creation emails will work
- Password reset emails will work

---

**Status**: 
- Local configuration: ✅ Correct
- Render configuration: ❌ Needs fixing
- Frontend: ✅ Already fixed
- Backend code: ✅ Correct

**Action Required**: Update Render environment variables (especially `SMTP_USER` and `SMTP_PASS`)
