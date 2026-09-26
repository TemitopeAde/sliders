import { products, collections, catalogVersioning } from "@wix/stores";
import { currentCartV2 } from "@wix/ecom";
import { safeUrl } from "../../schemas/slider";
export interface StoreProduct {
 catalogVersion?: "V1" | "V3";
  id: string;
  name: string;
  description: string;
  image: string;
  url: string;
  price: string;
  discountedPrice: string;
  amount: number;
  sku: string;
  inStock: boolean;
  onSale: boolean;
  requiresOptions: boolean;
}
export function normalizeProduct(p: products.Product): StoreProduct {
  const price = p.priceData;
  const url = `${p.productPageUrl?.base ?? ""}${p.productPageUrl?.path ?? ""}`;
  return {
    id: p._id ?? "",
    name: p.name ?? "Product",
    description: (p.description ?? "").replace(/<[^>]*>/g, ""),
    image: p.media?.mainMedia?.image?.url ?? "",
    url: safeUrl.safeParse(url).success ? url : "",
    price: price?.formatted?.price ?? "",
    discountedPrice: price?.formatted?.discountedPrice ?? "",
    amount: price?.price ?? 0,
    sku: p.sku ?? "",
    inStock: p.stock?.inventoryStatus === "IN_STOCK",
    onSale: (price?.discountedPrice ?? 0) < (price?.price ?? 0),
    requiresOptions:
      !!p.productOptions?.length ||
      !!p.customTextFields?.some((f) => f.mandatory),
  };
}
export async function queryProducts(
  search = "",
  collectionId = "",
  sort = "manual",
  offset = 0,
) {
  const version=await catalogVersioning.getCatalogVersion();
  if(version.catalogVersion==='STORES_NOT_INSTALLED')throw new Error('Install Wix Stores to select products.');
  if(version.catalogVersion==='V3_CATALOG')return (await import('./products-v3')).queryV3(search,collectionId,sort,offset);
  let query = products.queryProducts().limit(48).skip(offset);
  if (search) query = query.startsWith("name", search);
  if (collectionId) query = query.hasSome("collectionIds", [collectionId]);
  if (sort === "name") query = query.ascending("name");
  if (sort === "price") query = query.ascending("priceData.price");
  if (sort === "newest") query = query.descending("numericId");
  const result = await query.find();
  return {
    items: result.items
      .filter((p) => p.visible !== false)
      .map(normalizeProduct),
    hasNext: result.hasNext(),
  };
}
export async function getProduct(id: string) {
  const version=await catalogVersioning.getCatalogVersion();
  if(version.catalogVersion==='V3_CATALOG')return (await import('./products-v3')).getV3(id);
  const { product } = await products.getProduct(id);
  return product && product.visible !== false
    ? normalizeProduct(product)
    : null;
}
export async function queryCollections() {
  const version=await catalogVersioning.getCatalogVersion();
  if(version.catalogVersion==='V3_CATALOG')return (await import('./products-v3')).collectionsV3();
  let result = await collections.queryCollections().limit(100).find();
  const list = [...result.items];
  while (result.hasNext()) {
    result = await result.next();
    list.push(...result.items);
  }
  return list.map((c) => ({ id: c._id ?? "", name: c.name ?? "Collection" }));
}
export async function addToCart(product: StoreProduct) {
  if (product.requiresOptions)
    throw new Error("Choose product options on the product page.");
  if (!product.inStock) throw new Error("This product is out of stock.");
  const variantId=product.catalogVersion==='V3'?await (await import('./products-v3')).defaultVariant(product.id):undefined;
  await currentCartV2.addLineItemsToCurrentCart({
    catalogItems: [
      {
        quantity: 1,
        catalogReference: {
          appId: "215238eb-22a5-4c36-9e7b-e7c08025e04e",
          ...(variantId?{options:{variantId}}:{}),
          catalogItemId: product.id,
        },
      },
    ],
  });
}
