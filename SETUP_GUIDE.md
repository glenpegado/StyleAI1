# Complete Setup Guide for StyleAI1 Product Integration

## 🎯 What You Now Have

Your StyleAI1 app now includes a complete product integration system with:

### ✅ **Real Product Data** (ShopStyle API)
- Product images, prices, and affiliate links
- Search by query, category, celebrity style
- Trending products
- Clickable product cards

### ✅ **Style Inspiration Images** (Google Custom Search API)
- Celebrity fashion photos
- Lookbook and street style images
- Brand-specific style galleries
- Source attribution and download options

### ✅ **Complete UI Components**
- ProductGrid component for shopping
- StyleImageGallery component for inspiration
- Responsive design with loading states
- Error handling and fallbacks

## 🚀 Quick Start

### 1. **Get ShopStyle API Key**
1. Go to [ShopStyle Collective](https://www.shopstylecollective.com/)
2. Sign up for a free account
3. Go to your dashboard
4. Copy your API key (pid)

### 2. **Get Google Custom Search API**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Custom Search API"
4. Create credentials (API key)
5. Copy your API key

### 3. **Create Google Custom Search Engine**
1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Create a search engine"
3. Configure for fashion sites:
   - **Sites to search**: `*.vogue.com, *.pinterest.com, *.grailed.com, *.hypebeast.com, *.complex.com`
   - **Name**: "StyleAI1 Fashion Search"
   - **Language**: English
4. Copy your Search Engine ID (cx)

### 4. **Add Environment Variables**
Create or update your `.env.local` file:

```bash
# Supabase (your existing setup)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI (your existing setup)
OPENAI_API_KEY=your_openai_api_key_here

# Product Integration APIs
SHOPSTYLE_API_KEY=your_shopstyle_api_key_here
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key_here
GOOGLE_CUSTOM_SEARCH_CX=your_google_cx_id_here
```

### 5. **Test the Integration**
1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/test-products`
3. You should see both products and style images!

## 📁 Files Created

```
src/
├── lib/
│   ├── product-fetcher.ts          # ShopStyle API integration
│   └── style-image-fetcher.ts      # Google Custom Search API integration
├── app/
│   ├── api/
│   │   ├── products/route.ts       # Product API endpoint
│   │   └── style-images/route.ts   # Style images API endpoint
│   └── test-products/page.tsx      # Demo page
└── components/
    ├── product-grid.tsx            # Product display component
    └── style-image-gallery.tsx     # Style image display component
```

## 🛠️ Usage Examples

### Product Grid Component
```tsx
// Basic product search
<ProductGrid 
  query="white sneakers"
  type="search" 
  limit={8} 
  title="White Sneakers"
/>

// Celebrity style products
<ProductGrid 
  celebrity="Chris Brown"
  itemType="jacket"
  type="celebrity" 
  limit={6} 
  title="Chris Brown Style"
/>

// Category browse
<ProductGrid 
  category="jacket"
  type="category" 
  limit={6} 
  title="Jackets"
/>
```

### Style Image Gallery Component
```tsx
// Celebrity style images
<StyleImageGallery 
  celebrity="Chris Brown"
  style="street style"
  type="celebrity" 
  limit={8} 
  title="Chris Brown Street Style"
/>

// Lookbook images
<StyleImageGallery 
  style="oversized fashion"
  type="lookbook" 
  limit={8} 
  title="Oversized Fashion"
/>

// Brand style images
<StyleImageGallery 
  brand="Balenciaga"
  style="streetwear"
  type="brand" 
  limit={6} 
  title="Balenciaga Style"
/>
```

## 🔌 API Endpoints

### Products API
- `GET /api/products?query=white sneakers&type=search&limit=8`
- `GET /api/products?category=jacket&type=category&limit=6`
- `GET /api/products?celebrity=Chris Brown&itemType=jacket&type=celebrity&limit=6`
- `GET /api/products?type=trending&limit=8`

### Style Images API
- `GET /api/style-images?query=street style&type=search&limit=8`
- `GET /api/style-images?celebrity=Chris Brown&style=street style&type=celebrity&limit=8`
- `GET /api/style-images?style=oversized fashion&type=lookbook&limit=8`
- `GET /api/style-images?brand=Balenciaga&style=streetwear&type=brand&limit=6`

## 🎨 Integration with Your AI Outfit Generator

### Option 1: Enhance Existing Outfit Generation
Modify your outfit generation API to include product searches:

```typescript
// In your outfit generation API
import { fetchProducts } from '@/lib/product-fetcher';

// After generating outfit suggestions, fetch real products
const outfitItems = ['white sneakers', 'denim jacket', 'black t-shirt'];
const products = await Promise.all(
  outfitItems.map(item => fetchProducts({ query: item, limit: 3 }))
);

// Return both AI suggestions and real products
return {
  outfit: aiGeneratedOutfit,
  products: products.flat()
};
```

### Option 2: Create a Combined Component
```tsx
function OutfitWithProducts({ outfitSuggestion }) {
  return (
    <div className="space-y-8">
      {/* AI Generated Outfit */}
      <div className="outfit-display">
        {/* Your existing outfit display */}
      </div>
      
      {/* Real Products */}
      <ProductGrid 
        query={outfitSuggestion.items.join(' ')}
        type="search" 
        limit={8} 
        title="Shop This Look"
      />
      
      {/* Style Inspiration */}
      <StyleImageGallery 
        query={`${outfitSuggestion.style} fashion`}
        type="search" 
        limit={6} 
        title="Style Inspiration"
      />
    </div>
  );
}
```

## 💰 Monetization

### Affiliate Commissions
- ShopStyle provides affiliate links automatically
- You earn commissions on sales through your links
- No additional setup required

### Analytics Tracking
Both components include analytics events:
- `product_click` - When users click product links
- `style_image_click` - When users click style images

## 🔧 Troubleshooting

### No Products Showing
1. Check ShopStyle API key in `.env.local`
2. Verify API key is valid in ShopStyle dashboard
3. Check browser console for errors
4. Try different search terms

### No Style Images Showing
1. Check Google API key and CX ID in `.env.local`
2. Verify Custom Search Engine is configured for fashion sites
3. Check Google Cloud Console for API quotas
4. Ensure Custom Search API is enabled

### API Rate Limits
- ShopStyle: Check your account limits
- Google Custom Search: 100 free queries/day, then $5 per 1000 queries

## 🚀 Next Steps

### 1. **Integrate with Your Main App**
- Add ProductGrid to your dashboard
- Include StyleImageGallery in outfit results
- Create combined outfit + shopping experience

### 2. **Add More Product Sources**
- eBay API for secondhand items
- Amazon Product Advertising API
- Other affiliate networks (Rakuten, CJ, ShareASale)

### 3. **Enhance User Experience**
- Product filtering (price, brand, size)
- User favorites and wishlists
- Personalized recommendations
- Social sharing features

### 4. **Advanced Features**
- Image recognition for outfit matching
- Price tracking and alerts
- Size recommendations
- Outfit combinations

## 📞 Support

- **ShopStyle API**: [Documentation](https://www.shopstylecollective.com/)
- **Google Custom Search**: [Documentation](https://developers.google.com/custom-search)
- **Technical Issues**: Check browser console and server logs
- **API Limits**: Monitor usage in respective dashboards

Your StyleAI1 app now has the same capabilities as ShopEncore and WhatsOnTheStar! 🎉 