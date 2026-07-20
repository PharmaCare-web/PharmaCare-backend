# ADD SMTP_PASS TO RENDER - CRITICAL FIX

## ISSUE
Backend on Render is missing the `SMTP_PASS` environment variable, causing:
- ❌ No verification emails sent to managers after registration
- ❌ Backend logs show: "SMTP not configured - skipping email verification"
- ❌ Users cannot verify their email addresses

## SOLUTION
Add the missing `SMTP_PASS` environment variable to Render.

## STEPS TO FIX

### 1. Go to Render Dashboard
- Navigate to: https://dashboard.render.com
- Select your backend service: **pharmacare-api**

### 2. Add Environment Variable
- Click on **"Environment"** in the left sidebar
- Click **"Add Environment Variable"** button
- Add the following:

```
Key:   SMTP_PASS
Value: YOUR_BREVO_API_KEY_HERE
```

### 3. Save and Deploy
- Click **"Save Changes"**
- Render will automatically redeploy your backend
- Wait for deployment to complete (usually 1-2 minutes)

### 4. Verify Fix
After deployment completes:

1. **Test Manager Registration**:
   - Go to: https://frontend-1-beta-teal.vercel.app/register
   - Fill out the registration form
   - Submit registration
   - ✅ Should redirect to `/verify-email` page
   - ✅ Should receive email with 6-digit code

2. **Check Backend Logs**:
   - Go to Render dashboard → your service → Logs
   - Look for: `✅ Verification code sent to <email>`
   - Should NOT show: "SMTP not configured"

## CURRENT SMTP CONFIGURATION
The backend already has these variables (confirmed):
- ✅ `SMTP_HOST=smtp-relay.brevo.com`
- ✅ `SMTP_PORT=587`
- ✅ `SMTP_USER=dagmawitadeferes@gmail.com`
- ❌ `SMTP_PASS=` **(MISSING - ADD THIS!)**
- ✅ `SMTP_FROM_EMAIL=dagmawitadeferes@gmail.com`

## WHAT HAPPENS AFTER FIX
Once `SMTP_PASS` is added:

1. **Manager Registration Flow**:
   - Manager fills registration form → Submit
   - ✅ Redirects to `/verify-email` page
   - ✅ Email sent with 6-digit verification code
   - Manager enters code → Email verified
   - Manager waits for admin approval
   - Admin activates account → Manager can login

2. **Staff Creation Flow** (by managers):
   - Manager creates Pharmacist/Cashier
   - ✅ Email sent with verification code
   - ✅ After verification, temporary password sent via email
   - Staff member can login with temporary password

## TROUBLESHOOTING

### If emails still don't send after adding SMTP_PASS:

1. **Check Brevo Account**:
   - Login to: https://app.brevo.com
   - Check if daily email limit is reached (free tier: 300 emails/day)
   - Check sender reputation

2. **Check Backend Logs**:
   - Look for errors like "EAUTH" (wrong password) or "ETIMEDOUT" (connection issue)

3. **Test SMTP Credentials Locally**:
   ```bash
   # In backend directory
   node test-smtp-staff-email.js
   ```

4. **Regenerate SMTP Password**:
   - If current password doesn't work, generate new one from Brevo
   - Update `SMTP_PASS` on Render with new password

## NOTES
- The SMTP password is a Brevo API key (starts with `xsmtpsib-`)
- This is NOT the Gmail account password
- Password is safe to add to Render environment (encrypted at rest)
- Frontend changes have been made to redirect to `/verify-email` after registration
