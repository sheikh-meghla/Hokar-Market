// Loads the storefront catalog (lib/products.ts) into the database.
// Safe to re-run: products are matched by id and their stock is never reset.
//   node prisma/seed.mjs
import "dotenv/config";
import pg from "pg";
import { products } from "../lib/products.ts";

const categories = {
  necklaces: { name: "Necklaces", nameBn: "নেকলেস" },
  bracelets: { name: "Bracelets", nameBn: "ব্রেসলেট" },
  rings: { name: "Rings", nameBn: "আংটি" },
};

const photo = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=85`;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query("BEGIN");

  const categoryIds = {};
  for (const [slug, { name, nameBn }] of Object.entries(categories)) {
    const { rows } = await client.query(
      `INSERT INTO "Category" (id, name, "nameBn", slug, "updatedAt")
       VALUES ($1, $2, $3, $1, now())
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, "nameBn" = EXCLUDED."nameBn", "updatedAt" = now()
       RETURNING id`,
      [slug, name, nameBn],
    );
    categoryIds[slug] = rows[0].id;
  }

  for (const p of products) {
    await client.query(
      `INSERT INTO "Product"
         (id, name, "nameBn", slug, description, "descriptionBn", price, "oldPrice",
          stock, gender, images, sizes, colors, "isActive", "categoryId", "updatedAt")
       VALUES ($1, $2, $3, $1, $4, $5, $6, $7, $8, $9::"Gender", $10, $11, $12, $13, $14, now())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, "nameBn" = EXCLUDED."nameBn",
         description = EXCLUDED.description, "descriptionBn" = EXCLUDED."descriptionBn",
         price = EXCLUDED.price, "oldPrice" = EXCLUDED."oldPrice", gender = EXCLUDED.gender,
         images = EXCLUDED.images, sizes = EXCLUDED.sizes, colors = EXCLUDED.colors,
         "isActive" = EXCLUDED."isActive", "categoryId" = EXCLUDED."categoryId", "updatedAt" = now()`,
      [
        p.id,
        p.name.en,
        p.name.bn,
        p.description.en,
        p.description.bn,
        p.price,
        p.oldPrice,
        p.stock ?? 0,
        p.gender,
        p.photos.map(photo),
        p.sizes ?? [],
        p.colors ?? [],
        p.active !== false,
        categoryIds[p.category],
      ],
    );
  }

  await client.query("COMMIT");
  console.log(`Seeded ${Object.keys(categories).length} categories and ${products.length} products.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
