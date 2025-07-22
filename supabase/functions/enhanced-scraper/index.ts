import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProductData {
  name: string;
  brand: string;
  price: string;
  image_url: string;
  website_url: string;
  website: string;
  availability: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, category = "all" } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Searching for: ${query} in category: ${category}`);

    // Search multiple platforms simultaneously
    const searchPromises = [
      searchShopEncore(query, category),
      searchGrailed(query, category),
      searchVestiaire(query, category),
      searchSSENSE(query, category),
      searchEndClothing(query, category),
    ];

    const results = await Promise.allSettled(searchPromises);
    const products: ProductData[] = [];

    // Collect successful results
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        products.push(...result.value);
      } else {
        console.warn(
          `Search ${index} failed:`,
          result.status === "rejected" ? result.reason : "No results",
        );
      }
    });

    // Sort by relevance and remove duplicates
    const uniqueProducts = removeDuplicates(products);
    const sortedProducts = sortByRelevance(uniqueProducts, query);

    return new Response(
      JSON.stringify({
        products: sortedProducts.slice(0, 20), // Limit to top 20 results
        total: sortedProducts.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in enhanced scraper:", error);
    return new Response(
      JSON.stringify({ error: "Failed to search products" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function searchShopEncore(
  query: string,
  category: string,
): Promise<ProductData[]> {
  try {
    const searchUrl = `https://www.shopencore.ai/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    const products: ProductData[] = [];

    // Shop Encore specific selectors
    const productElements = doc.querySelectorAll(
      '.product-item, .item-card, [data-testid="product-card"]',
    );

    for (const element of productElements) {
      try {
        const nameEl = element.querySelector(
          ".product-name, .item-name, h3, h4",
        );
        const priceEl = element.querySelector(
          '.price, .product-price, [data-testid="price"]',
        );
        const imageEl = element.querySelector("img") as HTMLImageElement;
        const linkEl = element.querySelector("a");

        if (nameEl && priceEl && imageEl) {
          const name = nameEl.textContent?.trim() || "";
          const price = priceEl.textContent?.trim() || "";
          const imageUrl =
            imageEl.src || imageEl.getAttribute("data-src") || "";
          const productUrl = linkEl?.href || "";

          if (name && price) {
            // Ensure we have a valid image URL
            let finalImageUrl = "";

            if (imageUrl) {
              if (imageUrl.startsWith("http")) {
                finalImageUrl = imageUrl;
              } else if (imageUrl.startsWith("/")) {
                finalImageUrl = `https://www.shopencore.ai${imageUrl}`;
              } else {
                finalImageUrl = `https://www.shopencore.ai/${imageUrl}`;
              }
            }

            // If no valid image URL found, use a category-specific placeholder
            if (!finalImageUrl) {
              const categoryImages = {
                tops: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
                bottoms:
                  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80",
                shoes:
                  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
                accessories:
                  "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80",
              };
              finalImageUrl =
                categoryImages[category] ||
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80";
            }

            products.push({
              name,
              brand: extractBrand(name),
              price: cleanPrice(price),
              image_url: finalImageUrl,
              website_url:
                productUrl && productUrl.startsWith("http")
                  ? productUrl
                  : productUrl
                    ? `https://www.shopencore.ai${productUrl}`
                    : "https://www.shopencore.ai",
              website: "Shop Encore",
              availability: "In Stock",
              description: name,
            });
          }
        }
      } catch (error) {
        console.warn("Error parsing Shop Encore product:", error);
      }
    }

    return products;
  } catch (error) {
    console.error("Shop Encore search failed:", error);
    return [];
  }
}

async function searchGrailed(
  query: string,
  category: string,
): Promise<ProductData[]> {
  try {
    const searchUrl = `https://www.grailed.com/search?query=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    const products: ProductData[] = [];

    // Grailed specific selectors
    const productElements = doc.querySelectorAll(
      '.feed-item, .listing-item, [data-testid="listing-item"]',
    );

    for (const element of productElements) {
      try {
        const nameEl = element.querySelector(".listing-title, .item-title, h3");
        const priceEl = element.querySelector(".price, .listing-price");
        const imageEl = element.querySelector("img") as HTMLImageElement;
        const linkEl = element.querySelector("a");

        if (nameEl && priceEl && imageEl) {
          const name = nameEl.textContent?.trim() || "";
          const price = priceEl.textContent?.trim() || "";
          const imageUrl =
            imageEl.src || imageEl.getAttribute("data-src") || "";
          const productUrl = linkEl?.href || "";

          if (name && price) {
            // Ensure we have a valid image URL
            let finalImageUrl = "";

            if (imageUrl) {
              if (imageUrl.startsWith("http")) {
                finalImageUrl = imageUrl;
              } else if (imageUrl.startsWith("/")) {
                finalImageUrl = `https://www.grailed.com${imageUrl}`;
              } else {
                finalImageUrl = `https://www.grailed.com/${imageUrl}`;
              }
            }

            // If no valid image URL found, use a category-specific placeholder
            if (!finalImageUrl) {
              const categoryImages = {
                tops: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
                bottoms:
                  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80",
                shoes:
                  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
                accessories:
                  "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80",
              };
              finalImageUrl =
                categoryImages[category] ||
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80";
            }

            products.push({
              name,
              brand: extractBrand(name),
              price: cleanPrice(price),
              image_url: finalImageUrl,
              website_url:
                productUrl && productUrl.startsWith("http")
                  ? productUrl
                  : productUrl
                    ? `https://www.grailed.com${productUrl}`
                    : "https://www.grailed.com",
              website: "Grailed",
              availability: "In Stock",
              description: name,
            });
          }
        }
      } catch (error) {
        console.warn("Error parsing Grailed product:", error);
      }
    }

    return products;
  } catch (error) {
    console.error("Grailed search failed:", error);
    return [];
  }
}

