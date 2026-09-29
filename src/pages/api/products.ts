import { route } from "../../lib/api/server";
import { getStoresInstallation, queryProducts } from "../../lib/wix/products";
import { z } from "zod";
export const GET = route(({ url }) => {
  if (url.searchParams.get("mode") === "installation")
    return getStoresInstallation();
  const query = z
    .object({
      search: z.string().max(100),
      collection: z.string().max(100),
      sort: z.enum(["manual", "newest", "name", "price"]),
      offset: z.coerce.number().int().min(0).max(100000),
    })
    .parse({
      search: url.searchParams.get("search") ?? "",
      collection: url.searchParams.get("collection") ?? "",
      sort: url.searchParams.get("sort") ?? "manual",
      offset: url.searchParams.get("offset") ?? 0,
    });
  return queryProducts(
    query.search,
    query.collection,
    query.sort,
    query.offset,
  );
});
