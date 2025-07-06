import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchStyleImages, 
  fetchCelebrityStyleImages, 
  fetchLookbookImages, 
  fetchBrandStyleImages,
  StyleImageSearchParams,
  StyleImage 
} from '@/lib/style-image-fetcher';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '8');
    const type = searchParams.get('type'); // 'search', 'celebrity', 'lookbook', 'brand'
    const celebrity = searchParams.get('celebrity');
    const style = searchParams.get('style');
    const brand = searchParams.get('brand');
    const imageType = searchParams.get('imageType') as any || 'photo';
    const size = searchParams.get('size') as any || 'large';

    let images: StyleImage[] = [];

    switch (type) {
      case 'celebrity':
        if (celebrity) {
          images = await fetchCelebrityStyleImages(celebrity, style || undefined, limit);
        }
        break;
      
      case 'lookbook':
        if (style) {
          images = await fetchLookbookImages(style, limit);
        }
        break;
      
      case 'brand':
        if (brand && style) {
          images = await fetchBrandStyleImages(brand, style, limit);
        }
        break;
      
      case 'search':
      default:
        if (query) {
          const params: StyleImageSearchParams = {
            query,
            limit,
            imageType,
            size,
          };
          images = await fetchStyleImages(params);
        }
        break;
    }

    return NextResponse.json({
      success: true,
      images,
      count: images.length,
    });

  } catch (error) {
    console.error('Error in style-images API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch style images',
        images: [],
      },
      { status: 500 }
    );
  }
} 