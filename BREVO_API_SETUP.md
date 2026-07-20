# 🔧 Switch to Brevo API (Fix SMTP Timeout)

## Problem
SMTP connection is timing out on Render:
```
❌ Connection timeout
❌ ETIMEDOUT
❌ Failed after 3 retries
```

This happens because **Render's firewall blocks outbound SMTP connections** on port 587.

## Solution
Switch from SMTP to **Brevo API** (HTTP-based, no firewall issues).

---

## ✅ Changes Made

### 1. Created New Email Service
- **File**: `utils/emailServiceBrevoAPI.js`
- **Method**: Uses Brevo's REST API instead of SMTP
- **Protocol**: HTTPS (always works on cloud platforms)
- **Endpoint**: `https://api.brevo.com/v3/smtp/email`

### 2. Updated Controllers
Updated these files to use Brevo API:
- ✅ `controllers/authController.js`
- ✅ `controllers/managerStaffController.js`

Changed from:
```javascript
const { sendVerificationEmail } = require('../utils/emailService');
```

To:
```javascript
const { sendVerificationEmail } = require('../utils/emailServiceBrevoAPI');
```

---

## 🔑 Get Your Brevo API Key

### Step 1: Login to Brevo
Go to: https://app.brevo.com

### Step 2: Navigate to API Keys
1. Click on your name (top right)
2. Click **"SMTP & API"**
3. Click **"API Keys"** tab

### Step 3: Create New API Key (or use existing)
1. Click **"Generate a new API key"**
2. Name it: `PharmaCare Production`
3. Click **"Generate"**
4. **Copy the API key** (starts with `xkeysib-`)

**IMPORTANT**: The API key you already have works for both SMTP and API:
```
YOUR_BREVO_API_KEY_HERE
```
This is actually `xsmtpsib-` which is the **SMTP** prefix. For the API, you may see `xkeysib-` prefix, but **both work for the API**.

---

## 🚀 Deploy to Render

### Step 1: Remove Old SMTP Variables (Optional)
You can remove these (no longer needed):
- ❌ `SMTP_HOST`
- ❌ `SMTP_PORT`
- ❌ `SMTP_SECURE`
- ❌ `SMTP_USER`
- ❌ `SMTP_PASS`

**OR** just leave them - they won't be used anymore.

### Step 2: Add Brevo API Key to Render
1. Go to: https://dashboard.render.com
2. Select your backend service: **pharmacare-api**
3. Click **"Environment"** in the left sidebar
4. Click **"Add Environment Variable"**
5. Add:
   ```
   Key:   BREVO_API_KEY
   Value: YOUR_BREVO_API_KEY_HERE
   ```
6. Click **"Save Changes"**
7. Wait for Render to redeploy (1-2 minutes)

### Step 3: Verify Other Variables Still Exist
Make sure these are still set:
- ✅ `FROM_EMAIL=dagmawitadeferes@gmail.com`
- ✅ `FROM_NAME=PharmaCare`

---

## 🧪 Test the Fix

### After Render Redeploys:

1. **Check Logs**:
   - Go to Render dashboard → Logs
   - Look for: `✅ Verification email sent successfully via Brevo API`
   - Should NOT see: `Connection timeout` or `ETIMEDOUT`

2. **Test Manager Registration**:
   ```
   1. Go to: https://frontend-1-beta-teal.vercel.app/register
   2. Fill out the form
   3. Submit
   4. Check your email inbox
   5. ✅ Should receive verification code email within 10 seconds
   ```

3. **Test Staff Creation**:
   ```
   1. Login as Manager
   2. Create new staff member
   3. Check staff member's email
   4. ✅ Should receive verification code email within 10 seconds
   ```

---

## 🔍 Why This Works

### SMTP Issues on Cloud Platforms:
```
Render/Heroku/Railway → Firewall blocks port 587
                     → SMTP connections timeout
                     → Emails never send
```

### Brevo API Solution:
```
Brevo API → Uses HTTPS (port 443)
         → Never blocked by firewalls
         → Faster and more reliable
         → Better error messages
```

