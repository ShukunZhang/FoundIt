import { requireClient } from './supabase';

const EMBEDDING_DIMENSION = 768;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the photo.'));
    reader.readAsDataURL(file);
  });
}

/** Joins the fields that should be embedded when there is no photo. */
export function describeForMatch(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim() ?? '')
    .filter((part) => part.length > 0)
    .join('. ')
    .slice(0, 2000);
}

/**
 * Embeds a photo when one exists, otherwise the written description.
 * Returns null when the embedding service is unavailable so the text scorer can still run.
 */
export async function createMatchEmbedding(input: {
  file?: File | null;
  text?: string;
}): Promise<number[] | null> {
  const text = input.text?.trim() ?? '';
  const image = input.file ? await readFileAsDataUrl(input.file) : '';
  if (!image && text.length < 3) return null;

  try {
    const response = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(image ? { image } : { text }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { available?: boolean; embedding?: unknown };
    if (!body.available || !Array.isArray(body.embedding) || body.embedding.length !== EMBEDDING_DIMENSION) {
      return null;
    }
    const values = body.embedding.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    return values.length === EMBEDDING_DIMENSION ? values : null;
  } catch {
    return null;
  }
}

/** Stores the embedding on a row the caller owns, then re-runs matching. */
export async function rememberEmbedding(
  kind: 'found' | 'lost',
  id: string,
  input: { file?: File | null; text?: string },
): Promise<void> {
  const values = await createMatchEmbedding(input);
  if (!values) return;
  const client = requireClient();
  const { error } = await client.rpc('attach_match_embedding', {
    target_kind: kind,
    target_id: id,
    embedding: `[${values.join(',')}]`,
  });
  if (error) throw new Error(error.message);
}
