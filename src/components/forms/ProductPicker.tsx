import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api/client";
import type { StoreProduct } from "../../lib/wix/products";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
export function ProductPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (p: StoreProduct) => void;
}) {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(search);
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const query = useQuery({
    queryKey: ["products", term, offset],
    queryFn: () =>
      api<{ items: StoreProduct[]; hasNext: boolean }>(
        `products?search=${encodeURIComponent(term)}&offset=${offset}`,
      ),
  });
  return (
    <div>
      <Input
        aria-label="Search Wix products"
        placeholder="Search Wix products…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-52 overflow-y-auto mt-2 space-y-1">
        {query.isPending ? (
          <p className="muted">Loading products…</p>
        ) : query.isError ? (
          <p role="alert" className="text-sm text-red-600">
            {query.error.message} Check that Wix Stores is installed.
          </p>
        ) : query.data.items.length ? (
          query.data.items.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`w-full flex items-center gap-3 p-2 rounded-md text-left text-sm ${selected === p.id ? "bg-blue-50 ring-1 ring-blue-400" : "hover:bg-gray-50"}`}
              onClick={() => onSelect(p)}
            >
              {p.image && (
                <img
                  src={p.image}
                  alt=""
                  className="w-10 h-10 object-cover rounded"
                />
              )}
              <span className="flex-1">{p.name}</span>
              <span>{p.price}</span>
            </button>
          ))
        ) : (
          <p className="muted py-3">No products found.</p>
        )}
      </div>
      <div className="flex justify-between mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!offset}
          onClick={() => setOffset((v) => Math.max(0, v - 48))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!query.data?.hasNext}
          onClick={() => setOffset((v) => v + 48)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
