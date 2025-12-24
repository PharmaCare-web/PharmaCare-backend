# Quick Deployment Verification

## Environment Variables Checklist

Copy this to your deployment platform and verify all are set:

```
✅ DB_HOST=your-database-host
✅ DB_PORT=5432
✅ DB_USER=your-db-user
✅ DB_PASSWORD=your-db-password
✅ DB_NAME=pharmacare
✅ DB_SSL=true
✅ PORT=5000 (or auto-set by platform)
✅ NODE_ENV=production
✅ JWT_SECRET=your-strong-random-secret
✅ JWT_EXPIRE=7d
✅ FRONTEND_URL=https://your-frontend-domain.com
✅ SMTP_HOST=smtp-relay.brevo.com
✅ SMTP_PORT=587
✅ SMTP_SECURE=false
✅ SMTP_USER=your-brevo-username
✅ SMTP_PASS=your-brevo-password
```

## Quick Test Endpoints

After deployment, test these endpoints:

1. **Health Check**
   ```
   GET /api/health
   Expected: { "success": true, "message": "PharmaCare API is running" }
   ```

2. **Auth Endpoints**
   ```
   GET /api/auth
   Expected: List of available auth endpoints
   ```

3. **Database Connection**
   - Check server logs for: "✅ Database connected successfully"
   - If you see connection errors, verify DB_* environment variables

## Common First-Time Issues

1. **"CORS: No allowed origins configured"**
   - Solution: Set `FRONTEND_URL` environment variable

2. **"Database connection failed"**
   - Solution: Verify `DB_SSL=true` for production databases
   - Check all DB_* variables are set correctly

3. **"SMTP credentials not configured"**
   - Solution: Set `SMTP_USER` and `SMTP_PASS` environment variables

4. **"JWT_SECRET not set"**
   - Solution: Generate a strong secret: `openssl rand -base64 32`
   - Set as `JWT_SECRET` environment variable