async function searchVestiaire(
  query: string,
  category: string,
): Promise<ProductData[]> {
  try {
    const searchUrl = `https://www.vestiairecollective.com/search/?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    const products: ProductData[] = [];

    // Vestiaire specific selectors
    const productElements = doc.querySelectorAll(
      '.product-item, .catalog-product, [data-testid="product"]',
    );

    for (const element of productElements) {
      try {
        const nameEl = element.querySelector(".product-title, .item-title, h3");
        const priceEl = element.querySelector(".price, .product-price");
        const imageEl = element.querySelector("img") as HTMLImageElement;
        const linkEl = element.querySelector("a");

        if (nameEl && priceEl && imageEl) {
          const name = nameEl.textContent?.trim() || "";
          const price = priceEl.textContent?.trim() || "";
          const imageUrl =
            imageEl.src || imageEl.getAttribute("data-src") || "";
          const productUrl = linkEl?.href || "";

          if (name && price) {
            // Ensure we have a valid image URL
            let finalImageUrl = "";

            if (imageUrl) {
              if (imageUrl.startsWith("http")) {
                finalImageUrl = imageUrl;
              } else if (imageUrl.startsWith("/")) {
                finalImageUrl = `https://www.vestiairecollective.com${imageUrl}`;
              } else {
                finalImageUrl = `https://www.vestiairecollective.com/${imageUrl}`;
              }
            }

            // If no valid image URL found, use a category-specific placeholder
            if (!finalImageUrl) {
              const categoryImages = {
                tops: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
                bottoms:
                  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80",
                shoes:
                  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
                accessories:
                  "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80",
              };
              finalImageUrl =
                categoryImages[category] ||
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80";
            }

            products.push({
              name,
              brand: extractBrand(name),
              price: cleanPrice(price),
              image_url: finalImageUrl,
              website_url:
                productUrl && productUrl.startsWith("http")
                  ? productUrl
                  : productUrl
                    ? `https://www.vestiairecollective.com${productUrl}`
                    : "https://www.vestiairecollective.com",
              website: "Vestiaire Collective",
              availability: "In Stock",
              description: name,
            });
          }
        }
      } catch (error) {
        console.warn("Error parsing Vestiaire product:", error);
      }
    }

    return products;
  } catch (error) {
    console.error("Vestiaire search failed:", error);
    return [];
  }
}

async function searchSSENSE(
  query: string,
  category: string,
): Promise<ProductData[]> {
  try {
    const searchUrl = `https://www.ssense.com/en-us/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    const products: ProductData[] = [];

    // SSENSE specific selectors
    const productElements = doc.querySelectorAll(
      '.product-tile, .browsing-product-item, [data-testid="product-tile"]',
    );

    for (const element of productElements) {
      try {
        const nameEl = element.querySelector(
          ".product-name, .product-title, h3",
        );
        const priceEl = element.querySelector(".price, .product-price");
        const imageEl = element.querySelector("img") as HTMLImageElement;
        const linkEl = element.querySelector("a");

        if (nameEl && priceEl && imageEl) {
          const name = nameEl.textContent?.trim() || "";
          const price = priceEl.textContent?.trim() || "";
          const imageUrl =
            imageEl.src || imageEl.getAttribute("data-src") || "";
          const productUrl = linkEl?.href || "";

          if (name && price) {
            // Ensure we have a valid image URL
            let finalImageUrl = "";

            if (imageUrl) {
              if (imageUrl.startsWith("http")) {
                finalImageUrl = imageUrl;
              } else if (imageUrl.startsWith("/")) {
                finalImageUrl = `https://www.ssense.com${imageUrl}`;
              } else {
                finalImageUrl = `https://www.ssense.com/${imageUrl}`;
              }
            }

            // If no valid image URL found, use a category-specific placeholder
            if (!finalImageUrl) {
              const categoryImages = {
                tops: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
                bottoms:
                  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80",
                shoes:
                  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
                accessories:
                  "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80",
              };
              finalImageUrl =
                categoryImages[category] ||
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80";
            }

            products.push({
              name,
              brand: extractBrand(name),
              price: cleanPrice(price),
              image_url: finalImageUrl,
              website_url:
                productUrl && productUrl.startsWith("http")
                  ? productUrl
                  : productUrl
                    ? `https://www.ssense.com${productUrl}`
                    : "https://www.ssense.com",
              website: "SSENSE",
              availability: "In Stock",
              description: name,
            });
          }
        }
      } catch (error) {
        console.warn("Error parsing SSENSE product:", error);
      }
    }

    return products;
  } catch (error) {
    console.error("SSENSE search failed:", error);
    return [];
  }
}

