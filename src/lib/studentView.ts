import type { FoundItem } from '../types';
import { CATEGORY_OPTIONS } from './categories';

/** Colour and type only. Brand, photos, and marks stay off the student listing. */
export function studentItemLabel(item: Pick<FoundItem, 'category' | 'subcategory' | 'colour'>): string {
  if (item.category === 'WatCard') return 'WatCard';
  const named = CATEGORY_OPTIONS.find((option) => option.id === item.category)?.label ?? item.category;
  const kind = item.subcategory && item.subcategory.toLowerCase() !== 'other' ? item.subcategory : named;
  const colour = item.colour.trim();
  return colour ? `${colour} ${kind}` : kind;
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
