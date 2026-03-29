import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ShoppingCart, ArrowRight, ChevronLeft, ChevronRight, Heart, Share2, Info, Truck, ShieldCheck, RefreshCcw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';

interface Product {
  id: string;
  name_ko: string;
  name_en: string;
  name_zh: string;
  description_ko: string;
  description_en: string;
  description_zh: string;
  details_ko?: string;
  details_en?: string;
  details_zh?: string;
  shipping_info_ko?: string;
  shipping_info_en?: string;
  shipping_info_zh?: string;
  review_info_ko?: string;
  review_info_en?: string;
  review_info_zh?: string;
  price: number;
  price_usd: number;
  original_price: number | null;
  discount_rate: number | null;
  shipping_fee: number | null;
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

export const ProductDetail: React.FC<{ lang: 'KOR' | 'ENG' | 'CHI' }> = ({ lang }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping' | 'reviews'>('details');
  const { addToCart } = useCart();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      if (!id) return;
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError || !productData) {
        toast.error(lang === 'KOR' ? '상품을 찾을 수 없습니다.' : lang === 'ENG' ? 'Product not found.' : '未找到产品。');
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

    if (!isSupabaseConfigured) return;

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
    
    try {
      await addToCart(product.id, selectedOption, quantity);
    } catch (error) {
      // Error handled in CartContext
    }
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
    
    try {
      await addToCart(product.id, selectedOption, quantity);
      navigate('/cart');
    } catch (error) {
      // Error handled in CartContext
    }
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
                  alt={lang === 'KOR' ? product.name_ko : lang === 'ENG' ? product.name_en : product.name_zh}
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
                {lang === 'KOR' ? product.name_ko : lang === 'ENG' ? product.name_en : product.name_zh}
              </h1>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("w-4 h-4", i < 4 ? "text-accent-gold fill-accent-gold" : "text-gray-600")} />
                  ))}
                </div>
                <span className="text-sm text-gray-400">4.8 (120 {lang === 'KOR' ? '리뷰' : lang === 'ENG' ? 'Reviews' : '评论'})</span>
              </div>

              <div className="space-y-1">
                {product.original_price && product.original_price > product.price && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 line-through">
                      {lang === 'KOR' ? formatPrice(product.original_price, 'KRW') : formatPrice(product.original_price / 1300, 'USD')}
                    </span>
                    {product.discount_rate && (
                      <span className="text-sm font-bold text-highlight-red">
                        {product.discount_rate}%
                      </span>
                    )}
                  </div>
                )}
                <div className="text-3xl lg:text-4xl font-serif font-bold text-accent-gold">
                  {lang === 'KOR' ? formatPrice(currentPrice, 'KRW') : formatPrice(currentPriceUsd, 'USD')}
                </div>
                
                {/* Shipping Fee */}
                <div className="flex items-center gap-2 pt-2 text-sm text-gray-400">
                  <span className="font-bold">{lang === 'KOR' ? '배송비' : lang === 'ENG' ? 'Shipping Fee' : '运费'}:</span>
                  <span>
                    {product.shipping_fee && product.shipping_fee > 0 
                      ? (lang === 'KOR' ? formatPrice(product.shipping_fee, 'KRW') : formatPrice(product.shipping_fee / 1300, 'USD'))
                      : (lang === 'KOR' ? '무료' : lang === 'ENG' ? 'Free' : '免费')}
                  </span>
                </div>
              </div>

              <p className="text-gray-400 leading-relaxed">
                {lang === 'KOR' ? product.description_ko : lang === 'ENG' ? product.description_en : product.description_zh}
              </p>
            </div>

            {/* Options */}
            {options.length > 0 && (
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  {lang === 'KOR' ? '옵션 선택' : lang === 'ENG' ? 'Select Option' : '选择选项'}
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
                {lang === 'KOR' ? '수량' : lang === 'ENG' ? 'Quantity' : '数量'}
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
                    ? (lang === 'KOR' ? '품절' : lang === 'ENG' ? 'Out of Stock' : '缺货')
                    : product.stock_quantity < 10 
                      ? (lang === 'KOR' ? `잔여 수량: ${product.stock_quantity}개` : lang === 'ENG' ? `${product.stock_quantity} items left` : `仅剩 ${product.stock_quantity} 件`)
                      : (lang === 'KOR' ? `재고: ${product.stock_quantity}개` : lang === 'ENG' ? `Stock: ${product.stock_quantity} units` : `库存: ${product.stock_quantity} 件`)
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
                {lang === 'KOR' ? '장바구니 담기' : lang === 'ENG' ? 'Add to Cart' : '加入购物车'}
              </button>
              <button 
                onClick={handleBuyNow}
                disabled={product.stock_quantity <= 0}
                className="flex-1 bg-accent-gold text-primary py-5 rounded-2xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock_quantity <= 0 
                  ? (lang === 'KOR' ? '품절' : lang === 'ENG' ? 'Sold Out' : '已售罄')
                  : (lang === 'KOR' ? '바로 구매하기' : lang === 'ENG' ? 'Buy Now' : '立即购买')
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
            <button 
              onClick={() => setActiveTab('details')}
              className={cn(
                "pb-4 font-bold transition-all",
                activeTab === 'details' ? "border-b-2 border-accent-teal text-white" : "text-gray-500 hover:text-white"
              )}
            >
              {lang === 'KOR' ? '상세 정보' : lang === 'ENG' ? 'Details' : '详情'}
            </button>
            <button 
              onClick={() => setActiveTab('shipping')}
              className={cn(
                "pb-4 font-bold transition-all",
                activeTab === 'shipping' ? "border-b-2 border-accent-teal text-white" : "text-gray-500 hover:text-white"
              )}
            >
              {lang === 'KOR' ? '배송/교환/반품' : lang === 'ENG' ? 'Shipping & Returns' : '配送/换货/退货'}
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={cn(
                "pb-4 font-bold transition-all",
                activeTab === 'reviews' ? "border-b-2 border-accent-teal text-white" : "text-gray-500 hover:text-white"
              )}
            >
              {lang === 'KOR' ? '리뷰' : lang === 'ENG' ? 'Reviews' : '评论'}
            </button>
          </div>
          
          <div className="prose prose-invert max-w-none">
            {activeTab === 'details' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
              >
                <div>
                  <h2 className="text-3xl font-serif font-bold text-accent-gold mb-6">
                    {lang === 'KOR' ? '도깨비몰이 보증하는 품질' : lang === 'ENG' ? 'Quality Guaranteed by DOKB' : 'DOKB 保证的品质'}
                  </h2>
                  <div className="text-gray-400 text-lg leading-relaxed mb-8 whitespace-pre-wrap">
                    {lang === 'KOR' 
                      ? (product.details_ko || '이 상품은 한국의 전통과 현대적 감각이 조화롭게 어우러진 프리미엄 제품입니다. 엄격한 품질 관리를 통해 선정되었으며, 전 세계 어디서나 한국의 정취를 느끼실 수 있습니다.')
                      : lang === 'ENG'
                        ? (product.details_en || 'This product is a premium item that harmoniously blends Korean tradition with modern sensibilities. Selected through strict quality control, you can feel the essence of Korea anywhere in the world.')
                        : (product.details_zh || '本产品是和谐融合韩国传统与现代感性的优质产品。通过严格的质量控制精选而成，让您在世界任何地方都能感受到韩国的风情。')}
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-accent-teal/20 text-accent-teal flex items-center justify-center flex-shrink-0 mt-1">
                          <Info className="w-4 h-4" />
                        </div>
                        <p className="text-sm text-gray-300">
                          {lang === 'KOR' 
                            ? (i === 1 ? '천연 성분만을 사용하여 피부 자극을 최소화했습니다.' : i === 2 ? '엄격한 품질 검사를 통과한 정품입니다.' : '친환경 포장재를 사용하여 환경을 생각합니다.')
                            : lang === 'ENG'
                              ? (i === 1 ? 'Minimized skin irritation by using only natural ingredients.' : i === 2 ? 'Authentic product that passed strict quality inspection.' : 'Eco-friendly packaging for a sustainable future.')
                              : (i === 1 ? '仅使用天然成分，最大限度地减少皮肤刺激。' : i === 2 ? '通过严格质量检验的正品。' : '使用环保包装材料，关爱环境。')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <img src={product.images[1] || "https://picsum.photos/seed/detail1/600/800"} alt="" className="rounded-3xl" referrerPolicy="no-referrer" />
                  <img src={product.images[2] || "https://picsum.photos/seed/detail2/600/800"} alt="" className="rounded-3xl mt-12" referrerPolicy="no-referrer" />
                </div>
              </motion.div>
            )}

            {activeTab === 'shipping' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                  <h3 className="text-xl font-bold text-accent-gold mb-6 flex items-center gap-2">
                    <Truck className="w-6 h-6" />
                    {lang === 'KOR' ? '배송 안내' : lang === 'ENG' ? 'Shipping Information' : '配送指南'}
                  </h3>
                  <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {lang === 'KOR' 
                      ? (product.shipping_info_ko || '전 세계 무료 배송 서비스를 제공합니다. 주문 후 영업일 기준 3-7일 이내에 배송이 시작됩니다.')
                      : lang === 'ENG'
                        ? (product.shipping_info_en || 'We provide free worldwide shipping. Shipping starts within 3-7 business days after order.')
                        : (product.shipping_info_zh || '提供全球免费配送服务。下单后 3-7 个工作日内开始配送。')}
                  </div>
                </div>
                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                  <h3 className="text-xl font-bold text-accent-gold mb-6 flex items-center gap-2">
                    <RefreshCcw className="w-6 h-6" />
                    {lang === 'KOR' ? '교환 및 반품' : lang === 'ENG' ? 'Exchange & Returns' : '换货及退货'}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {lang === 'KOR' 
                      ? '상품 수령 후 7일 이내에 교환 및 반품이 가능합니다. 단순 변심에 의한 반품 시 왕복 배송비가 발생할 수 있습니다.'
                      : lang === 'ENG'
                        ? 'Exchanges and returns are possible within 7 days of receipt. Round-trip shipping fees may apply for returns due to change of mind.'
                        : '收到商品后 7 天内可以换货或退货。因单纯改变主意而退货时，可能会产生往返运费。'}
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-bold text-white">4.9</div>
                    <div>
                      <div className="flex text-accent-gold">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Based on 128 reviews</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10">
                  <h3 className="text-xl font-bold text-accent-gold mb-4">
                    {lang === 'KOR' ? '리뷰 안내' : lang === 'ENG' ? 'Review Policy' : '评论指南'}
                  </h3>
                  <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {lang === 'KOR' 
                      ? (product.review_info_ko || '소중한 리뷰를 남겨주시는 분들께 포인트를 적립해 드립니다. 사진과 함께 남겨주시면 더 많은 혜택을 드립니다.')
                      : lang === 'ENG'
                        ? (product.review_info_en || 'Points will be awarded to those who leave valuable reviews. More benefits for photo reviews.')
                        : (product.review_info_zh || '为留下宝贵评论的顾客积攒积分。留下照片评论将获得更多优惠。')}
                  </div>
                </div>

                {/* Placeholder for actual reviews */}
                <div className="space-y-6 opacity-50">
                  {[1, 2].map(i => (
                    <div key={i} className="border-b border-white/10 pb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-accent-gold">
                          {[1, 2, 3, 4, 5].map(j => <Star key={j} className="w-3 h-3 fill-current" />)}
                        </div>
                        <span className="text-xs text-gray-400">User_{i}***</span>
                      </div>
                      <p className="text-sm text-gray-300">Great product! Highly recommended.</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
