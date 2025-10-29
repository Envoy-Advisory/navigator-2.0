# Testing Guide for Fair Chance Navigator 2.0

This document provides comprehensive information about the testing setup for the Fair Chance Navigator 2.0 project.

## 🧪 Testing Overview

The project includes a complete testing suite with:
- **Unit Tests** for individual functions and components
- **Integration Tests** for API endpoints
- **Component Tests** for React components
- **Interface Tests** for TypeScript interfaces
- **Coverage Reports** for code quality metrics

## 📁 Test Structure

```
navigator-2.0/
├── server/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── setup.ts                 # Test setup and mocks
│   │   │   ├── env.test.ts              # Environment utilities tests
│   │   │   ├── database.test.ts         # Database service tests
│   │   │   ├── middleware/
│   │   │   │   └── auth.test.ts         # Authentication middleware tests
│   │   │   ├── handlers/
│   │   │   │   └── auth.test.ts         # Authentication handler tests
│   │   │   └── integration/
│   │   │       └── api.test.ts          # API integration tests
│   │   └── ...
│   ├── jest.config.ts                   # Jest configuration (TypeScript)
│   └── package.json                     # Test scripts
├── client/
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── setup.ts                 # Test setup and mocks
│   │   │   ├── App.test.tsx             # Main App component tests
│   │   │   └── interfaces/
│   │   │       └── navigatorIntfs.test.ts # Interface tests
│   │   └── ...
│   ├── jest.config.ts                   # Jest configuration (TypeScript)
│   └── package.json                     # Test scripts
└── package.json                         # Root test scripts
```

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests (server + client)
npm test

# Run tests with coverage
npm run test:coverage
```

### Individual Test Suites

```bash
# Server tests only
npm run test:server

# Client tests only
npm run test:client

# Server tests with coverage
npm run test:server:coverage

# Client tests with coverage
npm run test:client:coverage
```

### Development Mode

```bash
# Watch mode for server tests
cd server && npm run test:watch

