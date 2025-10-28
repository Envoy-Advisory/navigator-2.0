# Deployment Fixes and Troubleshooting

## Issue: Test Files Included in Vercel Build

### Problem
When deploying to Vercel, the build failed with:

```
src/__tests__/setup.ts(5,42): error TS2307: Cannot find module 'util' or its corresponding type declarations.
src/__tests__/setup.ts(6,1): error TS2304: Cannot find name 'global'.
src/__tests__/setup.ts(7,1): error TS2304: Cannot find name 'global'.
Error: Command "npm run build" exited with 2
```

### Root Cause
The TypeScript configuration was including test files in the production build. Test files use Node.js-specific modules (`util`, `global`) that are not available in the browser environment.

### Solution
Updated both `client/tsconfig.json` and `server/tsconfig.json` to explicitly exclude test files from compilation.

#### Client Fix (`client/tsconfig.json`)

**Added:**
```json
{
  "exclude": [
    "src/**/__tests__/**",
    "src/**/*.test.ts",
    "src/**/*.test.tsx",
    "src/**/*.spec.ts",
    "src/**/*.spec.tsx",
    "node_modules"
  ]
}
```

#### Server Fix (`server/tsconfig.json`)

**Added:**
```json
{
  "exclude": [
    "node_modules",
    "dist",
    "src/**/__tests__/**",
    "src/**/*.test.ts",
    "src/**/*.spec.ts"
  ]
}
```

### Verification

After the fix:

✅ Client build works: `cd client && npm run build`  
✅ Server build works: `cd server && npm run build`  
✅ Client tests work: `cd client && npm test`  
✅ Server tests work: `cd server && npm test`  
✅ All 115 tests passing

### Impact
- **Build Time**: No significant change
- **Bundle Size**: Slightly smaller (test files excluded)
- **Test Coverage**: No change (tests still run normally)
- **Breaking Changes**: None

---

## Common Deployment Issues

### 1. Test Files in Build

**Symptoms:**
- Build fails with "Cannot find module 'util'"
- Build fails with "Cannot find name 'global'"
- TypeScript errors about Node.js modules

**Solution:**
- Ensure `tsconfig.json` excludes test files
- Check `exclude` array includes test patterns

**Verify:**
```bash
cd client && npm run build
cd server && npm run build
```

### 2. Environment Variables Missing

**Symptoms:**
- Database connection errors
- JWT signing errors
- "undefined" in environment variable logs

**Solution:**
- Set environment variables in Vercel dashboard
- Required: `DATABASE_URL`, `JWT_SECRET`
- Optional: `NODE_ENV`, `PORT`

**Verify:**
```bash
# Check Vercel environment variables
vercel env ls
```

### 3. Prisma Client Not Generated

**Symptoms:**
- Build fails with "Cannot find module '@prisma/client'"
- Runtime error: "Prisma Client not initialized"

**Solution:**
- Ensure `postinstall` script runs: `"postinstall": "prisma generate"`
- Manually run: `cd server && npx prisma generate`

**Verify:**
```bash
cd server && npx prisma generate
ls -la node_modules/.prisma/client/
```

### 4. Dependencies Not Installed

**Symptoms:**
- Build fails with "Cannot find module 'X'"
- Missing dependencies in build logs

**Solution:**
- Check `package.json` has all dependencies
- Not just in `devDependencies`
- Run: `npm install`

**Verify:**
```bash
npm run install:all
npm list --depth=0
```

### 5. Build Command Incorrect

**Symptoms:**
- Vercel can't find build output
- 404 errors after deployment

**Solution:**
- Verify Vercel build settings:
  - **Build Command**: `npm run build`
  - **Output Directory**: `client/dist`
  - **Install Command**: `npm run install:all`

**Vercel Settings:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "client/dist",
  "installCommand": "npm run install:all",
  "framework": "vite"
}
```

### 6. TypeScript Strict Mode Errors

**Symptoms:**
- Build fails with type errors
- Errors not present locally

**Solution:**
- Ensure same Node.js version locally and on Vercel
- Check `tsconfig.json` settings match
- Run: `npx tsc --noEmit` locally

**Verify:**
```bash
node --version  # Should match Vercel
cd client && npx tsc --noEmit
cd server && npx tsc --noEmit
```

---

## Vercel-Specific Configuration

### vercel.json

Create or update `vercel.json` in project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/src/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/src/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "client/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Environment Variables

Set in Vercel Dashboard (Settings → Environment Variables):

| Variable | Type | Example |
|----------|------|---------|
| `DATABASE_URL` | Secret | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret | `your-secret-key` |
| `NODE_ENV` | Plain | `production` |

---

## Pre-Deployment Checklist

Before deploying to Vercel:

- [ ] All tests pass locally: `npm test`
- [ ] Build works locally: `npm run build`
- [ ] Environment variables set in Vercel
- [ ] Database is accessible from Vercel
- [ ] Prisma migrations applied: `npm run db:migrate`
- [ ] Test files excluded from build
- [ ] Dependencies correctly listed in `package.json`
- [ ] `vercel.json` configured (if needed)
- [ ] Git repository clean (no uncommitted changes)

---

## Deployment Commands

### Deploy to Production
```bash
# Ensure all tests pass
npm test

# Build locally to verify
npm run build:prod

# Deploy to Vercel
vercel --prod
```

### Deploy to Preview
```bash
# Deploy preview (staging)
vercel
```

### Check Deployment Status
```bash
# List deployments
vercel ls

# View logs
vercel logs <deployment-url>
```

---

## Rollback Procedure

If deployment fails or has issues:

1. **Identify last working deployment:**
```bash
vercel ls
```

2. **Promote previous deployment:**
```bash
vercel promote <previous-deployment-url>
```

3. **Or rollback in Vercel Dashboard:**
   - Go to Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

---

## Monitoring

### Check Deployment Health

```bash
# Check API endpoint
curl https://your-app.vercel.app/api/health

# Check client
curl https://your-app.vercel.app
```

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Specific deployment
vercel logs <deployment-url>
```

### Performance Monitoring

- Use Vercel Analytics
- Check build times in Vercel Dashboard
- Monitor cold start times for serverless functions

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Build Configuration](https://vercel.com/docs/build-step)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)

---

## Support

If issues persist:

1. Check Vercel build logs
2. Review TypeScript compiler output
3. Verify environment variables
4. Test build locally: `npm run build`
5. Create issue with build logs

---

**Last Updated:** 2025-10-28  
**Status:** ✅ Resolved  
**Affected Files:** `client/tsconfig.json`, `server/tsconfig.json`

