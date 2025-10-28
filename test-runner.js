#!/usr/bin/env node

/**
 * Comprehensive test runner for the Fair Chance Navigator 2.0 project
 * Runs tests for both client and server with proper error handling and reporting
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args, cwd, name) {
  return new Promise((resolve, reject) => {
    log(`\n${colors.bright}Running ${name}...${colors.reset}`, 'cyan');
    log(`Command: ${command} ${args.join(' ')}`, 'blue');
    log(`Directory: ${cwd}`, 'blue');

    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${name} completed successfully`, 'green');
        resolve(code);
      } else {
        log(`❌ ${name} failed with exit code ${code}`, 'red');
        reject(new Error(`${name} failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      log(`❌ Error running ${name}: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function checkDependencies() {
  log('Checking dependencies...', 'yellow');
  
  const clientPackageJson = path.join(__dirname, 'client', 'package.json');
  const serverPackageJson = path.join(__dirname, 'server', 'package.json');
  
  if (!fs.existsSync(clientPackageJson)) {
    throw new Error('Client package.json not found');
  }
  
  if (!fs.existsSync(serverPackageJson)) {
    throw new Error('Server package.json not found');
  }
  
  log('✅ Dependencies check passed', 'green');
}

async function installDependencies() {
  log('Installing dependencies...', 'yellow');
  
  try {
    await runCommand('npm', ['install'], path.join(__dirname, 'server'), 'Server dependencies');
    await runCommand('npm', ['install'], path.join(__dirname, 'client'), 'Client dependencies');
    log('✅ All dependencies installed successfully', 'green');
  } catch (error) {
    log('⚠️  Dependency installation had issues, but continuing with tests...', 'yellow');
  }
}

async function runServerTests() {
  const serverDir = path.join(__dirname, 'server');
  return runCommand('npm', ['test'], serverDir, 'Server Tests');
}

async function runClientTests() {
  const clientDir = path.join(__dirname, 'client');
  return runCommand('npm', ['test'], clientDir, 'Client Tests');
}

async function runServerTestsWithCoverage() {
  const serverDir = path.join(__dirname, 'server');
  return runCommand('npm', ['run', 'test:coverage'], serverDir, 'Server Tests with Coverage');
}

async function runClientTestsWithCoverage() {
  const clientDir = path.join(__dirname, 'client');
  return runCommand('npm', ['run', 'test:coverage'], clientDir, 'Client Tests with Coverage');
}

function printTestSummary(results) {
  log('\n' + '='.repeat(60), 'bright');
  log('📊 TEST SUMMARY', 'bright');
  log('='.repeat(60), 'bright');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  log(`Total test suites: ${totalTests}`, 'blue');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`❌ Failed: ${failedTests}`, 'red');
  
  if (failedTests > 0) {
    log('\nFailed test suites:', 'red');
    results.filter(r => !r.success).forEach(result => {
      log(`  - ${result.name}: ${result.error}`, 'red');
    });
  }
  
  log('='.repeat(60), 'bright');
}

async function main() {
  const args = process.argv.slice(2);
  const withCoverage = args.includes('--coverage') || args.includes('-c');
  const install = args.includes('--install') || args.includes('-i');
  
  log('🚀 Fair Chance Navigator 2.0 Test Runner', 'bright');
  log('=====================================', 'bright');
  
  try {
    await checkDependencies();
    
    if (install) {
      await installDependencies();
    }
    
    const results = [];
    
    // Run server tests
    try {
      if (withCoverage) {
        await runServerTestsWithCoverage();
      } else {
        await runServerTests();
      }
      results.push({ name: 'Server Tests', success: true });
    } catch (error) {
      results.push({ name: 'Server Tests', success: false, error: error.message });
    }
    
    // Run client tests
    try {
      if (withCoverage) {
        await runClientTestsWithCoverage();
      } else {
        await runClientTests();
      }
      results.push({ name: 'Client Tests', success: true });
    } catch (error) {
      results.push({ name: 'Client Tests', success: false, error: error.message });
    }
    
    printTestSummary(results);
    
    const allPassed = results.every(r => r.success);
    if (allPassed) {
      log('\n🎉 All tests passed!', 'green');
      process.exit(0);
    } else {
      log('\n💥 Some tests failed!', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = {
  runServerTests,
  runClientTests,
  runServerTestsWithCoverage,
  runClientTestsWithCoverage,
};