async function searchEndClothing(
  query: string,
  category: string,
): Promise<ProductData[]> {
  try {
    const searchUrl = `https://www.endclothing.com/us/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    const products: ProductData[] = [];

    // END Clothing specific selectors
    const productElements = doc.querySelectorAll(
      '.product-item, .product-tile, [data-testid="product"]',
    );

    for (const element of productElements) {
      try {
        const nameEl = element.querySelector(
          ".product-name, .product-title, h3",
        );
        const priceEl = element.querySelector(".price, .product-price");
        const imageEl = element.querySelector("img") as HTMLImageElement;
        const linkEl = element.querySelector("a");

        if (nameEl && priceEl && imageEl) {
          const name = nameEl.textContent?.trim() || "";
          const price = priceEl.textContent?.trim() || "";
          const imageUrl =
            imageEl.src || imageEl.getAttribute("data-src") || "";
          const productUrl = linkEl?.href || "";

          if (name && price) {
            // Ensure we have a valid image URL
            let finalImageUrl = "";

            if (imageUrl) {
              if (imageUrl.startsWith("http")) {
                finalImageUrl = imageUrl;
              } else if (imageUrl.startsWith("/")) {
                finalImageUrl = `https://www.endclothing.com${imageUrl}`;
              } else {
                finalImageUrl = `https://www.endclothing.com/${imageUrl}`;
              }
            }

            // If no valid image URL found, use a category-specific placeholder
            if (!finalImageUrl) {
              const categoryImages = {
                tops: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
                bottoms:
                  "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=80",
                shoes:
                  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
                accessories:
                  "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80",
              };
              finalImageUrl =
                categoryImages[category] ||
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80";
            }

            products.push({
              name,
              brand: extractBrand(name),
              price: cleanPrice(price),
              image_url: finalImageUrl,
              website_url:
                productUrl && productUrl.startsWith("http")
                  ? productUrl
                  : productUrl
                    ? `https://www.endclothing.com${productUrl}`
                    : "https://www.endclothing.com",
              website: "END Clothing",
              availability: "In Stock",
              description: name,
            });
          }
        }
      } catch (error) {
        console.warn("Error parsing END Clothing product:", error);
      }
    }

    return products;
  } catch (error) {
    console.error("END Clothing search failed:", error);
    return [];
  }
}

function extractBrand(productName: string): string {
  // Common brand extraction patterns
  const brands = [
    "Nike",
    "Adidas",
    "Supreme",
    "Off-White",
    "Balenciaga",
    "Gucci",
    "Louis Vuitton",
    "Prada",
    "Versace",
    "Dior",
    "Saint Laurent",
    "Bottega Veneta",
    "Burberry",
    "Stone Island",
    "CP Company",
    "Acne Studios",
    "Maison Margiela",
    "Rick Owens",
    "Fear of God",
    "Essentials",
    "Yeezy",
    "Jordan",
    "Converse",
    "Vans",
  ];

  const upperName = productName.toUpperCase();

  for (const brand of brands) {
    if (upperName.includes(brand.toUpperCase())) {
      return brand;
    }
  }

  // Extract first word as potential brand
  const firstWord = productName.split(" ")[0];
  return firstWord || "Unknown";
}

function cleanPrice(priceText: string): string {
  // Extract price from text like "$299.99" or "€150,00"
  const priceMatch = priceText.match(/[\$€£¥]?[\d,]+\.?\d*/g);
  if (priceMatch && priceMatch.length > 0) {
    return priceMatch[0].replace(/[^\d.,\$€£¥]/g, "");
  }
  return priceText.trim();
}

function removeDuplicates(products: ProductData[]): ProductData[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    const key = `${product.name.toLowerCase()}-${product.brand.toLowerCase()}-${product.price}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function sortByRelevance(
  products: ProductData[],
  query: string,
): ProductData[] {
  const queryLower = query.toLowerCase();

  return products.sort((a, b) => {
    const aScore = calculateRelevanceScore(a, queryLower);
    const bScore = calculateRelevanceScore(b, queryLower);
    return bScore - aScore;
  });
}

function calculateRelevanceScore(product: ProductData, query: string): number {
  let score = 0;
  const nameLower = product.name.toLowerCase();
  const brandLower = product.brand.toLowerCase();

  // Exact matches get highest score
  if (nameLower.includes(query)) score += 10;
  if (brandLower.includes(query)) score += 8;

  // Word matches
  const queryWords = query.split(" ");
  queryWords.forEach((word) => {
    if (word.length > 2) {
      if (nameLower.includes(word)) score += 3;
      if (brandLower.includes(word)) score += 2;
    }
  });

  // Prefer certain websites
  if (product.website === "Shop Encore") score += 2;
  if (product.website === "Grailed") score += 1.5;
  if (product.website === "SSENSE") score += 1;

  return score;
}
