# Email Troubleshooting Guide

## Common Issues and Solutions

### Error: "Failed to send password reset email"

This error can occur for several reasons. Follow these steps to diagnose and fix the issue:

---

## Step 1: Check Your .env File

Make sure your `.env` file in the `backend` folder has the following variables:

**Option A: Port 587 (TLS) - May be blocked by firewall/ISP**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Option B: Port 465 (SSL) - More reliable, try this if 587 times out**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Important Notes:**
- For Gmail, you MUST use an **App Password**, not your regular password
- Make sure there are no spaces or quotes around the values
- The `.env` file should be in the `backend` folder

---

## Step 2: Check Server Console Logs

When you try to send a password reset email, check your server console for detailed error messages. The logs will show:

- Error code (e.g., `EAUTH`, `ETIMEDOUT`, `ECONNREFUSED`)
- Error message
- SMTP server response

Look for messages like:
```
❌ Failed to send password reset email: [error message]
Error details: { ... }
```

---

## Step 3: Common Error Codes and Solutions

### Error Code: `EAUTH` - Authentication Failed

**Problem:** Your email credentials are incorrect.

**Solutions:**
1. **For Gmail:**
   - Go to your Google Account settings
   - Enable 2-Step Verification (required for app passwords)
   - Go to "App passwords" section
   - Generate a new app password for "Mail"
   - Use this 16-character app password (not your regular password)
   - Update `SMTP_PASS` in your `.env` file

2. **For Other Email Providers:**
   - Make sure `SMTP_USER` is your full email address
   - Make sure `SMTP_PASS` is correct
   - Some providers require special passwords for SMTP

---

### Error Code: `ETIMEDOUT` or `ECONNREFUSED` - Connection Failed

**Problem:** Cannot connect to the SMTP server.

**Solutions:**
1. Check your internet connection
2. Verify SMTP settings:
   - **Gmail:** `smtp.gmail.com:587`
   - **Outlook:** `smtp-mail.outlook.com:587`
   - **Yahoo:** `smtp.mail.yahoo.com:587`
3. Check if your firewall is blocking the connection
4. Try different SMTP ports:
   - Port 587 (TLS) - Recommended
   - Port 465 (SSL) - Set `SMTP_SECURE=true`
   - Port 25 - Often blocked by ISPs

---

### Error: "SMTP credentials not configured"

**Problem:** `SMTP_USER` or `SMTP_PASS` is missing from `.env` file.

**Solution:**
1. Open `backend/.env` file
2. Add the missing variables
3. Restart your server

---

## Step 4: Test Your SMTP Configuration

### Option 1: Use the Verify Script

Run this command to check your environment variables:

```bash
cd backend
node verify_env.js
```

This will show you if your SMTP settings are configured correctly.

### Option 2: Test Email Connection Manually

Create a test file `test_email.js`:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log('✅ Server is ready to send emails');
  }
});
```

Run it:
```bash
node test_email.js
```

---

## Step 5: Gmail-Specific Setup

If you're using Gmail, follow these steps:

1. **Enable 2-Step Verification:**
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "PharmaCare API"
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Update .env:**
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop  # The app password (remove spaces)
   ```

4. **Important:** 
   - Use the app password, NOT your regular Gmail password
   - The app password will have spaces, but you can remove them in .env

---

## Step 6: Check Server Response

After trying to send an email, check the API response. It now includes more detailed error information:

```json
{
  "success": false,
  "message": "SMTP authentication failed. Please check your email credentials.",
  "error": "The email username or password (app password) is incorrect.",
  "debug": {
    "code": "EAUTH",
    "command": "AUTH PLAIN",
    "responseCode": 535
  }
}
```

Use this information to identify the specific issue.

---

## Step 7: Alternative Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
```

---

## Step 8: Development Mode - Return Password in Response

If you're in development and don't want to set up email, you can modify the code to return the temporary password in the response (NOT recommended for production).

The current implementation requires SMTP to be configured. For testing without email, you could temporarily modify the forgot password function to return the password in the response (similar to how resend verification works when SMTP is not configured).

---

## Still Having Issues?

1. **Check server logs** - Look for detailed error messages
2. **Verify .env file** - Make sure variables are set correctly
3. **Test SMTP connection** - Use the test script above
4. **Check email provider settings** - Some providers have special requirements
5. **Try a different email provider** - Gmail, Outlook, etc.

---

## Quick Checklist

- [ ] `.env` file exists in `backend` folder
- [ ] `SMTP_USER` is set to your email address
- [ ] `SMTP_PASS` is set (app password for Gmail)
- [ ] `SMTP_HOST` is correct for your email provider
- [ ] `SMTP_PORT` is correct (587 for TLS, 465 for SSL)
- [ ] Server has been restarted after changing `.env`
- [ ] Internet connection is working
- [ ] Firewall is not blocking SMTP ports
- [ ] For Gmail: 2-Step Verification is enabled
- [ ] For Gmail: App password is generated and used

---

## Need More Help?

Check the server console output for detailed error messages. The improved error handling will now show:
- Specific error codes
- SMTP server responses
- Connection issues
- Authentication problems

Use this information to identify and fix the issue!

