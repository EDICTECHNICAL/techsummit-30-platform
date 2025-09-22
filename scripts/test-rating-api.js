const fetch = global.fetch || require('node-fetch');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_COOKIE = 'admin-auth=true';

async function getState() {
  const res = await fetch(`${BASE}/api/rating/current`, { headers: { Cookie: ADMIN_COOKIE } });
  const json = await res.json().catch(() => null);
  console.log('GET', res.status, json);
  return json;
}

async function postAction(action) {
  const res = await fetch(`${BASE}/api/rating/current`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: ADMIN_COOKIE },
    body: JSON.stringify({ action }),
  });
  const json = await res.json().catch(() => null);
  console.log('POST', action, res.status, json);
  return json;
}

async function run() {
  console.log('Testing rating API at', BASE);
  await getState();
  await postAction('start');
  // wait a bit and advance to warning
  await new Promise((r) => setTimeout(r, 500));
  await postAction('start-rating');
  await new Promise((r) => setTimeout(r, 500));
  await postAction('stop');
  await getState();
}

run().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});

