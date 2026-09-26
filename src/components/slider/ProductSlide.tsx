import { useEffect, useState } from "react";
import type { Slide } from "../../schemas/slider";
import {
  getProduct,
  addToCart,
  type StoreProduct,
} from "../../lib/wix/products";
export function ProductSlide({
  slide,
  onEvent,
  preview,
}: {
  slide: Extract<Slide, { type: "product" }>;
  onEvent: (event: "product_click" | "add_to_cart_click") => void;
  preview: boolean;
}) {
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!slide.productId) {
      setError("Choose a product in the editor");
      return;
    }
    getProduct(slide.productId)
      .then((p) => {
        if (alive) {
          setProduct(p);
          setError(p ? "" : "Product unavailable");
        }
      })
      .catch(() => {
        if (alive) setError("Product unavailable");
      });
    return () => {
      alive = false;
    };
  }, [slide.productId]);
  const f = slide.productFields;
  return (
    <article className="sl-product">
      {error ? (
        <p role="status" style={{ padding: 24 }}>
          {error}
        </p>
      ) : !product ? (
        <p role="status" style={{ padding: 24 }}>
          Loading product…
        </p>
      ) : (
        <>
          {f.image && product.image && (
            <img loading="lazy" src={product.image} alt={product.name} />
          )}
          <div className="sl-product-content">
            {f.saleBadge && product.onSale && <small>ON SALE</small>}
            {f.name && <h2>{product.name}</h2>}
            {f.description && <p>{product.description}</p>}
            {f.price && (
              <p>
                {product.onSale && f.discountedPrice ? (
                  <>
                    <del>{product.price}</del>
                    {product.discountedPrice}
                  </>
                ) : (
                  product.price
                )}
              </p>
            )}
            {f.sku && <p>SKU: {product.sku || "—"}</p>}
            {f.stock && <p>{product.inStock ? "In stock" : "Out of stock"}</p>}
            <div className="sl-buttons">
              {f.viewProduct && product.url && (
                <a
                  href={product.url}
                  onClick={(e) => {
                    if (preview) e.preventDefault();
                    else onEvent("product_click");
                  }}
                >
                  View product →
                </a>
              )}
              {f.addToCart &&
                (product.requiresOptions ? (
                  <a
                    href={product.url}
                    onClick={(e) => {
                      if (preview) e.preventDefault();
                    }}
                  >
                    Choose options
                  </a>
                ) : (
                  <button
                    disabled={busy || !product.inStock || preview}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await addToCart(product);
                        setAdded(true);
                        onEvent("add_to_cart_click");
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "Could not add to cart",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {busy
                      ? "Adding…"
                      : added
                        ? "Added to cart"
                        : !product.inStock
                          ? "Out of stock"
                          : "Add to cart"}
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </article>
  );
}
