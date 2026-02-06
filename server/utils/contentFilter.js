/**
 * Content filter for illegal/prohibited items
 * Blocks: Alcohol, Cigarettes/Vape, Drugs/Weed, Weapons
 * Used for listing titles and descriptions
 */

const BANNED_KEYWORDS = [
  // Alcohol
  'alcohol', 'beer', 'wine', 'whisky', 'whiskey', 'vodka', 'rum', 'brandy',
  'liquor', 'drinks', 'bottles', 'pub', 'bar',
  // Cigarettes / Vape
  'cigarette', 'cigarettes', 'cigar', 'vape', 'vaping', 'e-cig', 'ecig',
  'hookah', 'tobacco', 'smoking', 'nicotine',
  // Drugs / Weed
  'weed', 'marijuana', 'cannabis', 'drugs', 'cocaine', 'heroin', 'meth',
  'lsd', 'hash', 'bhang', 'ganja', 'charas',
  // Weapons
  'weapon', 'weapons', 'gun', 'guns', 'knife', 'knives', 'ammunition',
  'pistol', 'rifle', 'revolver', 'explosive', 'bomb',
];

/**
 * Check if text contains banned keywords
 * @param {string} text - Title or description to check
 * @returns {{ isBlocked: boolean, matchedKeywords: string[] }}
 */
export function checkBannedContent(text) {
  if (!text || typeof text !== 'string') {
    return { isBlocked: false, matchedKeywords: [] };
  }

  const lowerText = text.toLowerCase();
  const matchedKeywords = BANNED_KEYWORDS.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase())
  );

  return {
    isBlocked: matchedKeywords.length > 0,
    matchedKeywords,
  };
}