# Watch mode for client tests
cd client && npm run test:watch
```

## 🔧 Test Configuration

### TypeScript Configuration Benefits

The Jest configuration files are written in TypeScript (`.ts`) instead of JavaScript (`.js`) for several advantages:

- **Type Safety**: Full TypeScript support with proper type checking
- **IntelliSense**: Better IDE support with autocomplete and error detection
- **Consistency**: Matches the project's TypeScript-first approach
- **Maintainability**: Easier to maintain and extend with proper typing
- **Modern Standards**: Follows current best practices for TypeScript projects

### Server Tests (Jest + TypeScript)

**Configuration:** `server/jest.config.ts`
- **Environment:** Node.js
- **Transform:** TypeScript files
- **Coverage:** Comprehensive coverage reports
- **Setup:** Custom setup with mocked dependencies

**Key Features:**
- Prisma database mocking
- JWT token mocking
- Environment variable mocking
- Express request/response mocking

### Client Tests (Jest + React Testing Library)

**Configuration:** `client/jest.config.ts`
- **Environment:** jsdom (browser simulation)
- **Transform:** TypeScript and JSX files
- **Coverage:** Component and utility coverage
- **Setup:** React Testing Library setup

**Key Features:**
- React component testing
- User interaction simulation
- DOM manipulation testing
- LocalStorage mocking
- Fetch API mocking

## 📊 Test Coverage

### Coverage Reports

Tests generate detailed coverage reports including:
- **Line Coverage:** Percentage of code lines executed
- **Branch Coverage:** Percentage of conditional branches tested
- **Function Coverage:** Percentage of functions called
- **Statement Coverage:** Percentage of statements executed

### Coverage Targets

- **Minimum Line Coverage:** 80%
- **Minimum Branch Coverage:** 75%
- **Critical Path Coverage:** 95% (auth, database, core components)

## 🧩 Test Types

### 1. Unit Tests

**Purpose:** Test individual functions and components in isolation

**Examples:**
- Environment variable utilities (`env.test.ts`)
- Database service methods (`database.test.ts`)
- Authentication middleware (`auth.test.ts`)
- TypeScript interfaces (`navigatorIntfs.test.ts`)

### 2. Integration Tests

**Purpose:** Test API endpoints with full request/response cycle

**Examples:**
- User registration flow (`api.test.ts`)
- Authentication flow (`api.test.ts`)
- Error handling scenarios (`api.test.ts`)

### 3. Component Tests

**Purpose:** Test React components with user interactions

**Examples:**
- App component rendering (`App.test.tsx`)
- Login/registration flows (`App.test.tsx`)
- Navigation and routing (`App.test.tsx`)

## 🔍 Test Examples

### Server Unit Test Example

```typescript
describe('Environment Utilities', () => {
  it('should return environment variable value when it exists', () => {
    process.env.TEST_VAR = 'test-value';
    expect(getEnvVar('TEST_VAR')).toBe('test-value');
  });

  it('should throw error when environment variable does not exist', () => {
    delete process.env.TEST_VAR;
    expect(() => getEnvVar('TEST_VAR')).toThrow('Environment variable TEST_VAR is not defined');
  });
});
```

### Client Component Test Example

```typescript
describe('App Component', () => {
  it('should show login modal when login button is clicked', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTestId('login-btn'));
    
    expect(screen.getByText('Login to Your Account')).toBeInTheDocument();
  });
});
```

### Integration Test Example

```typescript
describe('POST /api/register', () => {
  it('should register a new user successfully', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      organization: 'Test Org',
    };

    const response = await request(app)
      .post('/api/register')
      .send(userData)
      .expect(201);

    expect(response.body).toMatchObject({
      message: 'User created successfully',
      user: expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
      }),
    });
  });
});
```

## 🛠️ Test Utilities

### Mocking

**Database Mocking:**
```typescript
jest.mock('../../database', () => ({
  UserService: {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    updateLastLogin: jest.fn(),
  },
}));
```

**API Mocking:**
```typescript
global.fetch = jest.fn();
(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ user: mockUser }),
});
```

### Test Data Factories

```typescript
const createMockUser = (overrides = {}) => ({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  organization_id: 1,
  created_at: new Date(),
  last_login: new Date(),
  ...overrides,
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Kill processes on test ports
   lsof -ti:3000 | xargs kill -9
   lsof -ti:5000 | xargs kill -9
   ```

2. **Module Resolution Errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules client/node_modules server/node_modules
   npm run install:all
   ```

3. **TypeScript Compilation Errors**
   ```bash
   # Check TypeScript configuration
   cd server && npx tsc --noEmit
   cd ../client && npx tsc --noEmit
   ```

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test file with debug
DEBUG=* npm run test:server -- --testNamePattern="auth"
```

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm run install:all
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v1
```

## 📝 Best Practices

### Writing Tests

1. **Follow AAA Pattern:** Arrange, Act, Assert
2. **Use Descriptive Names:** Test names should explain what is being tested
3. **Test Edge Cases:** Include boundary conditions and error scenarios
4. **Mock External Dependencies:** Keep tests isolated and fast
5. **Maintain Test Data:** Use consistent, realistic test data

### Test Organization

1. **Group Related Tests:** Use `describe` blocks for logical grouping
2. **Clean Up:** Use `beforeEach` and `afterEach` for setup/teardown
3. **Independent Tests:** Each test should be able to run in isolation
4. **Fast Execution:** Keep unit tests under 100ms each

### Coverage Guidelines

1. **Focus on Critical Paths:** Ensure authentication, database, and core business logic are well-tested
2. **Avoid Over-Mocking:** Test real behavior where possible
3. **Include Error Cases:** Test both success and failure scenarios
4. **Regular Reviews:** Review coverage reports regularly and improve weak areas

## 🔗 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeScript Testing Guide](https://jestjs.io/docs/getting-started#using-typescript)

## 📞 Support

For testing-related questions or issues:
1. Check the troubleshooting section above
2. Review existing test files for examples
3. Consult the Jest and React Testing Library documentation
4. Create an issue in the project repository

---

## 🔄 CI/CD Integration

Tests are now integrated into the build and deployment process:

### Pre-Commit Hooks (Husky)

Tests run automatically before each commit:

```bash
git commit -m "your message"
# 🧪 Running tests before commit...
# ✅ All tests passed! Proceeding with commit...
```

To bypass hooks in emergency (not recommended):
```bash
git commit --no-verify -m "emergency fix"
```

### Build Process

All build commands now run tests first:

```bash
# These commands run tests before building
npm run build              # Runs tests, then builds
npm run build:prod         # Runs tests, then builds for production
npm run build:dev          # Runs tests, then builds for dev
npm run build:uat          # Runs tests, then builds for UAT

# Skip tests (use with caution)
npm run build:skip-tests   # Builds without running tests
```

### GitHub Actions Workflows

#### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and pull request:

1. **Test Job**: Runs tests on Node 18.x and 20.x
   - Server tests
   - Client tests
   - Coverage reports

2. **Build Job**: Builds the application
   - Only runs if tests pass
   - Uploads build artifacts

3. **Lint Job**: TypeScript checks
   - Type checking
   - Code quality validation

4. **Security Job**: Security audits
   - npm audit for vulnerabilities

#### Deploy Pipeline (`.github/workflows/deploy.yml`)

Runs on pushes to `main` or `staging` branches:

1. **Test Before Deploy**: Full test suite with coverage thresholds
2. **Build and Deploy**: Build with environment-specific configs
3. **Notify**: Deployment status notifications

### Manual Deployment with Test Gates

```bash
# Deploy to production (runs tests first)
npm run build:prod

# Deploy to UAT (runs tests first)
npm run build:uat

# Deploy to dev (runs tests first)
npm run build:dev
```

### Coverage Requirements

Minimum coverage thresholds enforced:

**Server:**
- Branches: 70%
- Functions: 75%
- Lines: 80%
- Statements: 80%

**Client:**
- Branches: 60%
- Functions: 65%
- Lines: 70%
- Statements: 70%

### Continuous Integration Features

✅ **Automated Testing**: Tests run on every commit and PR  
✅ **Build Validation**: Builds only proceed if tests pass  
✅ **Coverage Tracking**: Coverage reports uploaded to Codecov  
✅ **Security Scanning**: Automated vulnerability detection  
✅ **Multi-Environment**: Separate workflows for dev/UAT/production  
✅ **Artifact Storage**: Build artifacts saved for deployment

### Setting Up Locally

1. Install Husky hooks:
```bash
npm install
npm run prepare
```

2. Verify hooks are installed:
```bash
ls -la .husky/
# Should see pre-commit and pre-push files
```

3. Test the hooks:
```bash
# Make a change
echo "test" >> test.txt
git add test.txt
git commit -m "test commit"
# Tests will run automatically
```

### Environment Variables for CI/CD

Add these secrets to your GitHub repository:

```yaml
DATABASE_URL          # Database connection string
JWT_SECRET           # JWT signing secret
VERCEL_TOKEN         # Vercel deployment token (if using Vercel)
VERCEL_ORG_ID       # Vercel organization ID
VERCEL_PROJECT_ID   # Vercel project ID
```

### Skipping CI (Emergency Only)

Add `[skip ci]` or `[ci skip]` to commit message:
```bash
git commit -m "docs update [skip ci]"
```

⚠️ **Note**: This bypasses all CI checks and should only be used for documentation changes or emergency situations.

---

**Happy Testing! 🎉**
