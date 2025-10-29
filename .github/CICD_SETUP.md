# CI/CD Setup Guide

This document explains how to set up and configure the CI/CD pipeline for the Fair Chance Navigator 2.0 application.

## 📋 Overview

The CI/CD pipeline consists of:

1. **Pre-commit hooks** - Run tests before each commit
2. **Pre-push hooks** - Run full validation before push
3. **CI Pipeline** - Automated testing and building on GitHub
4. **Deployment Pipeline** - Automated deployment to staging/production

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies (includes Husky)
npm install

# Install all project dependencies
npm run install:all
```

### 2. Set Up Git Hooks

```bash
# Prepare Husky (creates .husky directory and installs hooks)
npm run prepare
```

### 3. Verify Setup

```bash
# Check that hooks are installed
ls -la .husky/
# You should see: pre-commit and pre-push files

# Test a commit (will run tests)
git add .
git commit -m "test: verify ci/cd setup"
```

## 🔧 Configuration

### GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT signing | `your-super-secret-key-here` |

#### Optional Secrets (for Vercel deployment)

| Secret Name | Description | Where to Find |
|------------|-------------|---------------|
| `VERCEL_TOKEN` | Vercel authentication token | Vercel Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | Vercel Project Settings → General |
| `VERCEL_PROJECT_ID` | Vercel project ID | Vercel Project Settings → General |

### Environment Configuration

The pipeline supports multiple environments:

- **Local** (`local`) - Development on local machine
- **Development** (`dev`) - Development server
- **UAT** (`uat`) - User Acceptance Testing
- **Production** (`prod`) - Production server

## 📁 Workflow Files

### `.github/workflows/ci.yml`

**Triggers:** Push to any branch, Pull requests to main/develop

**Jobs:**
1. **test** - Runs all tests on Node 18.x and 20.x
2. **build** - Builds the application (only if tests pass)
3. **lint** - TypeScript type checking
4. **security** - npm audit for vulnerabilities

**Matrix Testing:**
- Node.js 18.x
- Node.js 20.x

### `.github/workflows/deploy.yml`

**Triggers:** Push to main/staging branches, Manual dispatch

**Jobs:**
1. **test-before-deploy** - Full test suite with coverage thresholds
2. **build-and-deploy** - Build and deploy to target environment
3. **notify** - Send deployment notifications

**Environments:**
- `main` branch → Production
- `staging` branch → UAT
- Manual dispatch → Choose environment

## 🧪 Testing in CI/CD

### Test Execution

Tests run in the following order:

1. **Pre-commit**: Quick test run before commit
2. **Pre-push**: Full validation before push
3. **CI Pipeline**: Comprehensive testing on GitHub
4. **Pre-deployment**: Final validation before deploy

### Coverage Thresholds

**Server:**
```json
{
  "branches": 70,
  "functions": 75,
  "lines": 80,
  "statements": 80
}
```

**Client:**
```json
{
  "branches": 60,
  "functions": 65,
  "lines": 70,
  "statements": 70
}
```

### Failing Tests

If tests fail:

1. **Locally**: Commit is blocked
2. **CI**: Build fails, no deployment
3. **Deployment**: Pipeline stops, rollback if needed

## 🔐 Security

### npm Audit

Runs on every CI build:
```bash
npm audit --production
```

Checks for:
- Known vulnerabilities in dependencies
- Outdated packages with security issues
- Malicious packages

### Secret Management

**DO NOT:**
- ❌ Commit secrets to repository
- ❌ Include secrets in code
- ❌ Log secrets in console
- ❌ Share secrets in chat/email

**DO:**
- ✅ Use GitHub Secrets
- ✅ Use environment variables
- ✅ Rotate secrets regularly
- ✅ Use different secrets per environment

## 🚢 Deployment Process

### Automatic Deployment

1. Push to `main` branch:
```bash
git push origin main
# Triggers: test → build → deploy to production
```

2. Push to `staging` branch:
```bash
git push origin staging
# Triggers: test → build → deploy to UAT
```

### Manual Deployment

Via GitHub Actions UI:

1. Go to Actions tab
2. Select "Deploy to Production/Staging"
3. Click "Run workflow"
4. Choose environment
5. Click "Run workflow"

### Local Build with Tests

```bash
# Build for production (runs tests first)
npm run build:prod

# Build for UAT (runs tests first)
npm run build:uat

# Build without tests (emergency only)
npm run build:skip-tests
```

## 🔄 Workflow Diagram

```
┌─────────────┐
│  Git Commit │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Pre-commit  │──→ Run Tests ──→ Pass ──→ Continue
│    Hook     │                    ↓
└─────────────┘                   Fail ──→ Block Commit
       │
       ↓
┌─────────────┐
│  Git Push   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Pre-push   │──→ Run Validation ──→ Pass ──→ Continue
│    Hook     │                         ↓
└─────────────┘                        Fail ──→ Block Push
       │
       ↓
┌─────────────┐
│   GitHub    │
│   Actions   │
└──────┬──────┘
       │
       ├──→ Run Tests (Node 18.x, 20.x)
       │         ↓
       ├──→ Build Application
       │         ↓
       ├──→ Type Checking
       │         ↓
       └──→ Security Audit
                 ↓
          ┌──────────┐
          │  Deploy  │
          └──────────┘
```

## 🛠️ Troubleshooting

### Hook Not Running

```bash
# Reinstall hooks
rm -rf .husky
npm run prepare

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### Tests Failing in CI but Passing Locally

1. Check Node.js version matches
2. Verify environment variables
3. Check for missing dependencies
4. Review CI logs for specific errors

### Deployment Failing

1. Verify GitHub Secrets are set
2. Check database connection
3. Review deployment logs
4. Ensure build artifacts are generated

### Skipping Hooks (Emergency)

```bash
# Skip pre-commit hook
git commit --no-verify -m "emergency fix"

# Skip CI (add to commit message)
git commit -m "docs update [skip ci]"
```

⚠️ **Use sparingly** - These bypass important safety checks!

## 📊 Monitoring

### GitHub Actions Dashboard

View workflow status:
- Repository → Actions tab
- See all runs, logs, and artifacts
- Download build artifacts
- Re-run failed workflows

### Coverage Reports

Coverage reports are uploaded to Codecov:
- View at: `https://codecov.io/gh/YOUR_ORG/YOUR_REPO`
- See coverage trends over time
- Identify untested code paths

### Build Artifacts

Build artifacts are stored for 7 days:
- Server build: `server/dist/`
- Client build: `client/dist/`
- Download from Actions → Workflow Run → Artifacts

## 📝 Best Practices

1. **Always run tests locally** before pushing
2. **Keep tests fast** - slow tests discourage running them
3. **Write meaningful commit messages** - helps track changes
4. **Review CI logs** when builds fail
5. **Update tests** when code changes
6. **Monitor coverage** and improve weak areas
7. **Rotate secrets** regularly
8. **Use feature branches** for development
9. **Create PRs** for code review
10. **Tag releases** for version tracking

## 🆘 Support

For CI/CD issues:

1. Check this documentation
2. Review GitHub Actions logs
3. Check test output locally
4. Review workflow files
5. Create an issue if problem persists

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Jest CI Documentation](https://jestjs.io/docs/continuous-integration)
- [Vercel Deployment Guide](https://vercel.com/docs/deployments/overview)

---

**Last Updated:** 2025-10-28  
**Version:** 1.0.0

