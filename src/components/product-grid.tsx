"use client";

import { useState, useEffect } from "react";
import { Product } from "@/lib/product-fetcher";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingCart } from "lucide-react";

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, params: any) => void;
  }
}

interface ProductGridProps {
  query?: string;
  category?: string;
  type?: "search" | "category" | "trending" | "celebrity";
  celebrity?: string;
  itemType?: string;
  limit?: number;
  title?: string;
}

export function ProductGrid({
  query,
  category,
  type = "search",
  celebrity,
  itemType,
  limit = 8,
  title,
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          type,
          limit: limit.toString(),
        });

        if (query) params.append("query", query);
        if (category) params.append("category", category);
        if (celebrity) params.append("celebrity", celebrity);
        if (itemType) params.append("itemType", itemType);

        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();

        if (data.success) {
          setProducts(data.products);
        } else {
          setError(data.error || "Failed to fetch products");
        }
      } catch (err) {
        setError("Failed to fetch products");
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, category, type, celebrity, itemType, limit]);

  const handleProductClick = (product: Product) => {
    // Track product click for analytics (non-blocking)
    if (typeof window !== "undefined" && window.gtag) {
      try {
        window.gtag("event", "product_click", {
          product_id: product.id,
          product_name: product.name,
          product_brand: product.brand,
          product_price: product.price,
          retailer: product.retailer,
        });
      } catch (error) {
        console.warn("Analytics tracking failed:", error);
      }
    }

    // Open product link in new tab
    window.open(product.url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-t-lg" />
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No products found</p>
        <p className="text-sm text-gray-400">
          Try adjusting your search terms or browse trending items
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className="group hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-square overflow-hidden rounded-t-lg">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  // Fallback image if product image fails to load
                  e.currentTarget.src = "/images/placeholder-product.png";
                }}
              />
              {product.brand && (
                <Badge className="absolute top-2 left-2 bg-black/70 text-white">
                  {product.brand}
                </Badge>
              )}
            </div>

            <CardContent className="p-4">
              <h4 className="font-medium text-sm line-clamp-2 mb-2">
                {product.name}
              </h4>
              <p className="text-lg font-bold text-green-600">
                {product.price}
              </p>
              <p className="text-xs text-gray-500 mt-1">{product.retailer}</p>
            </CardContent>

            <CardFooter className="p-4 pt-0">
              <Button
                onClick={() => handleProductClick(product)}
                className="w-full group-hover:bg-green-600 transition-colors"
                size="sm"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Product
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
