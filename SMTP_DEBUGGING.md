# SMTP Email Debugging Guide

## Current Status
✅ SMTP works for Manager registration emails
❌ Staff creation emails not received (but backend says they were sent)

## Possible Issues

### 1. Email Going to Spam
- Check the spam/junk folder of the staff email address
- Add `dagmawitadeferes@gmail.com` to contacts/safe senders

### 2. Brevo Daily Limits
- Free tier: 300 emails/day
- Check Brevo dashboard: https://app.brevo.com
- View "Statistics" to see if emails are being sent

### 3. Email Address Typo
- Double-check the email address when creating staff
- Try using your own email first to test

### 4. Brevo Blocking
- Brevo might flag certain domains as suspicious
- Try with Gmail/Outlook addresses first

## Testing Steps

1. **Create staff with YOUR OWN email address**
   - This ensures you can check if email arrives
   - Check spam folder

2. **Check Brevo Dashboard**
   - Login to https://app.brevo.com
   - Go to "Statistics" → "Email"
   - See if emails show as "Sent" or "Delivered"

3. **Check Backend Logs (Render)**
   - Go to Render dashboard
   - Open your backend service
   - Check "Logs" tab
   - Look for email sending success/failure messages

## Workaround
If emails still don't work, use the "Verify Staff" feature:
1. Create staff
2. Check backend logs on Render for the verification code
3. Use "Verify Staff" button with the code from logs
4. Or ask me to add a "Show Verification Code" feature for testing
