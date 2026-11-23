import { itemFieldPrompt, sanitizeItem } from './item-fields.js';

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    json(res, 405, { available: false });
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    json(res, 200, { available: false });
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  let payload;
  try {
    payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    json(res, 400, { available: false, error: 'Invalid request' });
    return;
  }

  const text = typeof payload.text === 'string' ? payload.text.trim().slice(0, 1500) : '';
  if (text.length < 2) {
    json(res, 400, { available: false, error: 'Say a little more about the item.' });
    return;
  }

  const gemini = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${itemFieldPrompt('speech')}\n\nStudent said:\n${text}` }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    },
  );

  if (!gemini.ok) {
    json(res, 200, { available: false });
    return;
  }

  const result = await gemini.json();
  const reply = result?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  try {
    json(res, 200, { available: true, ...sanitizeItem(JSON.parse(reply)) });
  } catch {
    json(res, 200, { available: false });
  }
}
