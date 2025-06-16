import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OutfitItem {
  name: string;
  brand: string;
  website: string;
  website_url?: string;
  image_url?: string;
}

interface ScrapedItem extends OutfitItem {
  scraped: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "Items array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Scraping images for", items.length, "items");

    const scrapedItems = await Promise.all(
      items.map(async (item: OutfitItem): Promise<ScrapedItem> => {
        try {
          // Skip if already has a valid image URL
          if (item.image_url && item.image_url.startsWith("http")) {
            const isValidImage = await validateImageUrl(item.image_url);
            if (isValidImage) {
              return { ...item, scraped: false };
            }
          }

          // Try to scrape image based on website
          const scrapedImageUrl = await scrapeProductImage(item);

          const fallbackImage =
            scrapedImageUrl ||
            item.image_url ||
            (await generateFallbackImage(item));
          return {
            ...item,
            image_url: fallbackImage,
            scraped: !!scrapedImageUrl,
          };
        } catch (error) {
          console.error(`Error scraping image for ${item.name}:`, error);
          const fallbackImage =
            item.image_url || (await generateFallbackImage(item));
          return {
            ...item,
            image_url: fallbackImage,
            scraped: false,
          };
        }
      }),
    );

    return new Response(JSON.stringify({ items: scrapedItems }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in image scraping:", error);
    return new Response(JSON.stringify({ error: "Failed to scrape images" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const contentType = response.headers.get("content-type");
    return response.ok && contentType?.startsWith("image/");
  } catch {
    return false;
  }
}

async function scrapeProductImage(item: OutfitItem): Promise<string | null> {
  const { website, name, brand, website_url } = item;

  if (!website_url || website_url === "#") {
    // Generate search URL if no direct product URL
    const searchUrl = generateSearchUrl(website, name, brand);
    if (searchUrl) {
      return await scrapeFromSearchResults(searchUrl, name, brand);
    }
    return null;
  }

  try {
    console.log(`Scraping image from: ${website_url}`);

    const response = await fetch(website_url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
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

    // Website-specific scraping strategies
    const imageUrl = await scrapeByWebsite(website, doc, name, brand);

    if (imageUrl) {
      // Validate the scraped image
      const isValid = await validateImageUrl(imageUrl);
      if (isValid) {
        console.log(`Successfully scraped image for ${name}:`, imageUrl);
        return imageUrl;
      }
    }

    return null;
  } catch (error) {
    console.error(`Failed to scrape ${website_url}:`, error);
    return null;
  }
}

async function scrapeByWebsite(
  website: string,
  doc: Document,
  name: string,
  brand: string,
): Promise<string | null> {
  const websiteLower = website.toLowerCase();

  // SSENSE
  if (websiteLower.includes("ssense")) {
    return scrapeSsense(doc);
  }

  // END Clothing
  if (websiteLower.includes("end")) {
    return scrapeEndClothing(doc);
  }

  // Farfetch
  if (websiteLower.includes("farfetch")) {
    return scrapeFarfetch(doc);
  }

  // Nike
  if (websiteLower.includes("nike")) {
    return scrapeNike(doc);
  }

  // Adidas
  if (websiteLower.includes("adidas")) {
    return scrapeAdidas(doc);
  }

  // ASOS
  if (websiteLower.includes("asos")) {
    return scrapeAsos(doc);
  }

  // Urban Outfitters
  if (websiteLower.includes("urban")) {
    return scrapeUrbanOutfitters(doc);
  }

  // Generic scraping fallback
  return scrapeGeneric(doc, name, brand);
}

function scrapeSsense(doc: Document): string | null {
  // SSENSE specific selectors
  const selectors = [
    'img[data-testid="product-image"]',
    ".product-image img",
    ".product-gallery img",
    'img[alt*="product"]',
    ".main-image img",
  ];

  for (const selector of selectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    if (img) {
      const src =
        img.src ||
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy");
      if (src && src.startsWith("http")) {
        return src;
      }
    }
  }
  return null;
}

function scrapeEndClothing(doc: Document): string | null {
  const selectors = [
    ".product-image img",
    ".product-gallery img",
    'img[data-testid="product-image"]',
    ".main-product-image img",
  ];

  for (const selector of selectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    if (img) {
      const src = img.src || img.getAttribute("data-src");
      if (src) {
        return src.startsWith("http")
          ? src
          : `https://www.endclothing.com${src}`;
      }
    }
  }
  return null;
}

function scrapeFarfetch(doc: Document): string | null {
  const selectors = [
    'img[data-testid="product-image"]',
    ".product-image img",
    'img[alt*="product"]',
  ];

  for (const selector of selectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    if (img) {
      const src = img.src || img.getAttribute("data-src");
      if (src && src.startsWith("http")) {
        return src;
      }
    }
  }
  return null;
}

function scrapeNike(doc: Document): string | null {
  const selectors = [
    'img[data-testid="product-image"]',
    ".product-image img",
    ".hero-image img",
    'img[alt*="Nike"]',
  ];

  for (const selector of selectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    if (img) {
      const src = img.src || img.getAttribute("data-src");
      if (src && src.startsWith("http")) {
        return src;
      }
    }
  }
  return null;
}

function scrapeAdidas(doc: Document): string | null {
  const selectors = [
    ".product-image img",
    'img[data-testid="product-image"]',
    ".hero-image img",
  ];

  for (const selector of selectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    if (img) {
      const src = img.src || img.getAttribute("data-src");
      if (src && src.startsWith("http")) {
        return src;
      }
    }
  }
  return null;
}

function scrapeAsos(doc: Document): string | null {
  const selectors = [
    'img[data-testid="product-image"]',
    ".product-image img",
    ".hero-image img",
  ];

  for (const selector of selectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    if (img) {
      const src = img.src || img.getAttribute("data-src");
      if (src && src.startsWith("http")) {
        return src;
      }
    }
  }
  return null;
}

function scrapeUrbanOutfitters(doc: Document): string | null {
  const selectors = [
    ".product-image img",
    'img[data-testid="product-image"]',
    ".hero-image img",
  ];

  for (const selector of selectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    if (img) {
      const src = img.src || img.getAttribute("data-src");
      if (src && src.startsWith("http")) {
        return src;
      }
    }
  }
  return null;
}

function scrapeGeneric(
  doc: Document,
  name: string,
  brand: string,
): string | null {
  // Generic selectors that work on most e-commerce sites
  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'img[alt*="product"]',
    ".product-image img",
    ".product-photo img",
    ".main-image img",
    ".hero-image img",
    'img[data-testid*="product"]',
    'img[class*="product"]',
    'img[id*="product"]',
  ];

  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const src =
        element.getAttribute("content") ||
        (element as HTMLImageElement).src ||
        element.getAttribute("data-src");
      if (src && src.startsWith("http")) {
        return src;
      }
    }
  }

  return null;
}

function generateSearchUrl(
  website: string,
  name: string,
  brand: string,
): string | null {
  const query = encodeURIComponent(`${brand} ${name}`);
  const websiteLower = website.toLowerCase();

  if (websiteLower.includes("ssense")) {
    return `https://www.ssense.com/en-us/search?q=${query}`;
  }
  if (websiteLower.includes("end")) {
    return `https://www.endclothing.com/us/search?q=${query}`;
  }
  if (websiteLower.includes("farfetch")) {
    return `https://www.farfetch.com/shopping/search/items.aspx?q=${query}`;
  }
  if (websiteLower.includes("asos")) {
    return `https://www.asos.com/search/?q=${query}`;
  }

  return null;
}

async function scrapeFromSearchResults(
  searchUrl: string,
  name: string,
  brand: string,
): Promise<string | null> {
  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (!doc) return null;

    // Look for first product image in search results
    const productImages = doc.querySelectorAll(
      'img[alt*="product"], .product-image img, img[class*="product"]',
    );

    for (let i = 0; i < Math.min(3, productImages.length); i++) {
      const img = productImages[i] as HTMLImageElement;
      const src = img.src || img.getAttribute("data-src");
      if (src && src.startsWith("http")) {
        const isValid = await validateImageUrl(src);
        if (isValid) {
          return src;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error scraping search results:", error);
    return null;
  }
}

async function generateFallbackImage(item: OutfitItem): Promise<string> {
  // Try Google Custom Search first
  const googleImage = await searchGoogleImages(item);
  if (googleImage) {
    return googleImage;
  }

  // Try brand-specific APIs
  const brandImage = await getBrandSpecificImage(item);
  if (brandImage) {
    return brandImage;
  }

  // Enhanced product search on shopping sites
  const shoppingImage = await searchShoppingSites(item);
  if (shoppingImage) {
    return shoppingImage;
  }

  // Last resort: high-quality product placeholder
  return generateProductPlaceholder(item);
}

async function searchGoogleImages(item: OutfitItem): Promise<string | null> {
  try {
    // Use Google Custom Search API for product images
    const query = encodeURIComponent(
      `${item.brand} ${item.name} product image`,
    );
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${Deno.env.get("GOOGLE_API_KEY")}&cx=${Deno.env.get("GOOGLE_SEARCH_ENGINE_ID")}&q=${query}&searchType=image&imgType=photo&imgSize=medium&num=3`;

    if (
      !Deno.env.get("GOOGLE_API_KEY") ||
      !Deno.env.get("GOOGLE_SEARCH_ENGINE_ID")
    ) {
      console.log(
        "Google API credentials not available, skipping Google search",
      );
      return null;
    }

    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.error("Google search failed:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      // Filter for high-quality product images
      for (const item of data.items) {
        const imageUrl = item.link;
        if (imageUrl && (await validateImageUrl(imageUrl))) {
          // Prefer images from known fashion retailers
          const domain = new URL(imageUrl).hostname.toLowerCase();
          if (
            domain.includes("nike") ||
            domain.includes("adidas") ||
            domain.includes("ssense") ||
            domain.includes("farfetch") ||
            domain.includes("endclothing") ||
            domain.includes("asos")
          ) {
            return imageUrl;
          }
        }
      }
      // Return first valid image if no retailer match
      for (const item of data.items) {
        if (await validateImageUrl(item.link)) {
          return item.link;
        }
      }
    }
  } catch (error) {
    console.error("Google image search error:", error);
  }
  return null;
}

async function getBrandSpecificImage(item: OutfitItem): Promise<string | null> {
  const brand = item.brand.toLowerCase();

  try {
    // Nike API approach
    if (brand.includes("nike") || brand.includes("jordan")) {
      return await searchNikeAPI(item);
    }

    // Adidas API approach
    if (brand.includes("adidas")) {
      return await searchAdidasAPI(item);
    }

    // StockX API for sneakers
    if (
      item.name.toLowerCase().includes("sneaker") ||
      item.name.toLowerCase().includes("shoe") ||
      brand.includes("jordan") ||
      brand.includes("yeezy")
    ) {
      return await searchStockXAPI(item);
    }
  } catch (error) {
    console.error(`Brand-specific search failed for ${brand}:`, error);
  }

  return null;
}

async function searchNikeAPI(item: OutfitItem): Promise<string | null> {
  try {
    // Nike's product search endpoint
    const query = encodeURIComponent(item.name.replace(/nike/gi, "").trim());
    const searchUrl = `https://api.nike.com/product_feed/threads/v2/?filter=marketplace%28US%29&filter=language%28en%29&filter=employeePrice%28true%29&filter=attributeIds%28%29&anchor=0&consumerChannelId=d9a5bc42-4b9c-4976-858a-f159cf99c647&count=24&sort=relevance&searchTerms=${query}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.objects && data.objects.length > 0) {
        const product = data.objects[0];
        if (
          product.productInfo &&
          product.productInfo.imageUrls &&
          product.productInfo.imageUrls.productImageUrl
        ) {
          return product.productInfo.imageUrls.productImageUrl;
        }
      }
    }
  } catch (error) {
    console.error("Nike API search failed:", error);
  }
  return null;
}

async function searchAdidasAPI(item: OutfitItem): Promise<string | null> {
  try {
    // Adidas product search
    const query = encodeURIComponent(item.name.replace(/adidas/gi, "").trim());
    const searchUrl = `https://www.adidas.com/api/search/product?query=${query}&start=0&count=12`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.products && data.products.length > 0) {
        const product = data.products[0];
        if (product.image && product.image.src) {
          return product.image.src;
        }
      }
    }
  } catch (error) {
    console.error("Adidas API search failed:", error);
  }
  return null;
}

