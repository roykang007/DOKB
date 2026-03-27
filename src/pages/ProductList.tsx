import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ChevronDown, Star, ShoppingCart, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { formatPrice, cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name_ko: string;
  name_en: string;
  price: number;
  price_usd: number;
  thumbnail: string;
  category: string;
  brand: string;
  tags: string[];
  stock_quantity: number;
}

export const ProductList: React.FC<{ lang: 'KOR' | 'ENG' }> = ({ lang }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const { addToCart } = useCart();

  const categories = [
    { id: 'all', label: lang === 'KOR' ? '전체' : 'All' },
    { id: 'beauty', label: lang === 'KOR' ? 'K-뷰티' : 'K-Beauty' },
    { id: 'food', label: lang === 'KOR' ? 'K-푸드' : 'K-Food' },
    { id: 'lifestyle', label: lang === 'KOR' ? '생활용품' : 'Lifestyle' },
    { id: 'dokb_brand', label: lang === 'KOR' ? 'DOKB 브랜드' : 'DOKB Brand' },
  ];

  const sortOptions = [
    { id: 'newest', label: lang === 'KOR' ? '신상품순' : 'Newest' },
    { id: 'price_low', label: lang === 'KOR' ? '낮은가격순' : 'Price: Low to High' },
    { id: 'price_high', label: lang === 'KOR' ? '높은가격순' : 'Price: High to Low' },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from('products').select('*').eq('is_active', true);

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`name_ko.ilike.%${search}%,name_en.ilike.%${search}%`);
      }

      if (sort === 'price_low') {
        query = query.order('price', { ascending: true });
      } else if (sort === 'price_high') {
        query = query.order('price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [category, search, sort]);

  return (
    <div className="pt-32 pb-20 min-h-screen bg-primary">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl lg:text-6xl font-serif font-bold text-accent-gold mb-4">
              {lang === 'KOR' ? '도깨비몰 상품관' : 'DOKB Collections'}
            </h1>
            <p className="text-gray-400">
              {lang === 'KOR' ? '엄선된 프리미엄 K-상품을 만나보세요' : 'Discover our curated premium K-products'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder={lang === 'KOR' ? '상품 검색...' : 'Search products...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-3 outline-none focus:border-accent-teal transition-all w-full sm:w-64"
              />
            </div>
            <div className="relative group">
              <button className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-6 py-3 hover:bg-white/10 transition-all">
                <Filter className="w-4 h-4 text-accent-teal" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  {sortOptions.find(o => o.id === sort)?.label}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-primary border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                {sortOptions.map((option) => (
                  <button 
                    key={option.id}
                    onClick={() => setSort(option.id)}
                    className={cn(
                      "w-full text-left px-6 py-3 text-sm hover:bg-white/5 transition-colors",
                      sort === option.id ? "text-accent-teal font-bold" : "text-gray-400"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-12">
          {categories.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all border",
                category === cat.id 
                  ? "bg-accent-gold border-accent-gold text-primary" 
                  : "bg-transparent border-white/10 text-gray-400 hover:border-white/30"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/5 aspect-square rounded-3xl mb-4" />
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative aspect-square rounded-3xl overflow-hidden mb-4 bg-white/5 border border-white/5">
                  <img 
                    src={(product.thumbnail && product.thumbnail.trim() !== "") ? product.thumbnail : 'https://picsum.photos/seed/product/400/400'} 
                    alt={lang === 'KOR' ? product.name_ko : product.name_en}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Link 
                      to={`/products/${product.id}`}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary hover:bg-accent-teal hover:text-white transition-all"
                    >
                      <Search className="w-5 h-5" />
                    </Link>
                    <button 
                      onClick={() => addToCart(product.id, null, 1)}
                      className="w-12 h-12 bg-accent-gold rounded-full flex items-center justify-center text-primary hover:scale-110 transition-all"
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                  {product.stock_quantity === 0 && (
                    <div className="absolute top-4 left-4 bg-highlight-red text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                      Sold Out
                    </div>
                  )}
                  {product.tags?.includes('new') && (
                    <div className="absolute top-4 right-4 bg-accent-teal text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                      New
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-accent-teal uppercase tracking-widest">{product.brand}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-accent-gold fill-accent-gold" />
                      <span className="text-[10px] text-gray-400">4.8 (120)</span>
                    </div>
                  </div>
                  <Link to={`/products/${product.id}`} className="block">
                    <h3 className="text-lg font-bold text-white group-hover:text-accent-gold transition-colors line-clamp-1">
                      {lang === 'KOR' ? product.name_ko : product.name_en}
                    </h3>
                  </Link>
                  <p className="text-xl font-serif font-bold text-white">
                    {lang === 'KOR' ? formatPrice(product.price, 'KRW') : formatPrice(product.price_usd, 'USD')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40">
            <p className="text-gray-500 text-xl">
              {lang === 'KOR' ? '검색 결과가 없습니다.' : 'No products found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
