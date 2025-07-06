// Style Image Fetcher for StyleAI1
// Fetches fashion inspiration, celebrity, and lookbook images using Google Custom Search API

import axios from 'axios';

// Google Custom Search API Configuration
const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || 'YOUR_GOOGLE_API_KEY';
const GOOGLE_CX = process.env.GOOGLE_CUSTOM_SEARCH_CX || 'YOUR_GOOGLE_CX_ID';
const BASE_URL = 'https://www.googleapis.com/customsearch/v1';

export interface StyleImage {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  sourceUrl: string;
  source: string;
  width: number;
  height: number;
}

export interface StyleImageSearchParams {
  query: string;
  limit?: number;
  imageType?: 'photo' | 'face' | 'clipart' | 'lineart' | 'animated';
  size?: 'huge' | 'icon' | 'large' | 'xlarge' | 'xxlarge' | 'small' | 'medium';
  colorType?: 'color' | 'gray' | 'mono';
  rights?: 'cc_publicdomain' | 'cc_attribute' | 'cc_sharealike' | 'cc_noncommercial' | 'cc_nonderived';
}

/**
 * Fetch style/lookbook images from Google Custom Search API
 */
export async function fetchStyleImages(params: StyleImageSearchParams): Promise<StyleImage[]> {
  try {
    const { 
      query, 
      limit = 10, 
      imageType = 'photo', 
      size = 'large',
      colorType = 'color',
      rights 
    } = params;

    const response = await axios.get(BASE_URL, {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CX,
        q: query,
        searchType: 'image',
        num: Math.min(limit, 10), // Google CSE max is 10 per request
        imgType: imageType,
        imgSize: size,
        imgColorType: colorType,
        ...(rights && { rights }),
        safe: 'active',
      },
    });

    if (!response.data.items) {
      console.warn('No style images found in Google CSE response');
      return [];
    }

    const images: StyleImage[] = response.data.items.map((item: any, index: number) => ({
      id: item.link || `style-image-${index}`,
      title: item.title || 'Style Image',
      imageUrl: item.link,
      thumbnailUrl: item.image?.thumbnailLink || item.link,
      sourceUrl: item.image?.contextLink || item.link,
      source: extractDomain(item.image?.contextLink || item.link),
      width: item.image?.width || 0,
      height: item.image?.height || 0,
    }));

    return images;
  } catch (error) {
    console.error('Error fetching style images:', error);
    return [];
  }
}

/**
 * Fetch celebrity style images
 */
export async function fetchCelebrityStyleImages(
  celebrityName: string,
  style?: string,
  limit: number = 8
): Promise<StyleImage[]> {
  const query = style 
    ? `${celebrityName} ${style} fashion style outfit`
    : `${celebrityName} fashion style outfit`;
  
  return fetchStyleImages({
    query,
    limit,
    imageType: 'photo',
    size: 'large',
  });
}

/**
 * Fetch lookbook/inspiration images
 */
export async function fetchLookbookImages(
  style: string,
  limit: number = 8
): Promise<StyleImage[]> {
  const query = `${style} fashion lookbook street style inspiration`;
  
  return fetchStyleImages({
    query,
    limit,
    imageType: 'photo',
    size: 'large',
  });
}

/**
 * Fetch brand/style combination images
 */
export async function fetchBrandStyleImages(
  brand: string,
  style: string,
  limit: number = 6
): Promise<StyleImage[]> {
  const query = `${brand} ${style} fashion style outfit`;
  
  return fetchStyleImages({
    query,
    limit,
    imageType: 'photo',
    size: 'large',
  });
}

/**
 * Extract domain from URL for source attribution
 */
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

/**
 * Get trending style searches (placeholder for future implementation)
 */
export async function getTrendingStyleSearches(): Promise<string[]> {
  // For now, return popular fashion searches
  return [
    'street style 2024',
    'minimalist fashion',
    'oversized fashion',
    'vintage streetwear',
    'luxury street style',
    'athleisure fashion',
  ];
} 