async function searchStockXAPI(item: OutfitItem): Promise<string | null> {
  try {
    // StockX search for sneakers
    const query = encodeURIComponent(`${item.brand} ${item.name}`);
    const searchUrl = `https://stockx.com/api/browse?_search=${query}&dataType=product&facetsToRetrieve[]=browseVerticals&facetsToRetrieve[]=brand&facetsToRetrieve[]=category&facetsToRetrieve[]=gender&facetsToRetrieve[]=size&facetsToRetrieve[]=colorway&propsToRetrieve[][]=brand&propsToRetrieve[][]=category&propsToRetrieve[][]=gender&propsToRetrieve[][]=name&propsToRetrieve[][]=shortDescription&propsToRetrieve[][]=styleId&propsToRetrieve[][]=tickerSymbol&propsToRetrieve[][]=title&propsToRetrieve[][]=urlKey&propsToRetrieve[][]=uuid&propsToRetrieve[][]=media.imageUrl`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.Products && data.Products.length > 0) {
        const product = data.Products[0];
        if (product.media && product.media.imageUrl) {
          return product.media.imageUrl;
        }
      }
    }
  } catch (error) {
    console.error("StockX API search failed:", error);
  }
  return null;
}

async function searchShoppingSites(item: OutfitItem): Promise<string | null> {
  const shoppingSites = [
    {
      name: "Grailed",
      searchUrl: `https://www.grailed.com/search?query=${encodeURIComponent(`${item.brand} ${item.name}`)}`,
    },
    {
      name: "Vestiaire Collective",
      searchUrl: `https://www.vestiairecollective.com/search/?q=${encodeURIComponent(`${item.brand} ${item.name}`)}`,
    },
    {
      name: "TheRealReal",
      searchUrl: `https://www.therealreal.com/search?keywords=${encodeURIComponent(`${item.brand} ${item.name}`)}`,
    },
  ];

  for (const site of shoppingSites) {
    try {
      const response = await fetch(site.searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.ok) {
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        if (doc) {
          const imageUrl = await scrapeGeneric(doc, item.name, item.brand);
          if (imageUrl && (await validateImageUrl(imageUrl))) {
            return imageUrl;
          }
        }
      }
    } catch (error) {
      console.error(`Search failed for ${site.name}:`, error);
    }
  }

  return null;
}

