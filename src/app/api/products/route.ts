import { NextRequest, NextResponse } from 'next/server';
import { fetchProducts, searchClothingCategory, getTrendingProducts, searchCelebrityStyle, Product } from '@/lib/product-fetcher';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '8');
    const type = searchParams.get('type'); // 'search', 'category', 'trending', 'celebrity'
    const celebrity = searchParams.get('celebrity');
    const itemType = searchParams.get('itemType');

    let products: Product[] = [];

    switch (type) {
      case 'category':
        if (category) {
          products = await searchClothingCategory(category, query || undefined, limit);
        }
        break;
      
      case 'trending':
        products = await getTrendingProducts(limit);
        break;
      
      case 'celebrity':
        if (celebrity && itemType) {
          products = await searchCelebrityStyle(celebrity, itemType, limit);
        }
        break;
      
      case 'search':
      default:
        if (query) {
          products = await fetchProducts({ query, limit });
        } else {
          // Default to trending if no query provided
          products = await getTrendingProducts(limit);
        }
        break;
    }

    return NextResponse.json({
      success: true,
      products,
      count: products.length,
    });

  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        products: [],
      },
      { status: 500 }
    );
  }
} 