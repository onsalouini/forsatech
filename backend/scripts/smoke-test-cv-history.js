/* eslint-disable no-console */
// Smoke-test the multi-CV history + active selection + candidacy cvId snapshot.
// Usage: node scripts/smoke-test-cv-history.js

const http = require('node:http');

function requestJson(method, url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);

    const hasBody = !['GET', 'HEAD'].includes(String(method || '').toUpperCase());

    const req = http.request(
      {
        method,
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsedBody;
          try {
            parsedBody = data ? JSON.parse(data) : null;
          } catch {
            parsedBody = data;
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, body: parsedBody });
            return;
          }
          const err = new Error(`HTTP ${res.statusCode}: ${typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody)}`);
          err.status = res.statusCode;
          err.response = parsedBody;
          reject(err);
        });
      }
    );

    req.on('error', reject);
    if (hasBody) req.write(JSON.stringify(body || {}));
    req.end();
  });
}

async function main() {
  const base = String(process.env.BASE_URL || 'http://localhost:5000').trim();
  const ts = Date.now();
  const email = `cvsmoke${ts}@example.com`;

  const candidatePayload = {
    firstName: 'Smoke',
    lastName: 'Test',
    email,
    country: 'FR',
    birthDate: '1995-01-01',
    professionalTitle: 'Developpeur',
    sector: 'IT',
    experienceLevel: 'junior',
    portfolioUrl: '',
    password: 'Password123!',
  };

  console.log('[1] register candidate');
  const reg = await requestJson('POST', `${base}/api/candidates/register`, candidatePayload);
  const candidateId = reg?.body?.candidate?.id;
  if (!candidateId) throw new Error(`No candidateId returned: ${JSON.stringify(reg.body)}`);
  console.log('candidateId:', candidateId);

  console.log('[2] generate CV v1');
  const cv1 = await requestJson('POST', `${base}/api/cv/generated`, {
    candidateId,
    personal: { firstName: 'Smoke', lastName: 'Test', professionalTitle: 'Dev 1', city: 'Paris', country: 'FR', email },
    content: { professionalSummary: 'Resume 1', skills: 'JavaScript, React' },
  });
  const cv1Id = cv1?.body?.cv?._id;
  console.log('cv1Id:', cv1Id);

  console.log('[3] generate CV v2');
  const cv2 = await requestJson('POST', `${base}/api/cv/generated`, {
    candidateId,
    personal: { firstName: 'Smoke', lastName: 'Test', professionalTitle: 'Dev 2', city: 'Paris', country: 'FR', email },
    content: { professionalSummary: 'Resume 2', skills: 'JavaScript, React, Node' },
  });
  const cv2Id = cv2?.body?.cv?._id;
  console.log('cv2Id:', cv2Id);

  console.log('[4] history should have 2 items, one active');
  const history = await requestJson('GET', `${base}/api/cv/history/${candidateId}`);
  const items = history?.body?.history || [];
  const active = items.filter((x) => x.isActive);
  if (items.length < 2) throw new Error(`Expected >=2 CVs in history, got ${items.length}`);
  if (active.length !== 1) throw new Error(`Expected exactly 1 active CV, got ${active.length}`);
  console.log('activeCvId:', active[0]._id);

  console.log('[5] set active back to v1');
  const target = items.find((x) => String(x._id) === String(cv1Id)) || items[items.length - 1];
  await requestJson('POST', `${base}/api/cv/set-active`, { candidateId, cvId: target._id });

  console.log('[6] by-candidate should return v1 as active');
  const byCand = await requestJson('GET', `${base}/api/cv/by-candidate/${candidateId}`);
  const activeDoc = byCand?.body?.cv;
  if (!activeDoc?._id) throw new Error(`No cv returned from by-candidate: ${JSON.stringify(byCand.body)}`);
  if (String(activeDoc._id) !== String(target._id)) {
    throw new Error(`Active CV mismatch. Expected ${target._id}, got ${activeDoc._id}`);
  }

  console.log('[7] create candidacy should snapshot active cvId');
  const offers = await requestJson('GET', `${base}/api/offers`);
  const offerId = offers?.body?.offers?.[0]?._id;
  if (!offerId) throw new Error('No offers found to apply to');
  const cand = await requestJson('POST', `${base}/api/candidacies`, { candidateId, jobOfferId: offerId });
  const snapshotCvId = cand?.body?.candidacy?.cvId;
  if (!snapshotCvId) throw new Error(`No cvId stored on candidacy: ${JSON.stringify(cand.body)}`);
  if (String(snapshotCvId) !== String(target._id)) {
    throw new Error(`Candidacy cvId mismatch. Expected ${target._id}, got ${snapshotCvId}`);
  }

  console.log('OK: smoke-test passed');
}

main().catch((err) => {
  const details = {
    message: err?.message,
    code: err?.code,
    status: err?.status,
    response: err?.response,
  };
  console.error('Smoke-test FAILED:', JSON.stringify(details, null, 2));
  if (err?.stack) console.error(err.stack);
  process.exitCode = 1;
});
