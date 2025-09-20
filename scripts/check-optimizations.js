#!/usr/bin/env node

console.log('🔧 Performance optimization verification...\n');

// Check if optimizations are in place
const fs = require('fs');
const path = require('path');

function checkOptimizations() {
  const checks = [];

  // Check database connection pooling
  try {
    const dbFile = fs.readFileSync(path.join(__dirname, '../src/db/index.ts'), 'utf8');
    if (dbFile.includes('max: 20') && dbFile.includes('idle_timeout: 20')) {
      checks.push('✅ Database connection pooling configured');
    } else {
      checks.push('❌ Database connection pooling not configured');
    }
  } catch (error) {
    checks.push('❌ Could not check database configuration');
  }

  // Check SSE monitoring
  try {
    const votingFile = fs.readFileSync(path.join(__dirname, '../src/lib/voting-emitter.ts'), 'utf8');
    if (votingFile.includes('getHealthStats') && votingFile.includes('console.log')) {
      checks.push('✅ SSE connection monitoring enabled');
    } else {
      checks.push('❌ SSE monitoring not configured');
    }
  } catch (error) {
    checks.push('❌ Could not check SSE monitoring');
  }

  // Check health endpoint
  try {
    const healthFile = path.join(__dirname, '../src/app/api/health/sse/route.ts');
    if (fs.existsSync(healthFile)) {
      checks.push('✅ Health monitoring endpoint created');
    } else {
      checks.push('❌ Health endpoint not found');
    }
  } catch (error) {
    checks.push('❌ Could not check health endpoint');
  }

  // Check SQL indexes file
  try {
    const sqlFile = path.join(__dirname, '../drizzle/0003_add_performance_indexes.sql');
    if (fs.existsSync(sqlFile)) {
      const sqlContent = fs.readFileSync(sqlFile, 'utf8');
      const indexCount = (sqlContent.match(/CREATE INDEX/g) || []).length;
      checks.push(`✅ Performance indexes ready (${indexCount} indexes)`);
    } else {
      checks.push('❌ Performance indexes SQL file not found');
    }
  } catch (error) {
    checks.push('❌ Could not check SQL indexes');
  }

  return checks;
}

// Run checks
const results = checkOptimizations();

console.log('📋 Optimization Status:');
results.forEach(result => console.log(`  ${result}`));

const passedChecks = results.filter(r => r.startsWith('✅')).length;
const totalChecks = results.length;

console.log(`\n📊 Summary: ${passedChecks}/${totalChecks} optimizations applied`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 All optimizations are in place!');
  console.log('\n📋 To apply database indexes:');
  console.log('1. Create .env.local with your DATABASE_URL');
  console.log('2. Run: npm run db:optimize');
} else {
  console.log('\n⚠️  Some optimizations are missing. Please check the files.');
}

console.log('\n🔍 Monitoring endpoints:');
console.log('  - Health check: GET /api/health/sse');
console.log('  - General health: GET /api/health');