function generateProductPlaceholder(item: OutfitItem): string {
  // Generate a more specific placeholder based on detailed item analysis
  const { name, brand } = item;
  const itemLower = name.toLowerCase();
  const brandLower = brand.toLowerCase();

  // Brand-specific placeholders
  if (brandLower.includes("nike") || brandLower.includes("jordan")) {
    return "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/i1-665455a5-45de-40fb-945f-c1852b82400d/air-force-1-07-shoes-WrLlWX.png";
  }
  if (brandLower.includes("adidas")) {
    return "https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/114f6e6c74574d2aaea3af7800332b8e_9366/Stan_Smith_Shoes_White_FX5500_01_standard.jpg";
  }
  if (brandLower.includes("supreme")) {
    return "https://process.fs.grailed.com/AJdAgnqCST4iPtnUxiGtTz/auto_image/cache=expiry:max/rotate=deg:exif/resize=height:700,fit:scale/output=quality:90/compress/watermark=file:grailed.png,opacity:0.3,position:center/https://cdn.fs.grailed.com/api/file/2Z8wQpNTQHmMcBrGRR2w";
  }

  // Category-specific high-quality placeholders
  if (itemLower.includes("sneaker") || itemLower.includes("shoe")) {
    return "https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/i1-665455a5-45de-40fb-945f-c1852b82400d/air-force-1-07-shoes-WrLlWX.png";
  }
  if (itemLower.includes("hoodie")) {
    return "https://process.fs.grailed.com/AJdAgnqCST4iPtnUxiGtTz/auto_image/cache=expiry:max/rotate=deg:exif/resize=height:700,fit:scale/output=quality:90/compress/watermark=file:grailed.png,opacity:0.3,position:center/https://cdn.fs.grailed.com/api/file/2Z8wQpNTQHmMcBrGRR2w";
  }
  if (itemLower.includes("t-shirt") || itemLower.includes("tee")) {
    return "https://process.fs.grailed.com/AJdAgnqCST4iPtnUxiGtTz/auto_image/cache=expiry:max/rotate=deg:exif/resize=height:700,fit:scale/output=quality:90/compress/watermark=file:grailed.png,opacity:0.3,position:center/https://cdn.fs.grailed.com/api/file/example-tshirt";
  }
  if (itemLower.includes("jacket")) {
    return "https://process.fs.grailed.com/AJdAgnqCST4iPtnUxiGtTz/auto_image/cache=expiry:max/rotate=deg:exif/resize=height:700,fit:scale/output=quality:90/compress/watermark=file:grailed.png,opacity:0.3,position:center/https://cdn.fs.grailed.com/api/file/example-jacket";
  }
  if (itemLower.includes("bag")) {
    return "https://process.fs.grailed.com/AJdAgnqCST4iPtnUxiGtTz/auto_image/cache=expiry:max/rotate=deg:exif/resize=height:700,fit:scale/output=quality:90/compress/watermark=file:grailed.png,opacity:0.3,position:center/https://cdn.fs.grailed.com/api/file/example-bag";
  }

  // Default high-quality fashion placeholder
  return "https://process.fs.grailed.com/AJdAgnqCST4iPtnUxiGtTz/auto_image/cache=expiry:max/rotate=deg:exif/resize=height:700,fit:scale/output=quality:90/compress/watermark=file:grailed.png,opacity:0.3,position:center/https://cdn.fs.grailed.com/api/file/default-fashion";
}
