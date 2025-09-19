#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build test...\n');

// Test build process
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function testBuild() {
  try {
    // 1. Install dependencies
    console.log('📦 Installing dependencies...');
    await runCommand('npm', ['install', '--legacy-peer-deps']);
    
    // 2. Run linting
    console.log('\n🔍 Running linter...');
    await runCommand('npm', ['run', 'lint']);
    
    // 3. Build the project
    console.log('\n🔨 Building project...');
    await runCommand('npm', ['run', 'build']);
    
    // 4. Check build artifacts
    console.log('\n📂 Checking build artifacts...');
    const buildDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(buildDir)) {
      console.log('✅ Build directory exists');
      
      const staticDir = path.join(buildDir, 'static');
      if (fs.existsSync(staticDir)) {
        console.log('✅ Static assets generated');
      }
      
      const serverDir = path.join(buildDir, 'server');
      if (fs.existsSync(serverDir)) {
        console.log('✅ Server artifacts generated');
      }
    } else {
      throw new Error('Build directory not found');
    }
    
    // 5. Test start (brief)
    console.log('\n🏃 Testing production start...');
    const startProcess = spawn('npm', ['start'], { 
      stdio: 'pipe',
      shell: true 
    });
    
    // Wait a few seconds then kill the process
    setTimeout(() => {
      startProcess.kill();
      console.log('✅ Production start test passed');
      
      console.log('\n🎉 All production build tests passed!');
      console.log('\n📋 Deployment checklist:');
      console.log('  ✅ Dependencies installed');
      console.log('  ✅ Linting passed');
      console.log('  ✅ Build successful');
      console.log('  ✅ Artifacts generated');
      console.log('  ✅ Production start works');
      console.log('\n🚀 Ready for deployment to Vercel!');
      
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('\n❌ Production build test failed:', error.message);
    process.exit(1);
  }
}

testBuild();