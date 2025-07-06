import { ProductGrid } from '@/components/product-grid';
import { StyleImageGallery } from '@/components/style-image-gallery';

export default function TestProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">StyleAI1 - Complete Integration Test</h1>
      
      <div className="space-y-16">
        {/* Products Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">🛍️ Real Products</h2>
          
          <div className="space-y-12">
            {/* Trending Products */}
            <div>
              <ProductGrid 
                type="trending" 
                limit={8} 
                title="Trending Products"
              />
            </div>

            {/* Search Results */}
            <div>
              <ProductGrid 
                query="white sneakers"
                type="search" 
                limit={6} 
                title="White Sneakers"
              />
            </div>

            {/* Category Search */}
            <div>
              <ProductGrid 
                category="jacket"
                type="category" 
                limit={6} 
                title="Jackets"
              />
            </div>

            {/* Celebrity Style Products */}
            <div>
              <ProductGrid 
                celebrity="Chris Brown"
                itemType="jacket"
                type="celebrity" 
                limit={6} 
                title="Chris Brown Style - Jackets"
              />
            </div>
          </div>
        </section>

        {/* Style Images Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">📸 Style Inspiration</h2>
          
          <div className="space-y-12">
            {/* Celebrity Style Images */}
            <div>
              <StyleImageGallery 
                celebrity="Chris Brown"
                style="street style"
                type="celebrity" 
                limit={8} 
                title="Chris Brown Street Style"
              />
            </div>

            {/* Lookbook Images */}
            <div>
              <StyleImageGallery 
                style="oversized fashion"
                type="lookbook" 
                limit={8} 
                title="Oversized Fashion Lookbook"
              />
            </div>

            {/* Brand Style Images */}
            <div>
              <StyleImageGallery 
                brand="Balenciaga"
                style="streetwear"
                type="brand" 
                limit={6} 
                title="Balenciaga Streetwear Style"
              />
            </div>

            {/* General Style Search */}
            <div>
              <StyleImageGallery 
                query="minimalist fashion 2024"
                type="search" 
                limit={8} 
                title="Minimalist Fashion 2024"
              />
            </div>
          </div>
        </section>

        {/* Combined Example */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">🎯 Complete Style Experience</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Style Inspiration */}
            <div>
              <StyleImageGallery 
                celebrity="Travis Scott"
                style="streetwear"
                type="celebrity" 
                limit={4} 
                title="Travis Scott Style Inspiration"
              />
            </div>

            {/* Matching Products */}
            <div>
              <ProductGrid 
                celebrity="Travis Scott"
                itemType="streetwear"
                type="celebrity" 
                limit={4} 
                title="Shop Travis Scott Style"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Setup Instructions */}
      <div className="mt-16 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🔧 Setup Instructions</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>1. Add your API keys to <code className="bg-gray-200 px-1 rounded">.env.local</code>:</p>
          <pre className="bg-gray-200 p-3 rounded text-xs overflow-x-auto">
{`SHOPSTYLE_API_KEY=your_shopstyle_api_key_here
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key_here
GOOGLE_CUSTOM_SEARCH_CX=your_google_cx_id_here`}
          </pre>
          <p>2. Get ShopStyle API key from: <a href="https://www.shopstylecollective.com/" className="text-blue-600 hover:underline">ShopStyle Collective</a></p>
          <p>3. Get Google Custom Search API key from: <a href="https://console.cloud.google.com/" className="text-blue-600 hover:underline">Google Cloud Console</a></p>
          <p>4. Create Custom Search Engine at: <a href="https://programmablesearchengine.google.com/" className="text-blue-600 hover:underline">Google Programmable Search Engine</a></p>
        </div>
      </div>
    </div>
  );
} 