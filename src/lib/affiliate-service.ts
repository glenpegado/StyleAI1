// Affiliate Network Integration Service
// Based on research of Commission Junction, ShareASale, and Rakuten Advertising

import { createClient } from '../../supabase/client';

export interface AffiliateProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  currency: string;
  website: string;
  website_url: string;
  affiliate_url: string;
  affiliate_network: string;
  commission_rate: number;
  availability: string;
  images: string[];
  category: string;
  size?: string;
  color?: string;
  material?: string;
}

export interface AffiliateNetwork {
  id: string;
  name: string;
  api_endpoint?: string;
  commission_rate: number;
  is_active: boolean;
}

export class AffiliateService {
  private supabase = createClient();

  // Commission Junction Integration
  async searchCJProducts(query: string, category?: string): Promise<AffiliateProduct[]> {
    try {
      // CJ API endpoint (you'll need to register as a publisher)
      const cjApiUrl = process.env.CJ_API_ENDPOINT;
      const cjApiKey = process.env.CJ_API_KEY;

      if (!cjApiUrl || !cjApiKey) {
        console.warn('CJ API credentials not configured');
        return [];
      }

      const searchParams = new URLSearchParams({
        keywords: query,
        records: '20',
        sortBy: 'relevance',
        ...(category && { category })
      });

      const response = await fetch(`${cjApiUrl}/product-search?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${cjApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`CJ API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.products?.map((product: any) => ({
        id: product.productId,
        name: product.productName,
        brand: product.manufacturerName,
        description: product.description,
        price: parseFloat(product.price),
        currency: 'USD',
        website: product.merchantName,
        website_url: product.productUrl,
        affiliate_url: product.buyUrl,
        affiliate_network: 'cj',
        commission_rate: 0.05, // Default CJ commission
        availability: product.inStock ? 'In Stock' : 'Sold Out',
        images: [product.imageUrl],
        category: product.category
      })) || [];

    } catch (error) {
      console.error('CJ product search failed:', error);
      return [];
    }
  }

  // ShareASale Integration
  async searchShareASaleProducts(query: string, category?: string): Promise<AffiliateProduct[]> {
    try {
      const shareasaleApiUrl = process.env.SHAREASALE_API_ENDPOINT;
      const shareasaleApiKey = process.env.SHAREASALE_API_KEY;

      if (!shareasaleApiUrl || !shareasaleApiKey) {
        console.warn('ShareASale API credentials not configured');
        return [];
      }

      const searchParams = new URLSearchParams({
        q: query,
        limit: '20',
        ...(category && { category })
      });

      const response = await fetch(`${shareasaleApiUrl}/products?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${shareasaleApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ShareASale API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.products?.map((product: any) => ({
        id: product.productId,
        name: product.name,
        brand: product.brand,
        description: product.description,
        price: parseFloat(product.price),
        currency: 'USD',
        website: product.merchantName,
        website_url: product.productUrl,
        affiliate_url: product.affiliateUrl,
        affiliate_network: 'shareasale',
        commission_rate: 0.06, // Default ShareASale commission
        availability: product.inStock ? 'In Stock' : 'Sold Out',
        images: [product.imageUrl],
        category: product.category
      })) || [];

    } catch (error) {
      console.error('ShareASale product search failed:', error);
      return [];
    }
  }

  // Rakuten Advertising Integration
  async searchRakutenProducts(query: string, category?: string): Promise<AffiliateProduct[]> {
    try {
      const rakutenApiUrl = process.env.RAKUTEN_API_ENDPOINT;
      const rakutenApiKey = process.env.RAKUTEN_API_KEY;

      if (!rakutenApiUrl || !rakutenApiKey) {
        console.warn('Rakuten API credentials not configured');
        return [];
      }

      const searchParams = new URLSearchParams({
        query: query,
        limit: '20',
        ...(category && { category })
      });

      const response = await fetch(`${rakutenApiUrl}/products?${searchParams}`, {
        headers: {
          'Authorization': `Bearer ${rakutenApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Rakuten API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.products?.map((product: any) => ({
        id: product.productId,
        name: product.name,
        brand: product.brand,
        description: product.description,
        price: parseFloat(product.price),
        currency: 'USD',
        website: product.merchantName,
        website_url: product.productUrl,
        affiliate_url: product.affiliateUrl,
        affiliate_network: 'rakuten',
        commission_rate: 0.04, // Default Rakuten commission
        availability: product.inStock ? 'In Stock' : 'Sold Out',
        images: [product.imageUrl],
        category: product.category
      })) || [];

    } catch (error) {
      console.error('Rakuten product search failed:', error);
      return [];
    }
  }

  // Unified product search across all networks
  async searchProducts(query: string, category?: string): Promise<AffiliateProduct[]> {
    try {
      // Search all active affiliate networks in parallel
      const [cjProducts, shareasaleProducts, rakutenProducts] = await Promise.allSettled([
        this.searchCJProducts(query, category),
        this.searchShareASaleProducts(query, category),
        this.searchRakutenProducts(query, category)
      ]);

      // Combine results from all networks
      const allProducts: AffiliateProduct[] = [];
      
      if (cjProducts.status === 'fulfilled') {
        allProducts.push(...cjProducts.value);
      }
      
      if (shareasaleProducts.status === 'fulfilled') {
        allProducts.push(...shareasaleProducts.value);
      }
      
      if (rakutenProducts.status === 'fulfilled') {
        allProducts.push(...rakutenProducts.value);
      }

      // Sort by relevance and commission rate
      return allProducts.sort((a, b) => {
        // Prioritize higher commission rates
        const commissionDiff = b.commission_rate - a.commission_rate;
        if (Math.abs(commissionDiff) > 0.01) {
          return commissionDiff;
        }
        
        // Then by price (lower first for better accessibility)
        return a.price - b.price;
      });

    } catch (error) {
      console.error('Unified product search failed:', error);
      return [];
    }
  }

  // Save products to database
  async saveProducts(products: AffiliateProduct[]): Promise<void> {
    try {
      for (const product of products) {
        // Check if product already exists
        const { data: existingProduct } = await this.supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .eq('brand', product.brand)
          .single();

        if (existingProduct) {
          // Update existing product
          await this.supabase
            .from('products')
            .update({
              price: product.price,
              website_url: product.website_url,
              affiliate_url: product.affiliate_url,
              availability: product.availability,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProduct.id);
        } else {
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
              affiliate_url: product.affiliate_url,
              affiliate_network: product.affiliate_network,
              commission_rate: product.commission_rate,
              availability: product.availability,
              size: product.size,
              color: product.color,
              material: product.material
            })
            .select()
            .single();

          // Save product images
          if (newProduct && product.images.length > 0) {
            const imageInserts = product.images.map((imageUrl, index) => ({
              product_id: newProduct.id,
              image_url: imageUrl,
              image_type: index === 0 ? 'primary' : 'detail',
              is_primary: index === 0
            }));

            await this.supabase
              .from('product_images')
              .insert(imageInserts);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save products:', error);
      throw error;
    }
  }

  // Track product click for analytics
  async trackProductClick(productId: string, userId?: string): Promise<void> {
    try {
      await this.supabase
        .from('product_clicks')
        .insert({
          product_id: productId,
          user_id: userId,
          click_timestamp: new Date().toISOString(),
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
          referrer: typeof window !== 'undefined' ? document.referrer : null
        });
    } catch (error) {
      console.error('Failed to track product click:', error);
    }
  }

  // Get affiliate networks from database
  async getAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    try {
      const { data, error } = await this.supabase
        .from('affiliate_networks')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get affiliate networks:', error);
      return [];
    }
  }

  // Search products by celebrity style
  async searchCelebrityStyle(celebrityName: string, styleDescription: string): Promise<AffiliateProduct[]> {
    try {
      // Extract key style elements from description
      const styleKeywords = this.extractStyleKeywords(styleDescription);
      
      // Search for products matching the style
      const searchQueries = [
        `${celebrityName} style`,
        ...styleKeywords,
        `${celebrityName} outfit`
      ];

      const allProducts: AffiliateProduct[] = [];
      
      for (const query of searchQueries) {
        const products = await this.searchProducts(query);
        allProducts.push(...products);
      }

      // Remove duplicates and sort by relevance
      const uniqueProducts = this.removeDuplicateProducts(allProducts);
      
      return uniqueProducts.slice(0, 20); // Return top 20 results
    } catch (error) {
      console.error('Celebrity style search failed:', error);
      return [];
    }
  }

  private extractStyleKeywords(description: string): string[] {
    const keywords = description.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3)
      .slice(0, 5);
    
    return keywords;
  }

  private removeDuplicateProducts(products: AffiliateProduct[]): AffiliateProduct[] {
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
export const affiliateService = new AffiliateService(); 