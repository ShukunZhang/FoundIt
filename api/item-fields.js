export const CATEGORIES = ['WatCard', 'wallet', 'electronics', 'keys', 'bottle', 'clothing', 'bag', 'supplies', 'other'];

const SUBCATEGORIES = {
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

function text(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Keeps model output inside the lost-item form's allowed values. */
export function sanitizeItem(parsed) {
  const source = parsed && typeof parsed === 'object' ? parsed : {};
  const category = CATEGORIES.includes(source.category) ? source.category : '';
  const allowed = category ? SUBCATEGORIES[category] : [];
  const subcategory = allowed.includes(source.subcategory) ? source.subcategory : '';
  const lostAt = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(source.lostAt || '')
    ? String(source.lostAt).slice(0, 16)
    : '';
  return {
    title: text(source.title, 80),
    category,
    subcategory,
    colour: text(source.colour, 40),
    brand: text(source.brand, 60),
    description: text(source.description, 400),
    distinctiveFeatures: text(source.distinctiveFeatures, 240),
    privateDetails: text(source.privateDetails, 240),
    building: text(source.building, 80),
    locationDetail: text(source.locationDetail, 240),
    lostAt,
  };
}

export function itemFieldPrompt(source) {
  const subcategoryGuide = Object.entries(SUBCATEGORIES)
    .map(([category, options]) => `${category}: ${options.join(', ')}`)
    .join('; ');
  return [
    source === 'photo'
      ? 'You identify a lost-and-found item from a photo.'
      : 'You turn a student description of a lost item into lost-and-found form fields.',
    `The current time is ${new Date().toISOString()}.`,
    'Reply with JSON only, no markdown, using these keys:',
    'title (short name such as "Blue water bottle"),',
    `category (one of ${CATEGORIES.join(', ')}, or empty),`,
    'subcategory (one allowed value for that category, or empty),',
    'colour, brand, description, distinctiveFeatures, privateDetails,',
    'building (campus building such as DC, SLC, PAC, REV, or Dana Porter, or empty),',
    'locationDetail (room or spot, or empty),',
    'lostAt (YYYY-MM-DDTHH:mm when a time was given, otherwise empty).',
    `Allowed subcategories: ${subcategoryGuide}.`,
    'Do not invent a person name, student number, or card number.',
    'If a field is unclear, use an empty string.',
  ].join(' ');
}
