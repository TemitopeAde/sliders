import { route } from "../../lib/api/server";
import { queryCollections } from "../../lib/wix/products";
export const GET = route(() => queryCollections());
