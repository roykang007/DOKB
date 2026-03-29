import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ShoppingBag, ArrowRight, ChevronLeft, Info } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPrice, cn } from '../lib/utils';

export const Cart: React.FC<{ lang: 'KOR' | 'ENG' | 'CHI' }> = ({ lang }) => {
  const { cartItems, updateQuantity, removeFromCart, totalAmount, totalAmountUsd, loading } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-teal" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-primary">
        <div className="container mx-auto px-6 text-center py-40">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="w-12 h-12 text-gray-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-4">
            {lang === 'KOR' ? '장바구니가 비어 있습니다' : 'Your cart is empty'}
          </h1>
          <p className="text-gray-500 mb-12 max-w-md mx-auto">
            {lang === 'KOR' ? '도깨비몰의 마법 같은 상품들을 둘러보세요!' : 'Explore the magical products of DOKB Mall!'}
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 bg-accent-gold text-primary px-10 py-4 rounded-full font-bold hover:brightness-110 transition-all"
          >
            {lang === 'KOR' ? '쇼핑하러 가기' : 'Go Shopping'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-primary">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-4 mb-12">
          <Link to="/products" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">
            {lang === 'KOR' ? '장바구니' : lang === 'ENG' ? 'Shopping Cart' : '购物车'}
            <span className="ml-4 text-lg font-sans font-normal text-gray-500">({cartItems.length})</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item) => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col sm:flex-row gap-6 items-center"
                >
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0">
                    <img 
                      src={(item.product?.thumbnail && item.product.thumbnail.trim() !== "") ? item.product.thumbnail : 'https://picsum.photos/seed/product/200/200'} 
                      alt={lang === 'KOR' ? item.product?.name_ko : item.product?.name_en}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="text-xl font-bold text-white">
                        {lang === 'KOR' ? item.product?.name_ko : item.product?.name_en}
                      </h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-500 hover:text-highlight-red transition-colors p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {item.option && (
                      <p className="text-sm text-accent-teal font-bold uppercase tracking-widest">
                        {lang === 'KOR' ? item.option.option_value_ko : item.option.option_value_en}
                      </p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                      <div className="flex items-center justify-center sm:justify-start bg-white/5 border border-white/10 rounded-xl overflow-hidden w-fit mx-auto sm:mx-0">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="px-4 py-2 hover:bg-white/10 transition-colors text-white"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-4 py-2 hover:bg-white/10 transition-colors text-white"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-xl font-serif font-bold text-accent-gold">
                        {lang === 'KOR' 
                          ? formatPrice((item.product?.price || 0) * item.quantity, 'KRW') 
                          : formatPrice((item.product?.price_usd || 0) * item.quantity, 'USD')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 sticky top-32">
              <h2 className="text-2xl font-serif font-bold text-white mb-8">
                {lang === 'KOR' ? '주문 요약' : lang === 'ENG' ? 'Order Summary' : '订单摘要'}
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-400">
                  <span>{lang === 'KOR' ? '상품 금액' : lang === 'ENG' ? 'Subtotal' : '小计'}</span>
                  <span>{lang === 'KOR' ? formatPrice(totalAmount, 'KRW') : formatPrice(totalAmountUsd, 'USD')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>{lang === 'KOR' ? '배송비' : lang === 'ENG' ? 'Shipping' : '运费'}</span>
                  <span className="text-accent-teal font-bold">{lang === 'KOR' ? '무료' : lang === 'ENG' ? 'FREE' : '免费'}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-lg font-bold text-white">{lang === 'KOR' ? '총 결제 금액' : lang === 'ENG' ? 'Total' : '总计'}</span>
                  <span className="text-3xl font-serif font-bold text-accent-gold">
                    {lang === 'KOR' ? formatPrice(totalAmount, 'KRW') : formatPrice(totalAmountUsd, 'USD')}
                  </span>
                </div>
              </div>

              <div className="bg-accent-teal/10 rounded-2xl p-4 flex gap-3 mb-8 border border-accent-teal/20">
                <Info className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5" />
                <p className="text-xs text-accent-teal leading-relaxed">
                  {lang === 'KOR' 
                    ? '관세 및 부가세는 배송 국가의 규정에 따라 별도로 발생할 수 있습니다.' 
                    : lang === 'ENG' ? 'Customs duties and taxes may be charged separately depending on the shipping country.' : '根据收货国家的规定，可能会另外产生关税和增值税。'}
                </p>
              </div>

              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-accent-gold text-primary py-5 rounded-2xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/20"
              >
                {lang === 'KOR' ? '결제하기' : lang === 'ENG' ? 'Checkout' : '结账'}
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <div className="mt-6 flex justify-center gap-4 opacity-30 grayscale">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
