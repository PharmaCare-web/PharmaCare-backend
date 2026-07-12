# 🚀 Quick Start with Deployed Backend

## Your Backend is Already Live!

✅ **Backend API:** https://pharmacare-api.onrender.com

---

## Step 1: Install Frontend Dependencies (2 minutes)

```bash
cd frontend
npm install
```

This installs all required packages including React, Axios, Tailwind CSS, etc.

---

## Step 2: Start Frontend Locally (10 seconds)

```bash
npm run dev
```

Or on Windows, double-click: `frontend/START.bat`

The frontend will start at: **http://localhost:3000**

---

## Step 3: Test the Application

1. **Open browser:** http://localhost:3000
2. **You'll see the login page**
3. **Login with your credentials**
4. **Get redirected to your dashboard**

The frontend will connect to your deployed backend automatically!

---

## Configuration Details

### Frontend Environment (.env)
```env
VITE_API_URL=https://pharmacare-api.onrender.com
```

Already configured! The frontend will connect to your deployed Render backend.

### What This Means
- ✅ Frontend runs locally (fast development)
- ✅ Backend runs on Render (production ready)
- ✅ No need to run backend locally
- ✅ All API calls go to deployed backend
- ✅ Your database on Render is used

---

## Testing Checklist

### 1. Test Backend Health
Open in browser: https://pharmacare-api.onrender.com/api/health

You should see:
```json
{
  "success": true,
  "message": "PharmaCare API is running",
  "timestamp": "..."
}
```

### 2. Test Auth Endpoints
Open: https://pharmacare-api.onrender.com/api/auth

You should see the list of authentication endpoints.

### 3. Test Frontend
1. Open: http://localhost:3000
2. Login page should load
3. Try logging in
4. Check browser console (F12) for any errors

---

## Common Setup Scenarios

### Scenario 1: First Time Setup
```bash
# Clone or navigate to project
cd pharmacare

# Install frontend dependencies
cd frontend
npm install

# Start frontend
npm run dev

# Open browser
# http://localhost:3000
```

### Scenario 2: Daily Development
```bash
# Navigate to frontend
cd frontend

# Start dev server
npm run dev

# Start coding!
```

### Scenario 3: Fresh Start
```bash
# Clear everything and reinstall
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

---

## Development Workflow

### Making Changes
1. **Edit files** in `frontend/src/`
2. **Save** - Vite hot-reloads automatically
3. **Check browser** - Changes appear instantly
4. **Check console** - Look for errors

### Testing API Calls
1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Make an action** (like login)
4. **See API calls** to https://pharmacare-api.onrender.com
5. **Check responses**

### Adding New Features
1. **Create component** in `frontend/src/`
2. **Add route** in `App.jsx`
3. **Create API service** in `frontend/src/api/`
4. **Test locally**

---

## Backend API Endpoints

All endpoints are at: `https://pharmacare-api.onrender.com/api`

### Authentication
- POST `/auth/login`
- POST `/auth/register`
- POST `/auth/verify-email`
- GET `/auth/me`
- POST `/auth/logout`
- POST `/auth/change-password`

### Admin
- GET `/admin/dashboard`
- GET `/admin/managers`
- PUT `/admin/managers/:id/activate`

### Manager
- GET `/manager/dashboard`
- GET `/manager/staff`
- POST `/manager/staff`
- GET `/manager/medicines`
- POST `/manager/medicines`

### Pharmacist
- GET `/pharmacist/medicines`
- POST `/pharmacist/sales`
- GET `/pharmacist/reports/low-stock`

### Cashier
- GET `/cashier/payments/pending`
- POST `/cashier/payments/:id/accept`
- POST `/cashier/returns`

**Full API documentation:** See FRONTEND_BLUEPRINT.md

---

## Troubleshooting

### Issue: Frontend won't start
**Error:** "Cannot find module"

**Solution:**
```bash
cd frontend
npm install
```

### Issue: Can't connect to backend
**Error:** "Network Error" or "Failed to fetch"

**Solution:**
1. Check backend is running: https://pharmacare-api.onrender.com/api/health
2. Check `frontend/.env` has correct URL
3. Check browser console for CORS errors

### Issue: CORS error
**Error:** "blocked by CORS policy"

**Solution:**
Backend needs to allow your frontend origin. Since you're running locally, it should already be configured. If not, contact backend admin to add `http://localhost:3000` to CORS whitelist.

### Issue: Login doesn't work
**Possible causes:**
1. Wrong credentials
2. User not verified
3. Backend database issue

**Solution:**
1. Check browser console for error messages
2. Verify backend is running
3. Check Network tab in DevTools
4. Try creating a new user

### Issue: Module not found react-toastify
**Solution:**
```bash
cd frontend
npm install react-toastify --save
```

---

## Performance Notes

### Backend on Render Free Tier
- May "sleep" after 15 minutes of inactivity
- First request after sleep takes ~30-60 seconds to wake up
- Subsequent requests are fast

### Frontend Local Development
- Hot reload is instant
- No deployment needed for testing
- Full React DevTools support

---

## Next Steps

### 1. Immediate Tasks
- [ ] Install dependencies
- [ ] Start frontend
- [ ] Test login
- [ ] Explore dashboard

### 2. Development Tasks
- [ ] Complete Register page
- [ ] Complete Email Verification
- [ ] Build dashboard with real data
- [ ] Implement CRUD operations
- [ ] Add reports and charts

### 3. Deployment
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Update backend CORS
- [ ] Test production deployment
- [ ] Set up custom domain (optional)

**See DEPLOY_FRONTEND.md for deployment instructions**

---

## Useful Commands

```bash
# Install dependencies
cd frontend && npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run lint
```

---

## File Structure

```
pharmacare/
├── backend (root) - Deployed on Render ✅
├── frontend/
│   ├── src/
│   │   ├── api/ - API calls
│   │   ├── components/ - React components
│   │   ├── pages/ - Page components
│   │   ├── context/ - State management
│   │   └── App.jsx - Main app
│   ├── .env - Backend URL config
│   └── package.json
```

---

## Summary

✅ **Backend:** Already deployed and running  
✅ **Frontend:** Runs locally, connects to deployed backend  
✅ **Database:** PostgreSQL on Render  
✅ **Development:** Fast and easy  
✅ **Production:** Ready to deploy  

---

## Ready to Start!

```bash
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:3000**

**Happy coding! 🚀**
