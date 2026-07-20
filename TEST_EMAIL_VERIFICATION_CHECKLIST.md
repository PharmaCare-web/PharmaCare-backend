# EMAIL VERIFICATION - TESTING CHECKLIST

## 🎯 OBJECTIVE
Verify that manager registration flow now works correctly with email verification.

---

## ✅ BEFORE TESTING: ADD SMTP_PASS TO RENDER

**CRITICAL**: You MUST add `SMTP_PASS` to Render before testing will work!

```
Key:   SMTP_PASS
Value: YOUR_BREVO_API_KEY_HERE
```

See: `ADD_SMTP_PASS_TO_RENDER.md` for detailed instructions.

---

## 📋 TEST CHECKLIST

### Test 1: Frontend Registration Flow ✅ (Already Fixed)
- [ ] Go to: https://frontend-1-beta-teal.vercel.app/register
- [ ] Fill out registration form:
  - Full Name: Test Manager
  - Email: your-test-email@gmail.com (use real email!)
  - Password: Test123
  - Confirm Password: Test123
  - Branch Option: Create New Branch
  - Branch Name: Test Branch
  - Location: Test Location
- [ ] Click "Register" button
- [ ] **EXPECTED**: Immediately redirects to `/verify-email` page
- [ ] **EXPECTED**: Email is pre-filled in the verification form
- [ ] **EXPECTED**: Page shows message: "Check your email for the 6-digit verification code"

**Status**: ✅ Frontend redirect working

---

### Test 2: Email Delivery ⏳ (Waiting for SMTP_PASS)
- [ ] Check your email inbox (the email you used in registration)
- [ ] Look for email from "PharmaCare <dagmawitadeferes@gmail.com>"
- [ ] Email subject: "Email Verification Code - PharmaCare"
- [ ] Email contains 6-digit code (e.g., 123456)
- [ ] Code is valid for 10 minutes

**Current Status**: ❌ Will NOT work until `SMTP_PASS` is added to Render
**After Fix**: ✅ Should receive email within 1-2 minutes

---

### Test 3: Email Verification
- [ ] On `/verify-email` page, enter the 6-digit code from email
- [ ] Click "Verify Email" button
- [ ] **EXPECTED**: Success message: "Email verified successfully!"
- [ ] **EXPECTED**: Shows next step: "Wait for admin approval"
- [ ] **EXPECTED**: "Go to Login" button appears
- [ ] Click "Go to Login"
- [ ] **EXPECTED**: Redirects to `/login` page

---

### Test 4: Login Before Admin Approval
- [ ] On login page, enter:
  - Email: the email you registered with
  - Password: the password you used
- [ ] Click "Login" button
- [ ] **EXPECTED**: Error message: "Account is pending admin activation. Please wait for administrator approval."
- [ ] **EXPECTED**: Cannot login yet (this is correct!)

---

### Test 5: Admin Activates Manager
- [ ] Login as Admin:
  - Email: admin@pharmacare.com
  - Password: Admin@123
- [ ] Go to Manager Management page
- [ ] Find the new manager (email verified ✅, status: Inactive ❌)
- [ ] Click "Activate" button
- [ ] **EXPECTED**: Success message: "Manager activated"
- [ ] **EXPECTED**: Manager status changes to "Active ✅"

---

### Test 6: Manager Login After Activation
- [ ] Logout from admin account
- [ ] Go to login page
- [ ] Login with manager credentials:
  - Email: your manager email
  - Password: your manager password
- [ ] **EXPECTED**: Login successful! 🎉
- [ ] **EXPECTED**: Redirected to Manager Dashboard
- [ ] **EXPECTED**: Can access all manager features

---

### Test 7: Check Backend Logs (Optional)
- [ ] Go to: https://dashboard.render.com
- [ ] Select **pharmacare-api** service
- [ ] Click **Logs** tab
- [ ] Look for these log entries:

**After adding SMTP_PASS, should see**:
```
✅ Verification code sent to <email>
✅ Verification email sent successfully to: <email>
   Message ID: <some-id>
```

**Should NOT see**:
```
❌ SMTP not configured - skipping email verification
❌ Set SMTP_USER and SMTP_PASS in .env to enable email verification
```

---

### Test 8: Resend Verification Code
- [ ] On `/verify-email` page, click "Didn't receive the code? Resend"
- [ ] **EXPECTED**: Success message: "Verification code sent to your email"
- [ ] Check email inbox
- [ ] **EXPECTED**: Receive new email with new 6-digit code
- [ ] Use new code to verify

**Current Status**: ❌ Will NOT work until `SMTP_PASS` is added
**After Fix**: ✅ Should work

---

## 🐛 TROUBLESHOOTING

### If you don't receive verification email:

1. **Check Render has SMTP_PASS**:
   - Go to Render dashboard → Environment
   - Verify `SMTP_PASS` is set
   - If not, add it and wait for redeploy

2. **Check email spam folder**:
   - Look in Spam/Junk folder
   - Mark as "Not Spam" if found there

3. **Check Brevo account**:
   - Login to: https://app.brevo.com
   - Check if daily email limit reached (free: 300/day)
   - Check sender reputation

4. **Check backend logs**:
   - Look for error messages
   - Common errors:
     - `EAUTH` = Wrong SMTP credentials
     - `ETIMEDOUT` = Connection timeout
     - `ECONNREFUSED` = Cannot connect to SMTP server

5. **Test SMTP locally**:
   ```bash
   cd backend
   node test-smtp-staff-email.js
   ```
   Should send test email if SMTP configured correctly

---

## 📊 EXPECTED RESULTS SUMMARY

### ✅ WORKING NOW (Frontend):
- Registration redirects to `/verify-email` page
- Email is pre-filled in verification form
- Page shows helpful message
- All routing works correctly

### ⏳ WILL WORK AFTER ADDING SMTP_PASS:
- Email delivery (verification codes)
- Email verification process
- Resend verification code
- Password reset emails
- Staff creation emails (by managers)

---

## 🚀 QUICK TEST AFTER FIX

Once you add `SMTP_PASS` to Render:

```bash
# 1. Wait for Render to redeploy (1-2 minutes)

# 2. Test registration:
Open: https://frontend-1-beta-teal.vercel.app/register
Fill form → Submit → Check email → Enter code → Verified! ✅

# 3. Check logs:
Render dashboard → Logs → Look for "✅ Verification code sent"

# 4. Full flow test:
Register → Verify Email → Admin Activates → Login → Success! 🎉
```

---

## 📝 NOTES

- Frontend changes are complete and deployed ✅
- Backend code is correct and ready ✅
- Only missing: `SMTP_PASS` environment variable on Render ⏳
- Once added, entire email flow will work perfectly
- All tests marked with ⏳ will change to ✅ after adding SMTP_PASS

---

**Current Status**: Frontend ✅ | Backend Code ✅ | **Action Required**: Add SMTP_PASS to Render ⏳
