# 📊 Render Dashboard Guide - Adding BREVO_API_KEY

## 🎯 Quick Reference

**Your Brevo API Key**:
```
YOUR_BREVO_API_KEY_HERE
```

**Service Name**: `pharmacare-api`
**URL**: `https://pharmacare-api.onrender.com`

---

## 🖥️ What You'll See in Render Dashboard

### 1. Services Page
```
┌─────────────────────────────────────────────┐
│ 🏠 Dashboard                                 │
├─────────────────────────────────────────────┤
│                                             │
│  📦 Web Services                            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ pharmacare-api                       │   │
│  │ 🟢 Live                              │   │
│  │ https://pharmacare-api.onrender.com │   │
│  │ Last deployed: X minutes ago         │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘

👆 Click on "pharmacare-api"
```

### 2. Service Dashboard
```
┌─────────────────────────────────────────────┐
│ pharmacare-api                               │
├─────────────────────────────────────────────┤
│                                             │
│  🟢 Live                                    │
│  https://pharmacare-api.onrender.com        │
│                                             │
│  📋 Tabs:                                   │
│  [ Logs ] [ Events ] [ Environment ] ...    │
│                                             │
└─────────────────────────────────────────────┘

👆 Click on "Environment" tab
```

### 3. Environment Variables Page
```
┌─────────────────────────────────────────────┐
│ Environment Variables                        │
├─────────────────────────────────────────────┤
│                                             │
│  [+ Add Environment Variable]  [Save]       │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Key: DB_HOST                         │   │
│  │ Value: dpg-d97do5d7vvec73ej7ej0-... │ ✓ │
│  ├─────────────────────────────────────┤   │
│  │ Key: DB_PORT                         │   │
│  │ Value: 5432                          │ ✓ │
│  ├─────────────────────────────────────┤   │
│  │ Key: DB_USER                         │   │
│  │ Value: pharmacare_user               │ ✓ │
│  ├─────────────────────────────────────┤   │
│  │ ... (more variables)                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘

👆 Click "+ Add Environment Variable"
```

### 4. Add New Variable Dialog
```
┌─────────────────────────────────────────────┐
│ Add Environment Variable                     │
├─────────────────────────────────────────────┤
│                                             │
│  Key:   [BREVO_API_KEY________________]     │
│                                             │
│  Value: [YOUR_BREVO_API_KEY_HERE...]  │
│                                             │
│         [Cancel]  [Add]                     │
│                                             │
└─────────────────────────────────────────────┘

1. Type: BREVO_API_KEY
2. Paste: YOUR_BREVO_API_KEY_HERE
3. Click "Add"
```

### 5. After Adding Variable
```
┌─────────────────────────────────────────────┐
│ Environment Variables                        │
├─────────────────────────────────────────────┤
│                                             │
│  [+ Add Environment Variable]  [Save]       │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Key: BREVO_API_KEY                   │   │
│  │ Value: YOUR_BREVO_API_KEY_HERE...  │ ✓ │
│  └─────────────────────────────────────┘   │
│                                             │
│  ⚠️  You have unsaved changes               │
│                                             │
│  [Save Changes]                             │
│                                             │
└─────────────────────────────────────────────┘

👆 Click "Save Changes"
```

### 6. Deployment Triggered
```
┌─────────────────────────────────────────────┐
│ ✅ Environment variables saved               │
│                                             │
│ 🔄 Deploying...                             │
│                                             │
│ Your service is being redeployed with the   │
│ new environment variables.                  │
│                                             │
│ [ View deployment logs ]                    │
└─────────────────────────────────────────────┘

Wait ~2-3 minutes
```

### 7. Deployment Complete
```
┌─────────────────────────────────────────────┐
│ pharmacare-api                               │
├─────────────────────────────────────────────┤
│                                             │
│  🟢 Live                                    │
│  https://pharmacare-api.onrender.com        │
│                                             │
│  Last deployed: Just now                    │
│  Status: ✅ Deploy successful               │
│                                             │
└─────────────────────────────────────────────┘

✅ Ready to test!
```

---

## 📋 Variables to Add (Copy-Paste Ready)

### Variable 1: BREVO_API_KEY (REQUIRED)
```
Key:   BREVO_API_KEY
Value: YOUR_BREVO_API_KEY_HERE
```

### Variable 2: FROM_EMAIL (Recommended)
```
Key:   FROM_EMAIL
Value: dagmawitadeferes@gmail.com
```

### Variable 3: FROM_NAME (Recommended)
```
Key:   FROM_NAME
Value: PharmaCare
```

---

## ✅ Verification Steps

### After Save and Redeploy:

1. **Check Logs Tab**:
   ```
   Click: Logs tab
   Look for: "✅ Verification email sent successfully via Brevo API"
   Should NOT see: "Cannot find module 'axios'"
   Should NOT see: "Connection timeout"
   ```

2. **Check Events Tab**:
   ```
   Click: Events tab
   Latest event should show: "Deploy live"
   Time: Just now
   Status: ✅ Success
   ```

---

## 🧪 Test After Configuration

### Option 1: Frontend Test
1. Open: https://frontend-1-beta-teal.vercel.app/register
2. Register with your real email
3. Check inbox for verification code

### Option 2: API Test
Use Postman or curl:
```bash
curl -X POST https://pharmacare-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Manager",
    "email": "your-email@gmail.com",
    "password": "Test123456",
    "role_id": 2,
    "branch_name": "Test Branch",
    "location": "Test Location"
  }'
```

---

## 🐛 Troubleshooting

### If Variables Don't Save:
- Refresh the page
- Try adding one variable at a time
- Check for browser console errors

### If Deployment Fails:
- Check "Events" tab for error messages
- View "Logs" for detailed error output
- Verify API key has no extra spaces

### If Emails Still Don't Send:
- Verify BREVO_API_KEY is EXACTLY correct
- Check Brevo account is active (not suspended)
- Check Render logs for Brevo API errors

---

## 📞 Common Questions

**Q: How long does redeploy take?**
A: Typically 2-3 minutes

**Q: Will this restart my service?**
A: Yes, but briefly (~30 seconds downtime)

**Q: Can I add multiple variables at once?**
A: Yes, click "Add" for each, then "Save Changes" once

**Q: What if I make a typo in the API key?**
A: You can edit it - click the variable, update, and save

---

## 🎯 Expected Timeline

```
00:00  Start adding variable
00:01  Variable added, click Save
00:02  Deployment triggered
00:03  Render installs dependencies
00:04  Build completes
00:05  Service restarted
✅     Deployment complete
00:06  Test registration
00:07  Email arrives!
```

**Total time**: ~7 minutes from start to working email

---

## 🚀 Quick Action Plan

1. **NOW**: Open Render dashboard
2. **1 min**: Navigate to Environment tab
3. **1 min**: Add BREVO_API_KEY
4. **1 min**: Add FROM_EMAIL and FROM_NAME (optional)
5. **1 min**: Click Save Changes
6. **3 min**: Wait for deployment
7. **1 min**: Test registration
8. **✅ DONE**: Celebrate! 🎉

---

**You're minutes away from working email verification!** 🚀

