import type { FoundItem } from '../types';
import { CATEGORY_OPTIONS } from './categories';

function leadingCapital(value: string): string {
  const lower = value.trim().toLowerCase();
  if (!lower) return '';
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Colour and type only. Brand, photos, and marks stay off the student listing. */
export function studentItemLabel(item: Pick<FoundItem, 'category' | 'subcategory' | 'colour'>): string {
  if (item.category === 'WatCard') return 'WatCard';
  const named = CATEGORY_OPTIONS.find((option) => option.id === item.category)?.label ?? item.category;
  const kind = item.subcategory && item.subcategory.toLowerCase() !== 'other' ? item.subcategory : named;
  const colour = item.colour.trim();
  return colour ? `${leadingCapital(colour)} ${kind.toLowerCase()}` : leadingCapital(kind);
}

/** "Claimed · Nov 13, 12:13 PM" — no seconds, no raw system words. */
export function formatHistoryLine(eventType: string, createdAt: string): string {
  const words = eventType.replace(/[-_]/g, ' ').trim().split(/\s+/).filter(Boolean);
  const label = words
    .map((word, index) => (index === 0 ? leadingCapital(word) : word.toLowerCase()))
    .join(' ') || 'Update';
  const when = new Date(createdAt);
  const date = when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = when.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${label} · ${date}, ${time}`;
}

export function forStudentView(item: FoundItem): FoundItem {
  const label = studentItemLabel(item);
  return {
    ...item,
    title: label,
    publicDescription: label,
    brand: undefined,
    detailedDescription: undefined,
    distinctiveFeatures: undefined,
    imageUrl: undefined,
    imagePath: undefined,
    imageBucket: null,
    watcardName: undefined,
    locationFound: undefined,
    dropOffCode: undefined,
    storageSpot: undefined,
  };
}
