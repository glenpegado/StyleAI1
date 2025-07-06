// Undocumented API Discovery Service
// Based on the Farfetch example: https://medium.com/swlh/scraping-180k-luxury-fashion-products-with-python-ba42fdd831d8

import { createClient } from '../../supabase/client';

export interface UndocumentedAPIProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  currency: string;
  website: string;
  website_url: string;
  image_url: string;
  category: string;
  size?: string;
  color?: string;
  material?: string;
  availability: string;
}

export class UndocumentedAPIService {
  private supabase = createClient();

  // Farfetch API Discovery (based on the Medium article)
  async discoverFarfetchProducts(query: string, limit: number = 50): Promise<UndocumentedAPIProduct[]> {
    try {
      // Based on the article, Farfetch uses a specific API endpoint pattern
      const searchParams = new URLSearchParams({
        q: query,
        page: '1',
        pageSize: limit.toString(),
        sortBy: 'relevance',
        category: 'fashion'
      });

      // The article mentions using Firefox Web Developer to find the actual endpoint
      // This is a reconstructed version based on common Farfetch API patterns
      const response = await fetch(`https://www.farfetch.com/api/search?${searchParams}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.farfetch.com/',
          'Origin': 'https://www.farfetch.com'
        }
      });

      if (!response.ok) {
        throw new Error(`Farfetch API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the response based on Farfetch's data structure
      return this.transformFarfetchData(data);

    } catch (error) {
      console.error('Farfetch API discovery failed:', error);
      return [];
    }
  }

  // SSENSE API Discovery
  async discoverSSENSEProducts(query: string, limit: number = 50): Promise<UndocumentedAPIProduct[]> {
    try {
      // SSENSE typically uses a different API structure
      const searchParams = new URLSearchParams({
        search: query,
        limit: limit.toString(),
        sort: 'relevance'
      });

      const response = await fetch(`https://www.ssense.com/api/search?${searchParams}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.ssense.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`SSENSE API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformSSENSEData(data);

    } catch (error) {
      console.error('SSENSE API discovery failed:', error);
      return [];
    }
  }

  // END Clothing API Discovery
  async discoverENDProducts(query: string, limit: number = 50): Promise<UndocumentedAPIProduct[]> {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        sort: 'relevance'
      });

      const response = await fetch(`https://www.endclothing.com/api/search?${searchParams}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.endclothing.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`END Clothing API error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformENDData(data);

    } catch (error) {
      console.error('END Clothing API discovery failed:', error);
      return [];
    }
  }

