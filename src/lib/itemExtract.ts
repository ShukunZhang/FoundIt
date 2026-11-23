import type { Category, ItemFeatures } from '../types';
import { CATEGORY_OPTIONS, SUBCATEGORIES } from './categories';

function isCategory(value: unknown): value is Category {
  return CATEGORY_OPTIONS.some((option) => option.id === value);
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Reads the JSON returned by the photo and voice extraction routes. */
export function readItemFeatures(body: Record<string, unknown>): ItemFeatures {
  const category = isCategory(body.category) ? body.category : undefined;
  const subcategory = clean(body.subcategory);
  const allowed = category ? SUBCATEGORIES[category] : [];
  return {
    title: clean(body.title) || undefined,
    category,
    subcategory: allowed.includes(subcategory) ? subcategory : undefined,
    colour: clean(body.colour) || undefined,
    brand: clean(body.brand) || undefined,
    description: clean(body.description) || undefined,
    distinctiveFeatures: clean(body.distinctiveFeatures) || undefined,
    privateDetails: clean(body.privateDetails) || undefined,
    building: clean(body.building) || undefined,
    locationDetail: clean(body.locationDetail) || undefined,
    lostAt: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(clean(body.lostAt)) ? clean(body.lostAt).slice(0, 16) : undefined,
  };
}

/** Sends a spoken or typed description to the model and returns form fields. */
export async function extractItemDescription(text: string): Promise<ItemFeatures | null> {
  const response = await fetch('/api/extract-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.trim() }),
  });
  if (!response.ok) {
    throw new Error('The description could not be read.');
  }
  const body = (await response.json()) as Record<string, unknown>;
  if (!body.available) return null;
  return readItemFeatures(body);
}
