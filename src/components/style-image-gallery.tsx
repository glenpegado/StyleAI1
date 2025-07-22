"use client";

import { useState, useEffect } from "react";
import { StyleImage } from "@/lib/style-image-fetcher";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";

interface StyleImageGalleryProps {
  query?: string;
  type?: "search" | "celebrity" | "lookbook" | "brand";
  celebrity?: string;
  style?: string;
  brand?: string;
  limit?: number;
  title?: string;
  showSource?: boolean;
}

export function StyleImageGallery({
  query,
  type = "search",
  celebrity,
  style,
  brand,
  limit = 8,
  title,
  showSource = true,
}: StyleImageGalleryProps) {
  const [images, setImages] = useState<StyleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          type,
          limit: limit.toString(),
        });

        if (query) params.append("query", query);
        if (celebrity) params.append("celebrity", celebrity);
        if (style) params.append("style", style);
        if (brand) params.append("brand", brand);

        const response = await fetch(`/api/style-images?${params}`);
        const data = await response.json();

        if (data.success) {
          setImages(data.images);
        } else {
          setError(data.error || "Failed to fetch style images");
        }
      } catch (err) {
        setError("Failed to fetch style images");
        console.error("Error fetching style images:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [query, type, celebrity, style, brand, limit]);

  const handleImageClick = (image: StyleImage) => {
    // Track image click for analytics (non-blocking)
    if (typeof window !== "undefined" && window.gtag) {
      try {
        window.gtag("event", "style_image_click", {
          image_id: image.id,
          image_title: image.title,
          source: image.source,
        });
      } catch (error) {
        console.warn("Analytics tracking failed:", error);
      }
    }

    // Open source URL in new tab
    window.open(image.sourceUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownload = (image: StyleImage) => {
    // Create a temporary link to download the image
    const link = document.createElement("a");
    link.href = image.imageUrl;
    link.download = `${image.title || "style-image"}.jpg`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-t-lg" />
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No style images found</p>
        <p className="text-sm text-gray-400">
          Try adjusting your search terms or browse trending styles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((image) => (
          <Card
            key={image.id}
            className="group hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-square overflow-hidden rounded-t-lg">
              <img
                src={image.imageUrl}
                alt={image.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                onClick={() => handleImageClick(image)}
                onError={(e) => {
                  // Fallback image if style image fails to load
                  e.currentTarget.src = "/images/placeholder-style.png";
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

              {/* Action buttons */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(image);
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <CardContent className="p-4">
              <h4 className="font-medium text-sm line-clamp-2 mb-2">
                {image.title}
              </h4>

              {showSource && (
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {image.source}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleImageClick(image)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Source
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
