# 🚨 URGENT: Add Missing SMTP_PASS to Render

## Problem
Your Render backend is **missing the `SMTP_PASS` environment variable**, which is why emails aren't being sent.

## Current Render Environment Variables (from your message)
```
✅ SMTP_HOST=smtp-relay.brevo.com
✅ SMTP_PORT=587
✅ SMTP_SECURE=false
✅ SMTP_USER=9e7d74001@smtp-brevo.com
❌ SMTP_PASS=  **<-- MISSING! This is the problem!**
```

## What You Need to Do RIGHT NOW

### Step 1: Add SMTP_PASS to Render
1. Go to: https://dashboard.render.com
2. Click on your backend service: **pharmacare-api**
3. Click **"Environment"** in the left sidebar
4. Click **"Add Environment Variable"**
5. Add this exact variable:

```
Key:   SMTP_PASS
Value: YOUR_BREVO_API_KEY_HERE
```

6. Click **"Save Changes"**
7. Wait for Render to automatically redeploy (1-2 minutes)

### Step 2: Test Manager Registration Flow
After deployment completes:

1. Open: https://frontend-1-beta-teal.vercel.app/register
2. Fill in the registration form with a **real email address you can access**
3. Click "Register"
4. **Expected result**: 
   - ✅ You should be redirected to `/verify-email` page
   - ✅ You should receive an email with a 6-digit code within 1-2 minutes
5. Enter the 6-digit code on the verification page
6. ✅ Email should be verified successfully

### Step 3: Check Render Logs
After adding `SMTP_PASS`, check the logs:

1. Go to Render dashboard → your service → **Logs** tab
2. Look for this message when someone registers:
   ```
   ✅ Verification code sent to <email>
   ```
3. You should **NOT** see:
   ```
   ⚠️  SMTP not configured - skipping email verification
   ```

## Why This Happened

The backend code checks if SMTP is configured using this function (from `utils/emailService.js`):

```javascript
const isSmtpConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
```

This requires **BOTH** `SMTP_USER` AND `SMTP_PASS` to be set. Since `SMTP_PASS` is missing on Render, the function returns `false`, and emails are skipped.

## Verification Checklist

After adding `SMTP_PASS` to Render, verify:

- [ ] Render shows `SMTP_PASS` in Environment Variables
- [ ] Render deployment completed successfully
- [ ] Backend logs show no more "SMTP not configured" warnings
- [ ] Manager registration redirects to `/verify-email` page
- [ ] Email with 6-digit code is received
- [ ] Verification code works when entered
- [ ] After verification, shows "waiting for admin approval" message

## Troubleshooting

### If emails still don't send after adding SMTP_PASS:

1. **Check Brevo account limits**:
   - Login to: https://app.brevo.com
   - Check if you've hit daily email limit (free tier: 300 emails/day)
   - Check sender reputation

2. **Check Render logs for SMTP errors**:
   - Look for errors like:
     - `EAUTH` = wrong SMTP password
     - `ETIMEDOUT` = connection timeout
     - `ECONNECTION` = can't connect to SMTP server

3. **Verify SMTP credentials are correct**:
   - SMTP_USER should be: `9e7d74001@smtp-brevo.com`
   - SMTP_PASS should be the Brevo API key (starts with `xsmtpsib-`)
   - SMTP_HOST should be: `smtp-relay.brevo.com`
   - SMTP_PORT should be: `587`

### Common Issues:

**Issue**: "EAUTH - Invalid login"
- **Solution**: Double-check the SMTP_PASS value matches exactly (no extra spaces)

**Issue**: "ETIMEDOUT - Connection timeout"
- **Solution**: Check if Brevo's SMTP service is up at https://status.brevo.com

**Issue**: Still showing verification code on frontend
- **Solution**: This is a fallback when email fails. Once SMTP_PASS is added, emails will be sent instead

## Expected Flow After Fix

### Manager Registration:
1. Manager fills registration form → Submit
2. ✅ Account created in database (inactive, unverified)
3. ✅ Email sent with 6-digit verification code
4. ✅ Frontend redirects to `/verify-email` page
5. Manager enters code → Email verified
6. Manager waits for admin to activate account
7. Admin activates → Manager can login

### Staff Creation (by Manager):
1. Manager creates Pharmacist/Cashier
2. ✅ Email sent with verification code
3. ✅ Manager verifies staff email using code
4. ✅ Staff account activated
5. Staff can login with credentials

## Summary

**What's Wrong**: `SMTP_PASS` is missing from Render environment variables

**What to Do**: Add `SMTP_PASS=YOUR_BREVO_API_KEY_HERE` to Render

**Expected Result**: Emails will be sent successfully, users will receive verification codes

---

**DO THIS NOW** and let me know once you've added the variable and Render has redeployed. Then we can test the registration flow together.
