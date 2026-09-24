// Diacritics (tashkeel) in the Arabic block: fatha/damma/kasra/sukun/tanwin/
// shadda/etc., U+064B-U+0652, plus the superscript alef U+0670.
const ARABIC_DIACRITICS = /[ً-ْٰ]/g;

// Alef variants (madda/hamza-above/hamza-below) all unify to the bare alef
// for matching purposes — most Arabic name spellings vary here inconsistently.
const ALEF_VARIANTS = /[آأإ]/g;

// Trailing teh marbuta reads the same as heh in casual name spelling.
const TEH_MARBUTA = /ة/g;

export function normalizeArabicName(name: string): string {
  return name
    .normalize("NFC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(ALEF_VARIANTS, "ا")
    .replace(TEH_MARBUTA, "ه")
    .trim()
    .toLowerCase();
}
