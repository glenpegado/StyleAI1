// Product Fetcher Module for StyleAI1
// Fetches real product data from ShopStyle API and other sources

import axios from 'axios';

// ShopStyle API Configuration
const SHOPSTYLE_API_KEY = process.env.SHOPSTYLE_API_KEY || 'YOUR_API_KEY';
const BASE_URL = 'https://api.shopstyle.com/api/v2/products';

export interface Product {
  id: string;
  name: string;
  brand?: string;
  price: string;
  imageUrl: string;
  retailer: string;
  url: string;
  description?: string;
  category?: string;
}

export interface ProductSearchParams {
  query: string;
  limit?: number;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  gender?: 'mens' | 'womens' | 'kids';
}

/**
 * Fetch products from ShopStyle API
 */
export async function fetchShopStyleProducts(params: ProductSearchParams): Promise<Product[]> {
  try {
    const { query, limit = 10, category = 'mens-clothing', priceMin, priceMax, gender = 'mens' } = params;
    
    const response = await axios.get(BASE_URL, {
      params: {
        pid: SHOPSTYLE_API_KEY,
        format: 'json',
        cat: category,
        fts: query,
        offset: 0,
        limit,
        ...(priceMin && { priceMin }),
        ...(priceMax && { priceMax }),
        ...(gender && { gender }),
      },
    });

    if (!response.data.products) {
      console.warn('No products found in ShopStyle response');
      return [];
    }

    const products: Product[] = response.data.products.map((item: any) => ({
      id: item.id,
      name: item.name,
      brand: item.brand?.name,
      price: item.priceLabel || 'Price not available',
      imageUrl: item.image?.sizes?.Best?.url || item.image?.url || '',
      retailer: item.retailer?.name || 'Unknown retailer',
      url: item.clickUrl || item.url || '',
      description: item.description,
      category: item.category?.name,
    }));

    return products.filter(product => product.imageUrl && product.url);
  } catch (error) {
    console.error('Error fetching products from ShopStyle:', error);
    return [];
  }
}

/**
 * Fetch products from multiple sources (ShopStyle + fallbacks)
 */
export async function fetchProducts(params: ProductSearchParams): Promise<Product[]> {
  const { query, limit = 10 } = params;
  
  // Try ShopStyle first
  let products = await fetchShopStyleProducts(params);
  
  // If no results, try with broader search
  if (products.length === 0) {
    console.log('No products found, trying broader search...');
    products = await fetchShopStyleProducts({
      ...params,
      query: query.split(' ').slice(0, 2).join(' '), // Use first 2 words
      limit: Math.min(limit * 2, 20),
    });
  }
  
  return products.slice(0, limit);
}

/**
 * Search for specific clothing categories
 */
export async function searchClothingCategory(
  category: string,
  style?: string,
  limit: number = 8
): Promise<Product[]> {
  const query = style ? `${style} ${category}` : category;
  
  return fetchProducts({
    query,
    limit,
    category: 'mens-clothing',
  });
}

/**
 * Get trending products (placeholder for future implementation)
 */
export async function getTrendingProducts(limit: number = 8): Promise<Product[]> {
  // For now, return popular clothing items
  const popularQueries = [
    'white sneakers',
    'denim jacket',
    'black t-shirt',
    'cargo pants',
  ];
  
  const randomQuery = popularQueries[Math.floor(Math.random() * popularQueries.length)];
  
  return fetchProducts({
    query: randomQuery,
    limit,
  });
}

/**
 * Search for celebrity-inspired items
 */
export async function searchCelebrityStyle(
  celebrityName: string,
  itemType: string,
  limit: number = 6
): Promise<Product[]> {
  const query = `${celebrityName} ${itemType}`;
  
  return fetchProducts({
    query,
    limit,
    category: 'mens-clothing',
  });
} 