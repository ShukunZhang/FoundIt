const CATEGORIES = ['WatCard', 'wallet', 'electronics', 'keys', 'bottle', 'clothing', 'bag', 'supplies', 'other'];

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

  const image = typeof payload.image === 'string' ? payload.image : '';
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    json(res, 400, { available: false, error: 'Expected a photo data URL' });
    return;
  }

  const prompt = [
    'You identify a lost-and-found item from a photo.',
    'Reply with JSON only, no markdown, using these keys:',
    'category (one of WatCard, wallet, electronics, keys, bottle, clothing, bag, supplies, other),',
    'subcategory, colour, brand, distinctiveFeatures, description.',
    'Do not invent a person name, student number, or card number.',
    'If a field is unclear, use an empty string.',
  ].join(' ');

  const gemini = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: match[1], data: match[2] } },
          ],
        }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    },
  );

  if (!gemini.ok) {
    json(res, 200, { available: false });
    return;
  }

  const result = await gemini.json();
  const text = result?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
  try {
    const parsed = JSON.parse(text);
    const category = CATEGORIES.includes(parsed.category) ? parsed.category : 'other';
    json(res, 200, {
      available: true,
      category,
      subcategory: String(parsed.subcategory || ''),
      colour: String(parsed.colour || ''),
      brand: String(parsed.brand || ''),
      distinctiveFeatures: String(parsed.distinctiveFeatures || ''),
      description: String(parsed.description || ''),
    });
  } catch {
    json(res, 200, { available: false });
  }
};
