const EventSource = (require('eventsource').EventSource) ? require('eventsource').EventSource : require('eventsource');
const fetch = global.fetch || require('node-fetch');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SSE_URL = `${BASE}/api/sse/rating`;
const ADMIN_COOKIE = 'admin-auth=true';

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('Connecting to SSE:', SSE_URL);
  const es = new EventSource(SSE_URL, { headers: { Cookie: ADMIN_COOKIE } });

  let gotEvents = [];
  es.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data);
      console.log('SSE message:', payload.type, payload.data ? payload.data.currentPhase : 'no-data');
      gotEvents.push(payload);
    } catch (err) {
      console.log('SSE raw:', e.data);
    }
  };
  es.onerror = (err) => {
    console.error('SSE error', err);
  };

  // Give SSE a moment to connect
  await wait(500);

  // Trigger actions
  console.log('POST start');
  await fetch(`${BASE}/api/rating/current`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ADMIN_COOKIE }, body: JSON.stringify({ action: 'start' }) });
  await wait(200);

  console.log('POST start-rating');
  await fetch(`${BASE}/api/rating/current`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ADMIN_COOKIE }, body: JSON.stringify({ action: 'start-rating' }) });
  await wait(7000); // wait for warning -> rating

  console.log('POST stop');
  await fetch(`${BASE}/api/rating/current`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: ADMIN_COOKIE }, body: JSON.stringify({ action: 'stop' }) });

  await wait(500);
  es.close();

  console.log('Collected SSE events count:', gotEvents.length);
  if (gotEvents.length >= 3) {
    console.log('SSE smoke test passed');
    process.exit(0);
  } else {
    console.error('SSE smoke test failed - insufficient events');
    process.exit(2);
  }
})();