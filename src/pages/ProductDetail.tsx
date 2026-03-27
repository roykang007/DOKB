import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ShoppingCart, ArrowRight, ChevronLeft, ChevronRight, Heart, Share2, Info, Truck, ShieldCheck, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';

interface Product {
  id: string;
  name_ko: string;
  name_en: string;
  description_ko: string;
  description_en: string;
  price: number;
  price_usd: number;
  thumbnail: string;
  images: string[];
  category: string;
  brand: string;
  tags: string[];
  stock_quantity: number;
}

interface ProductOption {
  id: string;
  option_name_ko: string;
  option_name_en: string;
  option_value_ko: string;
  option_value_en: string;
  additional_price: number;
  stock_quantity: number;
}

export const ProductDetail: React.FC<{ lang: 'KOR' | 'ENG' }> = ({ lang }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError || !productData) {
        toast.error(lang === 'KOR' ? '상품을 찾을 수 없습니다.' : 'Product not found.');
        navigate('/products');
        return;
      }

      const { data: optionsData, error: optionsError } = await supabase
        .from('product_options')
        .select('*')
        .eq('product_id', id);

      setProduct(productData);
      setOptions(optionsData || []);
      setLoading(false);
    };

    fetchProduct();

    // Real-time subscription for product stock
    const channel = supabase
      .channel(`product_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${id}`
        },
        (payload) => {
          setProduct(prev => prev ? { ...prev, stock_quantity: payload.new.stock_quantity } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, lang, navigate]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.stock_quantity <= 0) {
      toast.error(lang === 'KOR' ? '품절된 상품입니다.' : 'Out of stock.');
      return;
    }
    if (options.length > 0 && !selectedOption) {
      toast.error(lang === 'KOR' ? '옵션을 선택해주세요.' : 'Please select an option.');
      return;
    }
    
    await addToCart(product.id, selectedOption, quantity);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (product.stock_quantity <= 0) {
      toast.error(lang === 'KOR' ? '품절된 상품입니다.' : 'Out of stock.');
      return;
    }
    if (options.length > 0 && !selectedOption) {
      toast.error(lang === 'KOR' ? '옵션을 선택해주세요.' : 'Please select an option.');
      return;
    }
    
    await addToCart(product.id, selectedOption, quantity);
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-teal" />
      </div>
    );
  }

  if (!product) return null;

  const currentPrice = product.price + (options.find(o => o.id === selectedOption)?.additional_price || 0);
  const currentPriceUsd = product.price_usd + (options.find(o => o.id === selectedOption)?.additional_price / 1300 || 0); // Simple conversion for USD

  return (
    <div className="pt-32 pb-20 min-h-screen bg-primary">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-white/5 border border-white/10">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={(product.images?.[activeImage] || product.thumbnail) || 'https://picsum.photos/seed/product/800/800'} 
                  alt={lang === 'KOR' ? product.name_ko : product.name_en}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                <button 
                  onClick={() => setActiveImage(prev => (prev > 0 ? prev - 1 : (product.images?.length || 1) - 1))}
                  className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all pointer-events-auto"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setActiveImage(prev => (prev < (product.images?.length || 1) - 1 ? prev + 1 : 0))}
                  className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all pointer-events-auto"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {( (product.images?.length ? product.images : [product.thumbnail]) || [] ).filter(url => url && url.trim() !== "").map((img, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all",
                    activeImage === i ? "border-accent-teal" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-accent-teal uppercase tracking-widest">{product.brand}</span>
                <div className="flex gap-2">
                  <button className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-highlight-red hover:bg-white/10 transition-all">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-accent-teal hover:bg-white/10 transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
                {lang === 'KOR' ? product.name_ko : product.name_en}
              </h1>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("w-4 h-4", i < 4 ? "text-accent-gold fill-accent-gold" : "text-gray-600")} />
                  ))}
                </div>
                <span className="text-sm text-gray-400">4.8 (120 Reviews)</span>
              </div>

              <div className="text-3xl lg:text-4xl font-serif font-bold text-accent-gold">
                {lang === 'KOR' ? formatPrice(currentPrice, 'KRW') : formatPrice(currentPriceUsd, 'USD')}
              </div>

              <p className="text-gray-400 leading-relaxed">
                {lang === 'KOR' ? product.description_ko : product.description_en}
              </p>
            </div>

            {/* Options */}
            {options.length > 0 && (
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {lang === 'KOR' ? '옵션 선택' : 'Select Option'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((option) => (
                    <button 
                      key={option.id}
                      onClick={() => setSelectedOption(option.id)}
                      className={cn(
                        "px-6 py-4 rounded-2xl border text-left transition-all",
                        selectedOption === option.id 
                          ? "bg-accent-teal/10 border-accent-teal text-accent-teal" 
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                      )}
                    >
                      <div className="text-sm font-bold">
                        {lang === 'KOR' ? option.option_value_ko : option.option_value_en}
                      </div>
                      {option.additional_price > 0 && (
                        <div className="text-xs opacity-70">
                          +{lang === 'KOR' ? formatPrice(option.additional_price, 'KRW') : formatPrice(option.additional_price / 1300, 'USD')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                {lang === 'KOR' ? '수량' : 'Quantity'}
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 py-3 hover:bg-white/10 transition-colors text-white"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-white">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-4 py-3 hover:bg-white/10 transition-colors text-white"
                  >
                    +
                  </button>
                </div>
                <span className={cn(
                  "text-xs font-bold",
                  product.stock_quantity < 10 ? "text-highlight-red" : "text-gray-500"
                )}>
                  {product.stock_quantity <= 0 
                    ? (lang === 'KOR' ? '품절' : 'Out of Stock')
                    : product.stock_quantity < 10 
                      ? (lang === 'KOR' ? `잔여 수량: ${product.stock_quantity}개` : `${product.stock_quantity} items left`)
                      : (lang === 'KOR' ? `재고: ${product.stock_quantity}개` : `Stock: ${product.stock_quantity} units`)
                  }
                </span>
              </div>
            </div>
 
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={handleAddToCart}
                disabled={product.stock_quantity <= 0}
                className="flex-1 bg-white/10 text-white py-5 rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {lang === 'KOR' ? '장바구니' : 'Add to Cart'}
              </button>
              <button 
                onClick={handleBuyNow}
                disabled={product.stock_quantity <= 0}
                className="flex-1 bg-accent-gold text-primary py-5 rounded-2xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock_quantity <= 0 
                  ? (lang === 'KOR' ? '품절' : 'Sold Out')
                  : (lang === 'KOR' ? '바로 구매' : 'Buy Now')
                }
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
              <div className="text-center space-y-2">
                <Truck className="w-6 h-6 text-accent-teal mx-auto" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '무료 배송' : 'Free Shipping'}</p>
              </div>
              <div className="text-center space-y-2">
                <ShieldCheck className="w-6 h-6 text-accent-teal mx-auto" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '정품 보장' : 'Authentic'}</p>
              </div>
              <div className="text-center space-y-2">
                <RefreshCcw className="w-6 h-6 text-accent-teal mx-auto" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '쉬운 반품' : 'Easy Returns'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-20 pt-20 border-t border-white/10">
          <div className="flex gap-12 border-b border-white/10 mb-12">
            <button className="pb-4 border-b-2 border-accent-teal text-white font-bold">
              {lang === 'KOR' ? '상세 정보' : 'Details'}
            </button>
            <button className="pb-4 text-gray-500 hover:text-white transition-colors">
              {lang === 'KOR' ? '배송/교환/반품' : 'Shipping & Returns'}
            </button>
            <button className="pb-4 text-gray-500 hover:text-white transition-colors">
              {lang === 'KOR' ? '리뷰' : 'Reviews'}
            </button>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-serif font-bold text-accent-gold mb-6">
                  {lang === 'KOR' ? '도깨비몰이 보증하는 품질' : 'Quality Guaranteed by DOKB'}
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-8">
                  {lang === 'KOR' 
                    ? '이 상품은 한국의 전통과 현대적 감각이 조화롭게 어우러진 프리미엄 제품입니다. 엄격한 품질 관리를 통해 선정되었으며, 전 세계 어디서나 한국의 정취를 느끼실 수 있습니다.'
                    : 'This product is a premium item that harmoniously blends Korean tradition with modern sensibilities. Selected through strict quality control, you can feel the essence of Korea anywhere in the world.'}
                </p>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-accent-teal/20 text-accent-teal flex items-center justify-center flex-shrink-0 mt-1">
                        <Info className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-gray-300">
                        {lang === 'KOR' 
                          ? '천연 성분만을 사용하여 피부 자극을 최소화했습니다.' 
                          : 'Minimized skin irritation by using only natural ingredients.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <img src="https://picsum.photos/seed/detail1/600/800" alt="" className="rounded-3xl" referrerPolicy="no-referrer" />
                <img src="https://picsum.photos/seed/detail2/600/800" alt="" className="rounded-3xl mt-12" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
