-- Enhanced product and affiliate link schema
-- Based on analysis of whatsonthestar.com and shopencore.ai

-- Products table for structured product data
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  website VARCHAR(255),
  website_url TEXT,
  affiliate_url TEXT,
  affiliate_network VARCHAR(50), -- 'cj', 'shareasale', 'rakuten', etc.
  commission_rate DECIMAL(5,4), -- Commission percentage
  availability VARCHAR(20) DEFAULT 'In Stock', -- 'In Stock', 'Limited', 'Sold Out'
  condition VARCHAR(20) DEFAULT 'New', -- 'New', 'Used', 'Refurbished'
  size VARCHAR(50),
  color VARCHAR(50),
  material VARCHAR(100),
  care_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product images table for multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type VARCHAR(20) DEFAULT 'primary', -- 'primary', 'lifestyle', 'detail', 'thumbnail'
  alt_text VARCHAR(255),
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Celebrity outfits table for better organization
CREATE TABLE IF NOT EXISTS celebrity_outfits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  celebrity_name VARCHAR(100) NOT NULL,
  event_name VARCHAR(255),
  event_date DATE,
  location VARCHAR(255),
  description TEXT,
  source_image_url TEXT,
  source_attribution VARCHAR(255),
  total_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table linking outfits to products
CREATE TABLE IF NOT EXISTS outfit_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID REFERENCES celebrity_outfits(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'tops', 'bottoms', 'shoes', 'accessories'
  position INTEGER DEFAULT 0, -- For ordering items in outfit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(outfit_id, product_id, category)
);

-- Affiliate networks table for managing partnerships
CREATE TABLE IF NOT EXISTS affiliate_networks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  api_endpoint TEXT,
  api_key VARCHAR(255),
  commission_rate DECIMAL(5,4),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product search history for analytics
CREATE TABLE IF NOT EXISTS product_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product clicks for tracking affiliate performance
CREATE TABLE IF NOT EXISTS product_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  affiliate_network VARCHAR(50),
  click_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  referrer TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_celebrity_outfits_celebrity ON celebrity_outfits(celebrity_name);
CREATE INDEX IF NOT EXISTS idx_celebrity_outfits_date ON celebrity_outfits(event_date);
CREATE INDEX IF NOT EXISTS idx_outfit_products_outfit_id ON outfit_products(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_products_category ON outfit_products(category);
CREATE INDEX IF NOT EXISTS idx_product_searches_user_id ON product_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_product_id ON product_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_timestamp ON product_clicks(click_timestamp);

-- Update existing saved_looks table to reference new schema
ALTER TABLE saved_looks ADD COLUMN IF NOT EXISTS outfit_id UUID REFERENCES celebrity_outfits(id);
ALTER TABLE saved_looks ADD COLUMN IF NOT EXISTS products_data JSONB; -- For backward compatibility

-- Insert default affiliate networks
INSERT INTO affiliate_networks (name, commission_rate, is_active) VALUES
  ('Commission Junction', 0.05, true),
  ('ShareASale', 0.06, true),
  ('Rakuten Advertising', 0.04, true),
  ('Impact.com', 0.05, true)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebrity_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access to products and outfits
CREATE POLICY "Public read access to products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Public read access to product images" ON product_images
  FOR SELECT USING (true);

CREATE POLICY "Public read access to celebrity outfits" ON celebrity_outfits
  FOR SELECT USING (true);

CREATE POLICY "Public read access to outfit products" ON outfit_products
  FOR SELECT USING (true);

-- RLS Policies for authenticated users
CREATE POLICY "Users can create product searches" ON product_searches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own searches" ON product_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create product clicks" ON product_clicks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own clicks" ON product_clicks
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for affiliate networks
CREATE POLICY "Admin access to affiliate networks" ON affiliate_networks
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin'); 