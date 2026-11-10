import type { Category, PhotoScanResult } from '../types';
import { CATEGORY_OPTIONS } from './categories';

const COLOUR_SAMPLES: Array<{ name: string; r: number; g: number; b: number }> = [
  { name: 'Black', r: 25, g: 25, b: 25 },
  { name: 'White', r: 245, g: 245, b: 245 },
  { name: 'Grey', r: 150, g: 150, b: 150 },
  { name: 'Navy Blue', r: 25, g: 45, b: 95 },
  { name: 'Blue', r: 45, g: 110, b: 200 },
  { name: 'Yellow', r: 235, g: 200, b: 40 },
  { name: 'Red', r: 185, g: 45, b: 45 },
  { name: 'Green', r: 45, g: 140, b: 70 },
  { name: 'Purple', r: 120, g: 60, b: 165 },
  { name: 'Brown', r: 125, g: 80, b: 45 },
  { name: 'Pink', r: 230, g: 145, b: 170 },
];

function nearestColour(r: number, g: number, b: number): string {
  let best = COLOUR_SAMPLES[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const sample of COLOUR_SAMPLES) {
    const distance = (sample.r - r) ** 2 + (sample.g - g) ** 2 + (sample.b - b) ** 2;
    if (distance < bestDistance) {
      best = sample;
      bestDistance = distance;
    }
  }
  return best.name;
}

async function compressImage(file: File): Promise<{ file: File; dataUrl: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('This browser cannot read the photo.');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Could not compress the photo.'));
    }, 'image/jpeg', 0.72);
  });
  const compressed = new File([blob], 'item.jpg', { type: 'image/jpeg' });
  const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
  return { file: compressed, dataUrl };
}

function dominantColour(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not sample the photo.'));
        return;
      }
      context.drawImage(image, 0, 0, 24, 24);
      const pixels = context.getImageData(0, 0, 24, 24).data;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const brightness = (red + green + blue) / 3;
        if (brightness > 245) continue;
        r += red;
        g += green;
        b += blue;
        count += 1;
      }
      if (count === 0) {
        resolve('White');
        return;
      }
      resolve(nearestColour(r / count, g / count, b / count));
    };
    image.onerror = () => reject(new Error('Could not open the photo.'));
    image.src = dataUrl;
  });
}

function isCategory(value: unknown): value is Category {
  return CATEGORY_OPTIONS.some((option) => option.id === value);
}

/**
 * Reads the main colour from the photo. If a Gemini key is configured on the
 * server, the scan also fills category, brand, and distinctive details.
 */
export async function scanPhoto(file: File): Promise<PhotoScanResult> {
  const compressed = await compressImage(file);
  const colour = await dominantColour(compressed.dataUrl);
  const previewUrl = URL.createObjectURL(compressed.file);
  const base: PhotoScanResult = {
    colour,
    source: 'colour',
    file: compressed.file,
    previewUrl,
  };

  try {
    const response = await fetch('/api/analyze-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: compressed.dataUrl }),
    });
    if (!response.ok) return base;
    const body = (await response.json()) as {
      available?: boolean;
      category?: string;
      subcategory?: string;
      colour?: string;
      brand?: string;
      distinctiveFeatures?: string;
      description?: string;
    };
    if (!body.available) return base;
    return {
      ...base,
      source: 'gemini',
      category: isCategory(body.category) ? body.category : undefined,
      subcategory: body.subcategory,
      colour: body.colour || colour,
      brand: body.brand,
      distinctiveFeatures: body.distinctiveFeatures,
      description: body.description,
    };
  } catch {
    return base;
  }
}
