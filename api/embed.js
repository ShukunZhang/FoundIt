function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * One Gemini embedding for either a photo or a written description.
 * Both land in the same 768-d space, so cosine covers image–image,
 * image–text, text–image, and text–text.
 */
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

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    json(res, 400, { available: false, error: 'Invalid request' });
    return;
  }

  const parts = [];
  const image = typeof payload.image === 'string' ? payload.image : '';
  const text = typeof payload.text === 'string' ? payload.text.trim() : '';

  if (image) {
    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match || match[2].length > 4_000_000) {
      json(res, 400, { available: false, error: 'Expected a photo data URL' });
      return;
    }
    parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
  } else if (text.length >= 3) {
    parts.push({ text: text.slice(0, 2000) });
  } else {
    json(res, 400, { available: false, error: 'Expected a photo or a description' });
    return;
  }

  try {
    const gemini = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          content: { parts },
          output_dimensionality: 768,
        }),
      },
    );

    if (!gemini.ok) {
      json(res, 200, { available: false });
      return;
    }

    const result = await gemini.json();
    const values = result?.embedding?.values ?? result?.embeddings?.[0]?.values;
    if (!Array.isArray(values) || values.length !== 768 || values.some((value) => typeof value !== 'number')) {
      json(res, 200, { available: false });
      return;
    }

    json(res, 200, { available: true, embedding: values });
  } catch {
    json(res, 200, { available: false });
  }
}
