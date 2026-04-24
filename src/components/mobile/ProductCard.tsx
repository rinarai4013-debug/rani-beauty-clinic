'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, ShoppingBag, RefreshCw, Star, Sparkles } from 'lucide-react';
import type { ShopProduct } from '@/types/mobile';

interface ProductCardProps {
  product: ShopProduct;
  onAddToCart?: (productId: string) => void;
  onToggleFavorite?: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart, onToggleFavorite }: ProductCardProps) {
  return (
    <motion.div whileTap={{ scale: 0.98 }} className="bg-white rounded-2xl shadow-sm border border-rani-border/30 overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-rani-cream to-white">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={600}
            height={600}
            unoptimized
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={40} className="text-rani-gold-accessible/20" />
          </div>
        )}

        {/* AI Recommended badge */}
        {product.isRecommended && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-rani-navy/80 backdrop-blur-sm rounded-lg">
            <Sparkles size={10} className="text-rani-gold-accessible" />
            <span className="text-[9px] text-white font-body font-medium">AI Pick</span>
          </div>
        )}

        {/* Favorite button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(product.id);
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <Heart
            size={14}
            className={product.isFavorite ? 'text-red-500 fill-red-500' : 'text-rani-muted'}
          />
        </motion.button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[10px] text-rani-gold-accessible font-body font-semibold uppercase tracking-wider">
          {product.brand}
        </p>
        <h4 className="font-heading text-rani-navy text-sm font-semibold leading-tight mt-0.5 line-clamp-2">
          {product.name}
        </h4>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] text-rani-text font-body">
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        {/* Price + action */}
        <div className="flex items-center justify-between mt-2.5">
          <div>
            <span className="text-base font-heading font-bold text-rani-navy">
              ${product.price}
            </span>
            {product.subscriptionAvailable && product.subscriptionDiscount && (
              <span className="block text-[10px] text-emerald-600 font-body">
                <RefreshCw size={8} className="inline mr-0.5" />
                Save {product.subscriptionDiscount}% on subscription
              </span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onAddToCart?.(product.id)}
            disabled={!product.inStock}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              product.inStock
                ? 'bg-rani-navy text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <ShoppingBag size={14} />
          </motion.button>
        </div>

        {product.recommendationReason && (
          <p className="text-[10px] text-rani-muted font-body mt-2 italic">
            {product.recommendationReason}
          </p>
        )}
      </div>
    </motion.div>
  );
}
