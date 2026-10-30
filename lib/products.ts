import type { Localized, TranslationKey } from "./translations";

export type CatalogProduct = {
  /** Stable id stored in the cart. */
  id: string;
  /** URL segment of /products/[slug]. */
  slug: string;
  name: Localized;
  category: "necklaces" | "bracelets" | "rings";
  gender: "FEMALE" | "MALE";
  price: number;
  oldPrice: number;
  tag?: TranslationKey;
  description: Localized;
  material?: Localized;
  /** Gallery photos (Unsplash photo ids). The first one is the cover image. */
  photos: string[];
  /** Selectable colour values (stored in the cart as-is). */
  colors?: string[];
  /** Selectable sizes; omit when the product has no size. */
  sizes?: string[];
  /** Units available; omit when stock is not tracked. */
  stock?: number;
  /** Set to false to stop selling a product without deleting it. */
  active?: boolean;
};

export const categoryLabelKey: Record<
  CatalogProduct["category"],
  TranslationKey
> = {
  necklaces: "navNecklaces",
  bracelets: "navBracelets",
  rings: "navRings",
};

export function unsplash(photoId: string, width = 900) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=85`;
}

// Every product owns its photos; nothing is shared through a fallback image.
export const products: CatalogProduct[] = [
  {
    id: "classic-gold-necklace",
    slug: "classic-gold-necklace",
    name: { en: "Classic Gold Necklace", bn: "ক্লাসিক গোল্ড নেকলেস" },
    category: "necklaces",
    gender: "FEMALE",
    stock: 20,
    price: 2499,
    oldPrice: 2999,
    tag: "tagBestseller",
    description: {
      en: "A timeless gold-tone necklace with a smooth, polished finish. A graceful everyday piece that also suits special occasions.",
      bn: "মসৃণ ও পালিশ করা ফিনিশের একটি চিরায়ত গোল্ড-টোন নেকলেস। প্রতিদিনের পাশাপাশি বিশেষ অনুষ্ঠানেও মানানসই।",
    },
    photos: ["1599643478518-a784e5dc4c8f"],
  },
  {
    id: "elegant-silver-bracelet",
    slug: "elegant-silver-bracelet",
    name: { en: "Elegant Silver Bracelet", bn: "এলিগ্যান্ট সিলভার ব্রেসলেট" },
    category: "bracelets",
    gender: "MALE",
    stock: 20,
    price: 1999,
    oldPrice: 2499,
    tag: "tagPopular",
    description: {
      en: "A slim silver-tone bracelet with a refined, lightweight feel. Easy to wear alone or stacked with others.",
      bn: "হালকা ও মার্জিত অনুভূতির একটি সরু সিলভার-টোন ব্রেসলেট। একা বা অন্যগুলোর সঙ্গে একসাথে পরার জন্য সহজ।",
    },
    photos: ["1611591437281-460bfbe1220a"],
  },
  {
    id: "diamond-style-ring",
    slug: "diamond-style-ring",
    name: { en: "Diamond Style Ring", bn: "ডায়মন্ড স্টাইল আংটি" },
    category: "rings",
    gender: "FEMALE",
    stock: 20,
    price: 1499,
    oldPrice: 1799,
    tag: "tagSale",
    description: {
      en: "A sparkling ring with a diamond-style stone that catches the light from every angle.",
      bn: "ডায়মন্ডের মতো ঝলমলে পাথরের একটি আংটি, যা সব দিক থেকে আলো ধরে।",
    },
    photos: ["1605100804763-247f67b3557e"],
    sizes: ["6", "7", "8", "9", "10"],
  },
  {
    id: "golden-chain-bracelet",
    slug: "golden-chain-bracelet",
    name: { en: "Golden Chain Bracelet", bn: "গোল্ডেন চেইন ব্রেসলেট" },
    category: "bracelets",
    gender: "MALE",
    stock: 20,
    price: 2199,
    oldPrice: 2599,
    description: {
      en: "A golden chain bracelet with a classic link design. A simple way to add warmth to any outfit.",
      bn: "ক্লাসিক লিংক নকশার একটি গোল্ডেন চেইন ব্রেসলেট। যেকোনো পোশাকে উষ্ণ ছোঁয়া যোগ করে।",
    },
    photos: ["1611652022419-a9419f74343d"],
  },
  {
    id: "tara-stacking-ring",
    slug: "tara-stacking-ring",
    name: { en: "Tara Stacking Ring", bn: "তারা স্ট্যাকিং রিং" },
    category: "rings",
    gender: "FEMALE",
    stock: 20,
    price: 1950,
    oldPrice: 2499,
    description: {
      en: "A light-catching stacking ring with a clean, timeless shape. Perfect for everyday elegance and special moments.",
      bn: "আলো ঝলমলে, পরিচ্ছন্ন ও চিরায়ত নকশার একটি স্ট্যাকিং আংটি। প্রতিদিনের সৌন্দর্য ও বিশেষ মুহূর্তের জন্য আদর্শ।",
    },
    material: {
      en: "Gold plated sterling silver",
      bn: "সোনালি প্লেটেড স্টার্লিং সিলভার",
    },
    photos: [
      "1603561596112-0a132b757442",
      "1602173574767-37ac01994b2a",
      "1605100804763-247f67b3557e",
    ],
    colors: ["Gold", "Silver", "Rose Gold"],
    sizes: ["6", "7", "8", "9", "10"],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: CatalogProduct, limit = 4) {
  const others = products.filter((item) => item.id !== product.id);
  const sameCategory = others.filter(
    (item) => item.category === product.category,
  );
  const rest = others.filter((item) => item.category !== product.category);
  return [...sameCategory, ...rest].slice(0, limit);
}