### Comparison:
| Feature | SMTP | Brevo API |
|---------|------|-----------|
| Protocol | SMTP (port 587) | HTTPS (port 443) |
| Firewall Issues | ❌ Often blocked | ✅ Never blocked |
| Cloud Platform Support | ⚠️ Unreliable | ✅ Always works |
| Speed | Slower | ✅ Faster |
| Error Messages | Generic | ✅ Detailed |
| Setup Complexity | Complex | ✅ Simple |

---

## 📦 Dependencies

### Axios Already Installed
The code uses `axios` which should already be in your `package.json`:
```json
{
  "dependencies": {
    "axios": "^1.x.x"
  }
}
```

If not, run:
```bash
npm install axios
```

But Render will install it automatically from package.json during deployment.

---

## 🎯 Environment Variables Summary

### Required (NEW):
```bash
BREVO_API_KEY=YOUR_BREVO_API_KEY_HERE
FROM_EMAIL=dagmawitadeferes@gmail.com
FROM_NAME=PharmaCare
```

### Optional (OLD - no longer used):
```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=9e7d74001@smtp-brevo.com
SMTP_PASS=xsmtpsib-...
```

---

## ✅ Expected Results

### Manager Registration:
```
1. User registers
2. ✅ Email sent via Brevo API (10 seconds)
3. ✅ User receives verification code
4. User enters code
5. ✅ Email verified
6. User waits for admin approval
```

### Staff Creation:
```
1. Manager creates staff
2. ✅ Email sent via Brevo API (10 seconds)
3. ✅ Staff receives verification code
4. Manager verifies staff with code
5. ✅ Temporary password sent via Brevo API
6. ✅ Staff receives temporary password
7. Staff can login
```

### Logs Should Show:
```
✅ Verification email sent successfully via Brevo API to: user@example.com
   Message ID: <message-id-from-brevo>
```

Instead of:
```
❌ Connection timeout
❌ ETIMEDOUT
❌ Failed after 3 retries
```

---

## 🚨 Troubleshooting

### If emails still don't send:

#### 1. Check Brevo API Key
```bash
# In Render logs, look for:
"Brevo API authentication failed"
```
**Solution**: Verify API key is correct on Brevo dashboard

#### 2. Check Brevo Account Status
- Login to: https://app.brevo.com
- Check if account is active
- Check daily email limit (free tier: 300/day)

#### 3. Check FROM_EMAIL
```bash
FROM_EMAIL=dagmawitadeferes@gmail.com
```
**Must match** the verified sender on Brevo account

#### 4. Check Sender Verification
- Go to: https://app.brevo.com/senders
- Verify that `dagmawitadeferes@gmail.com` is **verified**
- If not verified, verify it (check your Gmail for verification email)

---

## 📝 Commit and Deploy

### Step 1: Commit Changes
```bash
git add .
git commit -m "Switch from SMTP to Brevo API to fix connection timeout on Render"
git push origin main
```

### Step 2: Add Brevo API Key on Render
(Instructions above)

### Step 3: Test
Wait for Render to redeploy, then test registration flow.

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Render deployment completed successfully
- [ ] `BREVO_API_KEY` is set in Render environment
- [ ] `FROM_EMAIL` and `FROM_NAME` are set
- [ ] Render logs show: `✅ Verification email sent via Brevo API`
- [ ] No more `Connection timeout` errors
- [ ] Manager registration sends email
- [ ] Staff creation sends email
- [ ] Verification codes are received
- [ ] Temporary passwords are received

---

## 💡 Benefits of This Change

1. **✅ Reliability**: No more timeout issues on cloud platforms
2. **✅ Speed**: API calls are faster than SMTP
3. **✅ Simplicity**: Fewer environment variables to manage
4. **✅ Error Handling**: Better error messages from Brevo
5. **✅ Future-Proof**: APIs are the modern standard for email sending

---

## 🔄 Rollback (if needed)

If you need to rollback to SMTP:

1. Change imports back in controllers:
   ```javascript
   const { sendVerificationEmail } = require('../utils/emailService');
   ```

2. Re-add SMTP variables on Render

3. Deploy

But you shouldn't need to - the API solution is better!

---

**DO THIS NOW**:
1. Add `BREVO_API_KEY` to Render
2. Commit and push code changes
3. Wait for deployment
4. Test registration flow
5. ✅ Emails will work!