  // Generic API Discovery Method
  async discoverAPIEndpoints(website: string): Promise<string[]> {
    const endpoints: string[] = [];
    
    try {
      // Common API endpoint patterns for fashion sites
      const commonPatterns = [
        '/api/search',
        '/api/products',
        '/api/catalog',
        '/api/items',
        '/search/api',
        '/products/api'
      ];

      for (const pattern of commonPatterns) {
        try {
          const testUrl = `https://${website}${pattern}`;
          const response = await fetch(testUrl, {
            method: 'HEAD',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (response.ok || response.status === 405) { // 405 means method not allowed, but endpoint exists
            endpoints.push(pattern);
          }
        } catch (error) {
          // Continue to next pattern
        }
      }
    } catch (error) {
      console.error('API endpoint discovery failed:', error);
    }

    return endpoints;
  }

  // Data Transformation Methods
  private transformFarfetchData(data: any): UndocumentedAPIProduct[] {
    // Transform based on Farfetch's actual response structure
    // This would need to be updated based on actual API response
    const products: UndocumentedAPIProduct[] = [];

    if (data.products && Array.isArray(data.products)) {
      data.products.forEach((product: any) => {
        products.push({
          id: product.id || product.productId,
          name: product.name || product.productName,
          brand: product.brand || product.designer,
          description: product.description || '',
          price: parseFloat(product.price?.amount || product.price || 0),
          currency: product.price?.currency || 'USD',
          website: 'Farfetch',
          website_url: `https://www.farfetch.com${product.url || product.productUrl}`,
          image_url: product.images?.[0] || product.imageUrl,
          category: product.category || 'fashion',
          size: product.size,
          color: product.color,
          material: product.material,
          availability: product.inStock ? 'In Stock' : 'Sold Out'
        });
      });
    }

    return products;
  }

  private transformSSENSEData(data: any): UndocumentedAPIProduct[] {
    const products: UndocumentedAPIProduct[] = [];

    if (data.products && Array.isArray(data.products)) {
      data.products.forEach((product: any) => {
        products.push({
          id: product.id || product.productId,
          name: product.name || product.productName,
          brand: product.brand || product.designer,
          description: product.description || '',
          price: parseFloat(product.price?.amount || product.price || 0),
          currency: product.price?.currency || 'USD',
          website: 'SSENSE',
          website_url: `https://www.ssense.com${product.url || product.productUrl}`,
          image_url: product.images?.[0] || product.imageUrl,
          category: product.category || 'fashion',
          size: product.size,
          color: product.color,
          material: product.material,
          availability: product.inStock ? 'In Stock' : 'Sold Out'
        });
      });
    }

    return products;
  }

  private transformENDData(data: any): UndocumentedAPIProduct[] {
    const products: UndocumentedAPIProduct[] = [];

    if (data.products && Array.isArray(data.products)) {
      data.products.forEach((product: any) => {
        products.push({
          id: product.id || product.productId,
          name: product.name || product.productName,
          brand: product.brand || product.designer,
          description: product.description || '',
          price: parseFloat(product.price?.amount || product.price || 0),
          currency: product.price?.currency || 'USD',
          website: 'END Clothing',
          website_url: `https://www.endclothing.com${product.url || product.productUrl}`,
          image_url: product.images?.[0] || product.imageUrl,
          category: product.category || 'fashion',
          size: product.size,
          color: product.color,
          material: product.material,
          availability: product.inStock ? 'In Stock' : 'Sold Out'
        });
      });
    }

    return products;
  }

  // Save discovered products to database
  async saveDiscoveredProducts(products: UndocumentedAPIProduct[]): Promise<void> {
    try {
      for (const product of products) {
        // Check if product already exists
        const { data: existingProduct } = await this.supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .eq('brand', product.brand)
          .single();

        if (!existingProduct) {
          // Insert new product
          const { data: newProduct } = await this.supabase
            .from('products')
            .insert({
              name: product.name,
              brand: product.brand,
              description: product.description,
              price: product.price,
              currency: product.currency,
              website: product.website,
              website_url: product.website_url,
              affiliate_url: product.website_url, // Direct link for discovered products
              affiliate_network: 'direct',
              commission_rate: 0, // No commission for direct links
              availability: product.availability,
              size: product.size,
              color: product.color,
              material: product.material
            })
            .select()
            .single();

          // Save product image
          if (newProduct && product.image_url) {
            await this.supabase
              .from('product_images')
              .insert({
                product_id: newProduct.id,
                image_url: product.image_url,
                image_type: 'primary',
                is_primary: true
              });
          }
        }
      }
    } catch (error) {
      console.error('Failed to save discovered products:', error);
      throw error;
    }
  }

  // Comprehensive product discovery across multiple platforms
  async discoverAllProducts(query: string, limit: number = 20): Promise<UndocumentedAPIProduct[]> {
    try {
      // Discover products from multiple platforms in parallel
      const [farfetchProducts, ssenseProducts, endProducts] = await Promise.allSettled([
        this.discoverFarfetchProducts(query, limit),
        this.discoverSSENSEProducts(query, limit),
        this.discoverENDProducts(query, limit)
      ]);

      // Combine results
      const allProducts: UndocumentedAPIProduct[] = [];
      
      if (farfetchProducts.status === 'fulfilled') {
        allProducts.push(...farfetchProducts.value);
      }
      
      if (ssenseProducts.status === 'fulfilled') {
        allProducts.push(...ssenseProducts.value);
      }
      
      if (endProducts.status === 'fulfilled') {
        allProducts.push(...endProducts.value);
      }

      // Remove duplicates and sort by price
      const uniqueProducts = this.removeDuplicateProducts(allProducts);
      return uniqueProducts.sort((a, b) => a.price - b.price);

    } catch (error) {
      console.error('Comprehensive product discovery failed:', error);
      return [];
    }
  }

  private removeDuplicateProducts(products: UndocumentedAPIProduct[]): UndocumentedAPIProduct[] {
    const seen = new Set();
    return products.filter(product => {
      const key = `${product.brand}-${product.name}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Export singleton instance
export const undocumentedAPIService = new UndocumentedAPIService(); 