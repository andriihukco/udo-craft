import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../apps/admin/.env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KEYCRM_API_KEY = process.env.KEYCRM_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/admin/.env");
  process.exit(1);
}

if (!KEYCRM_API_KEY) {
  console.error("Missing KEYCRM_API_KEY in apps/admin/.env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const UA_MAP = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh", з: "z",
  и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ь: "", ю: "yu", я: "ya",
};

function slugify(input) {
  const slug = String(input || "")
    .toLowerCase()
    .split("")
    .map((char) => UA_MAP[char] ?? char)
    .join("")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "item";
}

function moneyToCents(value) {
  return Math.round(Number(value || 0) * 100);
}

function propertyValue(properties, names) {
  const normalizedNames = names.map((name) => name.toLowerCase());
  return properties?.find((property) => {
    const name = String(property?.name || "").toLowerCase();
    return normalizedNames.some((needle) => name.includes(needle));
  })?.value;
}

function productImages(product) {
  const images = [];

  if (product.thumbnail_url) {
    images.push({
      key: "main",
      url: product.thumbnail_url,
      label: "Main",
      is_customizable: false,
      sort_order: 0,
    });
  }

  for (const attachment of product.attachments_data ?? []) {
    const url = attachment?.url || attachment?.thumbnail_url || attachment?.file_url;
    if (!url || images.some((image) => image.url === url)) continue;
    images.push({
      key: `gallery_${images.length}`,
      url,
      label: attachment?.name || `Gallery ${images.length}`,
      is_customizable: false,
      sort_order: images.length,
    });
  }

  return images;
}

async function keycrmGet(pathname, params = {}) {
  const url = new URL(`https://openapi.keycrm.app/v1/${pathname}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${KEYCRM_API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`KeyCRM ${pathname} failed: HTTP ${response.status} ${body}`);
  }

  return response.json();
}

async function fetchAll(pathname, limit = 50) {
  const rows = [];
  let page = 1;

  for (;;) {
    const data = await keycrmGet(pathname, { limit, page });
    rows.push(...(data.data ?? []));

    if (!data.next_page_url || page >= data.last_page) break;
    page += 1;
  }

  return rows;
}

async function upsertCategory(category, sortOrder) {
  const slug = `keycrm-${category.id}-${slugify(category.name)}`;
  const payload = {
    name: category.name,
    slug,
    sort_order: sortOrder,
    is_active: true,
    image_url: null,
  };

  const { data, error } = await supabase
    .from("categories")
    .upsert(payload, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) throw new Error(`Category ${category.id} sync failed: ${error.message}`);
  return data.id;
}

async function findOrCreateMaterial(name, sortOrder) {
  const cleanName = String(name || "").trim();
  if (!cleanName) return null;

  const { data: existing, error: selectError } = await supabase
    .from("materials")
    .select("id")
    .eq("name", cleanName)
    .maybeSingle();

  if (selectError) throw new Error(`Material lookup failed for ${cleanName}: ${selectError.message}`);
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("materials")
    .insert({
      name: cleanName,
      hex_code: "#000000",
      is_active: true,
      sort_order: sortOrder,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Material ${cleanName} sync failed: ${error.message}`);
  return data.id;
}

async function upsertProduct(product, categoryId, offers) {
  const images = productImages(product);
  const sizes = Array.from(
    new Set(
      offers
        .map((offer) => propertyValue(offer.properties, ["розмір", "size"]))
        .filter(Boolean)
        .map((size) => String(size).trim())
    )
  );

  const price = product.min_price ?? product.price ?? product.max_price ?? 0;
  const slug = `keycrm-${product.id}-${slugify(product.name)}`;

  const payload = {
    name: product.name,
    slug,
    description: product.description || "",
    base_price_cents: moneyToCents(price),
    images: images[0] ? { main: images[0].url } : {},
    product_images: images,
    px_to_mm_ratio: 0.5,
    collar_y_px: 0,
    is_active: !product.is_archived,
    is_customizable: false,
    available_sizes: sizes.length ? sizes : ["S", "M", "L", "XL"],
    category_id: categoryId ?? null,
  };

  const { data, error } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) throw new Error(`Product ${product.id} sync failed: ${error.message}`);
  return data.id;
}

async function syncVariants(productId, offers, materialSortOffset) {
  let synced = 0;
  const colors = Array.from(
    new Set(
      offers
        .map((offer) => propertyValue(offer.properties, ["колір", "color"]))
        .filter(Boolean)
        .map((color) => String(color).trim())
    )
  );

  for (const [index, color] of colors.entries()) {
    const materialId = await findOrCreateMaterial(color, materialSortOffset + index);
    if (!materialId) continue;

    const offerWithImage = offers.find((offer) => {
      const offerColor = propertyValue(offer.properties, ["колір", "color"]);
      return String(offerColor || "").trim() === color && offer.thumbnail_url;
    });

    const variantImages = offerWithImage?.thumbnail_url
      ? [{
          key: "main",
          url: offerWithImage.thumbnail_url,
          label: "Main",
          is_customizable: false,
          sort_order: 0,
        }]
      : [];

    const { error } = await supabase
      .from("product_color_variants")
      .upsert({
        product_id: productId,
        material_id: materialId,
        images: variantImages[0] ? { main: variantImages[0].url } : {},
        variant_images: variantImages,
        sort_order: index,
        is_active: true,
      }, { onConflict: "product_id,material_id" });

    if (error) throw new Error(`Variant ${productId}/${color} sync failed: ${error.message}`);
    synced += 1;
  }

  return synced;
}

async function main() {
  console.log("Starting KeyCRM catalog sync...");

  const [keycrmCategories, keycrmProducts, keycrmOffers] = await Promise.all([
    fetchAll("products/categories", 100),
    fetchAll("products", 100),
    fetchAll("offers", 100),
  ]);

  console.log(`Fetched ${keycrmCategories.length} categories, ${keycrmProducts.length} products, ${keycrmOffers.length} offers.`);

  const categoryIds = new Map();
  for (const [index, category] of keycrmCategories.entries()) {
    const id = await upsertCategory(category, index);
    categoryIds.set(category.id, id);
  }

  let productsSynced = 0;
  let variantsSynced = 0;

  for (const product of keycrmProducts) {
    const offers = keycrmOffers.filter((offer) => offer.product_id === product.id && !offer.is_archived);
    const productId = await upsertProduct(product, categoryIds.get(product.category_id) ?? null, offers);
    variantsSynced += await syncVariants(productId, offers, variantsSynced);
    productsSynced += 1;
  }

  console.log("KeyCRM catalog sync complete.");
  console.log(`Categories synced: ${keycrmCategories.length}`);
  console.log(`Products synced: ${productsSynced}`);
  console.log(`Color variants synced: ${variantsSynced}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
