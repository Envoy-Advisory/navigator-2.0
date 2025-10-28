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
├── test-runner.js                       # Comprehensive test runner
└── package.json                         # Root test scripts
```

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Install dependencies and run tests
npm run test:install
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

**Happy Testing! 🎉**
