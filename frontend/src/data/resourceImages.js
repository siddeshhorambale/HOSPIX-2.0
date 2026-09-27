// Frontend-only Resource Image Resolver and Catalog
// Maps resource types, categories, and item names to curated hospitality imagery.

export const RESOURCE_IMAGES = {
  // Chairs
  chairs: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=800&q=80',
  chair: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=800&q=80',
  'banquet chairs': 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=800&q=80',
  'chiavari chairs': 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
  'folding chairs': 'https://images.unsplash.com/photo-1580481077195-c322b64d1f5d?auto=format&fit=crop&w=800&q=80',

  // Tables
  tables: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
  table: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
  'dining tables': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
  'round dining tables': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
  'buffet tables': 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
  'cocktail tables': 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',

  // Catering & Food Equipment
  'chafing dishes': 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
  'buffet setup': 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
  caterer: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',

  // Diningware & Plates
  plates: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  plate: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  'dinner plates': 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  dining: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
  glasses: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
  cutlery: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80',

  // Lighting & AV Equipment
  lighting: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  lights: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  'stage lights': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  'led lights': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  speakers: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
  sound: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
  audiovisual: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',

  // Linen & Decor
  linen: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
  tablecloths: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
  decoration: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
  flowers: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',

  // Furniture / General
  furniture: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=800&q=80',
  sofas: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  tents: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',

  // Fallback Hero & Venue
  venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  hotel: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
};

/**
 * Normalizes input text and returns the most relevant resource image.
 * Works with resource names, categories, or raw search terms.
 * Never modifies or touches backend data.
 */
export function getResourceImage(resourceNameOrCategory) {
  if (!resourceNameOrCategory) return RESOURCE_IMAGES.default;

  const key = String(resourceNameOrCategory).trim().toLowerCase();

  // 1. Direct match
  if (RESOURCE_IMAGES[key]) {
    return RESOURCE_IMAGES[key];
  }

  // 2. Keyword heuristic search
  if (key.includes('chiavari')) return RESOURCE_IMAGES['chiavari chairs'];
  if (key.includes('chair') || key.includes('seating') || key.includes('stool')) return RESOURCE_IMAGES.chairs;
  if (key.includes('round') && key.includes('table')) return RESOURCE_IMAGES['round dining tables'];
  if (key.includes('buffet') && key.includes('table')) return RESOURCE_IMAGES['buffet tables'];
  if (key.includes('cocktail') || key.includes('standing')) return RESOURCE_IMAGES['cocktail tables'];
  if (key.includes('table')) return RESOURCE_IMAGES.tables;
  if (key.includes('chafing') || key.includes('burner') || key.includes('buffet')) return RESOURCE_IMAGES['chafing dishes'];
  if (key.includes('plate') || key.includes('dish') || key.includes('crockery')) return RESOURCE_IMAGES.plates;
  if (key.includes('glass') || key.includes('goblet')) return RESOURCE_IMAGES.glasses;
  if (key.includes('cutlery') || key.includes('fork') || key.includes('spoon')) return RESOURCE_IMAGES.cutlery;
  if (key.includes('light') || key.includes('led') || key.includes('par') || key.includes('lamp')) return RESOURCE_IMAGES.lighting;
  if (key.includes('speaker') || key.includes('audio') || key.includes('sound') || key.includes('mic')) return RESOURCE_IMAGES.speakers;
  if (key.includes('linen') || key.includes('cloth') || key.includes('satin')) return RESOURCE_IMAGES.linen;
  if (key.includes('flower') || key.includes('decor')) return RESOURCE_IMAGES.decoration;
  if (key.includes('sofa') || key.includes('couch')) return RESOURCE_IMAGES.sofas;
  if (key.includes('cater') || key.includes('food')) return RESOURCE_IMAGES.catering;
  if (key.includes('furniture')) return RESOURCE_IMAGES.furniture;

  return RESOURCE_IMAGES.default;
}

export const HERO_IMAGE = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80';
