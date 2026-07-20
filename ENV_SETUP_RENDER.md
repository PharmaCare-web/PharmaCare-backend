# 🔑 Render Environment Variables Setup

## Required Environment Variables for Email

Add these to your Render service:

### 1. BREVO_API_KEY (REQUIRED)
```
Key:   BREVO_API_KEY
Value: [Get this from your .env file - starts with xsmtpsib- or xkeysib-]
```

**How to get your API key**:
1. Open your `.env` file locally
2. Look for the line starting with `BREVO_API_KEY=`
3. Copy the value after the `=` sign
4. Paste it in Render

### 2. FROM_EMAIL (REQUIRED)
```
Key:   FROM_EMAIL
Value: dagmawitadeferes@gmail.com
```

### 3. FROM_NAME (REQUIRED)
```
Key:   FROM_NAME
Value: PharmaCare
```

---

## How to Add to Render

1. Go to: https://dashboard.render.com
2. Click on your service: **pharmacare-api**
3. Click **"Environment"** in the left sidebar
4. Click **"Add Environment Variable"**
5. Enter the Key and Value
6. Click **"Save Changes"**
7. Render will automatically redeploy

---

## ✅ Verify Setup

After adding the variables, check Render logs for:
```
✅ Verification email sent successfully via Brevo API to: email@example.com
```

Should NOT see:
```
❌ Brevo API not configured
❌ Connection timeout
```

---

## 🔄 Old SMTP Variables (Optional - Can Remove)

These are no longer used and can be safely removed:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`

Or just leave them - they won't cause any issues.

---

**Quick Action**: Add the 3 required variables to Render now!
