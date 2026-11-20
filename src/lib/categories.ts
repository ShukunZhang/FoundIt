import type { Category } from '../types';

export interface CategoryOption {
  id: Category;
  label: string;
  valuable: boolean;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'WatCard', label: 'WatCard', valuable: true },
  { id: 'wallet', label: 'Wallet', valuable: true },
  { id: 'electronics', label: 'Electronics', valuable: true },
  { id: 'keys', label: 'Keys', valuable: true },
  { id: 'bottle', label: 'Bottle', valuable: false },
  { id: 'clothing', label: 'Clothing', valuable: false },
  { id: 'bag', label: 'Bag', valuable: false },
  { id: 'supplies', label: 'School supplies', valuable: false },
  { id: 'other', label: 'Other', valuable: false },
];

export const SUBCATEGORIES: Record<Category, string[]> = {
  WatCard: ['Undergraduate', 'Graduate', 'Staff', 'Other'],
  wallet: ['Bifold', 'Cardholder', 'Coin purse', 'Other'],
  electronics: ['Charger', 'Calculator', 'Headphones', 'Laptop', 'Phone', 'Mouse', 'Other'],
  keys: ['House keys', 'Car fob', 'Building fob', 'Lanyard', 'Other'],
  bottle: ['Water bottle', 'Tumbler', 'Mug', 'Other'],
  clothing: ['Jacket', 'Shirt', 'Hat', 'Gloves', 'Other'],
  bag: ['Backpack', 'Tote', 'Pouch', 'Other'],
  supplies: ['Calculator', 'Notebook', 'Pencil case', 'Charger', 'Other'],
  other: ['Other'],
};

/** Keys, WatCards, electronics, and wallets are valuable. Everything else is not. */
export function categoryIsValuable(category: Category, _subcategory?: string): boolean {
  return CATEGORY_OPTIONS.find((option) => option.id === category)?.valuable ?? false;
}
