// Simple test script to POST to /api/auth/register and print the response
// Usage: node scripts/test-register.js

const url = "http://localhost:3000/api/auth/register";

async function run() {
  const unique = Date.now();
  const payload = {
    username: `testuser_${unique}`,
    password: `StrongP@ssw0rd!${unique}`,
    name: `Test User ${unique}`,
    teamName: `Team Test ${unique}`,
    college: 'Test College'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('HTTP', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Request failed:', e);
  }
}

run();
