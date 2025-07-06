"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShoppingCart, Star, TrendingUp } from 'lucide-react';
import Image from 'next/image';

interface EnhancedOutfitItem {
  name: string;
  description: string;
  brand: string;
  price: number;
  currency: string;
  website: string;
  website_url: string;
  affiliate_url: string;
  affiliate_network: string;
  commission_rate: number;
  availability: string;
  image_url: string;
  real_product: boolean;
  product_id?: string;
}

interface EnhancedOutfitData {
  main_description: string;
  style_keywords: string[];
  tops: EnhancedOutfitItem[];
  bottoms: EnhancedOutfitItem[];
  accessories: EnhancedOutfitItem[];
  shoes: EnhancedOutfitItem[];
  total_price: number;
  affiliate_products_found: number;
  celebrity_alternatives?: EnhancedOutfitItem[];
}

interface EnhancedOutfitDisplayProps {
  outfitData: EnhancedOutfitData;
  onProductClick?: (productId: string, affiliateUrl: string) => void;
}

export function EnhancedOutfitDisplay({ outfitData, onProductClick }: EnhancedOutfitDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState<'tops' | 'bottoms' | 'accessories' | 'shoes'>('tops');

  const handleProductClick = async (item: EnhancedOutfitItem) => {
    if (item.real_product && item.product_id && item.affiliate_url) {
      // Track the click
      try {
        await fetch('/api/track-product-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.product_id,
            affiliateUrl: item.affiliate_url,
            affiliateNetwork: item.affiliate_network
          })
        });
      } catch (error) {
        console.warn('Failed to track product click:', error);
      }

      // Call the callback
      onProductClick?.(item.product_id, item.affiliate_url);

      // Open affiliate link in new tab
      window.open(item.affiliate_url, '_blank', 'noopener,noreferrer');
    } else if (item.website_url && item.website_url !== '#') {
      window.open(item.website_url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderProductCard = (item: EnhancedOutfitItem, index: number) => (
    <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative bg-gray-100">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <ShoppingCart size={48} />
          </div>
        )}
        
        {item.real_product && (
          <Badge className="absolute top-2 right-2 bg-green-600 text-white">
            <TrendingUp size={12} className="mr-1" />
            Real Product
          </Badge>
        )}
        
        {item.commission_rate > 0 && (
          <Badge variant="secondary" className="absolute top-2 left-2">
            {Math.round(item.commission_rate * 100)}% Commission
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
            <p className="text-xs text-gray-600">{item.brand}</p>
          </div>
          
          <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
          
          <div className="flex items-center justify-between">
            <div>
              {item.price > 0 ? (
                <p className="font-bold text-lg">
                  {item.currency} {item.price.toFixed(2)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Price not available</p>
              )}
            </div>
            
            <Badge 
              variant={item.availability === 'In Stock' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {item.availability}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{item.website}</span>
            {item.affiliate_network && (
              <span className="capitalize">{item.affiliate_network}</span>
            )}
          </div>
          
          <Button
            onClick={() => handleProductClick(item)}
            className="w-full mt-2"
            size="sm"
            disabled={!item.real_product && item.website_url === '#'}
          >
            <ExternalLink size={14} className="mr-2" />
            {item.real_product ? 'Buy Now' : 'View Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const categories = [
    { key: 'tops' as const, label: 'Tops', icon: '👕' },
    { key: 'bottoms' as const, label: 'Bottoms', icon: '👖' },
    { key: 'accessories' as const, label: 'Accessories', icon: '👜' },
    { key: 'shoes' as const, label: 'Shoes', icon: '👟' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Your Enhanced Outfit</h2>
        <p className="text-gray-600">{outfitData.main_description}</p>
        
        <div className="flex flex-wrap justify-center gap-2">
          {outfitData.style_keywords?.map((keyword, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <span>Total: ${outfitData.total_price.toFixed(2)}</span>
          <span>•</span>
          <span>{outfitData.affiliate_products_found} real products found</span>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex justify-center space-x-2">
        {categories.map((category) => (
          <Button
            key={category.key}
            variant={selectedCategory === category.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.key)}
            className="flex items-center gap-2"
          >
            <span>{category.icon}</span>
            {category.label}
            <Badge variant="secondary" className="ml-1">
              {outfitData[category.key]?.length || 0}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {outfitData[selectedCategory]?.map((item, index) => renderProductCard(item, index))}
      </div>

      {/* Celebrity Alternatives */}
      {outfitData.celebrity_alternatives && outfitData.celebrity_alternatives.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="text-yellow-500" size={20} />
            <h3 className="text-lg font-semibold">Celebrity Style Alternatives</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {outfitData.celebrity_alternatives.map((item, index) => renderProductCard(item, index))}
          </div>
        </div>
      )}

      {/* Affiliate Disclosure */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>Affiliate Disclosure:</strong> Some of the links above are affiliate links. 
            We may earn a commission when you make a purchase through these links, at no additional cost to you. 
            This helps support our platform and allows us to continue providing free fashion recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 