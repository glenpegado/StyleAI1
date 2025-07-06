# Product Integration Guide for StyleAI1

## Overview
This guide explains how to integrate real product data (images, prices, links) into your StyleAI1 app using the ShopStyle API.

## What's Been Added

### 1. Product Fetcher (`src/lib/product-fetcher.ts`)
- Fetches real product data from ShopStyle API
- Supports search, category browsing, trending products, and celebrity style matching
- Returns structured product data with images, prices, and affiliate links

### 2. API Route (`src/app/api/products/route.ts`)
- RESTful endpoint for fetching products
- Supports multiple search types: search, category, trending, celebrity
- Handles errors gracefully

### 3. Product Grid Component (`src/components/product-grid.tsx`)
- React component to display products in a responsive grid
- Shows product images, prices, brands, and retailer info
- Clickable cards that open product links in new tabs
- Loading states and error handling

### 4. Test Page (`src/app/test-products/page.tsx`)
- Demo page showing different product grid configurations
- Visit `/test-products` to see it in action

## Setup Instructions

### 1. Get ShopStyle API Access
1. Sign up at [ShopStyle Collective](https://www.shopstylecollective.com/)
2. Go to your dashboard and get your API key (pid)
3. Add it to your `.env.local` file:
   ```
   SHOPSTYLE_API_KEY=your_api_key_here
   ```

### 2. Test the Integration
1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000/test-products`
3. You should see product grids with real images and links

## Usage Examples

### Basic Product Search
```tsx
<ProductGrid 
  query="white sneakers"
  type="search" 
  limit={8} 
  title="White Sneakers"
/>
```

### Category Browse
```tsx
<ProductGrid 
  category="jacket"
  type="category" 
  limit={6} 
  title="Jackets"
/>
```

### Trending Products
```tsx
<ProductGrid 
  type="trending" 
  limit={8} 
  title="Trending Products"
/>
```

### Celebrity Style
```tsx
<ProductGrid 
  celebrity="Chris Brown"
  itemType="jacket"
  type="celebrity" 
  limit={6} 
  title="Chris Brown Style - Jackets"
/>
```

## API Endpoints

### GET /api/products
Query parameters:
- `query` - Search term
- `category` - Product category
- `type` - Search type (search, category, trending, celebrity)
- `celebrity` - Celebrity name (for celebrity type)
- `itemType` - Item type (for celebrity type)
- `limit` - Number of results (default: 8)

Example: `/api/products?query=white sneakers&type=search&limit=6`

## Product Data Structure
```typescript
interface Product {
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
```

## Next Steps

### 1. Integrate with Your AI Outfit Generator
- Modify your outfit generation API to include product searches
- Use the product fetcher to find real items matching AI suggestions

### 2. Add More Product Sources
- eBay API for secondhand items
- Amazon Product Advertising API
- Other affiliate networks (Rakuten, CJ, ShareASale)

### 3. Implement Product Tracking
- Track which products users click
- Store favorite products in user profiles
- Analytics for popular items

### 4. Add Product Filtering
- Price range filters
- Brand filters
- Size and color options

## Troubleshooting

### No Products Showing
1. Check your ShopStyle API key is correct
2. Verify the API key is in `.env.local`
3. Check browser console for errors
4. Try different search terms

### Images Not Loading
- Product images come from ShopStyle CDN
- Some products may not have images
- Check network tab for failed image requests

### API Errors
- Check ShopStyle API documentation for rate limits
- Verify your API key has proper permissions
- Check server logs for detailed error messages

## Legal Considerations
- ShopStyle provides affiliate links - you earn commissions on sales
- Product images are provided by ShopStyle/retailers
- Follow ShopStyle's terms of service
- Add affiliate disclaimers to your site

## Support
- ShopStyle API docs: https://www.shopstylecollective.com/
- For technical issues, check the browser console and server logs 