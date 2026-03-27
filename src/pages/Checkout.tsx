import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ArrowRight, Truck, CreditCard, ShieldCheck, CheckCircle2, Info, MapPin, User, Mail, Phone, Globe } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabase';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';

/**
 * SQL for Supabase RPC (Run this in Supabase SQL Editor):
 * 
 * CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER, p_option_id UUID DEFAULT NULL)
 * RETURNS VOID AS $$
 * DECLARE
 *     v_current_stock INTEGER;
 * BEGIN
 *     -- Lock the product row
 *     SELECT stock_quantity INTO v_current_stock
 *     FROM products
 *     WHERE id = p_product_id
 *     FOR UPDATE;
 * 
 *     IF v_current_stock < p_quantity THEN
 *         RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
 *     END IF;
 * 
 *     -- Update product stock
 *     UPDATE products
 *     SET stock_quantity = stock_quantity - p_quantity
 *     WHERE id = p_product_id;
 * 
 *     -- Update option stock if provided
 *     IF p_option_id IS NOT NULL THEN
 *         SELECT stock_quantity INTO v_current_stock
 *         FROM product_options
 *         WHERE id = p_option_id
 *         FOR UPDATE;
 * 
 *         IF v_current_stock < p_quantity THEN
 *             RAISE EXCEPTION 'Insufficient stock for option %', p_option_id;
 *         END IF;
 * 
 *         UPDATE product_options
 *         SET stock_quantity = stock_quantity - p_quantity
 *         WHERE id = p_option_id;
 *     END IF;
 * END;
 * $$ LANGUAGE plpgsql;
 */

type CheckoutStep = 'shipping' | 'payment' | 'confirmation';

export const Checkout: React.FC<{ lang: 'KOR' | 'ENG' }> = ({ lang }) => {
  const { cartItems, totalAmount, totalAmountUsd, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [shippingData, setShippingData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: lang === 'KOR' ? 'South Korea' : '',
    postalCode: '',
    notes: ''
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setShippingData(prev => ({
          ...prev,
          email: user.email || '',
          name: user.user_metadata?.full_name || ''
        }));
      }
    });

    if (cartItems.length === 0 && step !== 'confirmation') {
      navigate('/cart');
    }
  }, [cartItems.length, navigate, step]);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
    window.scrollTo(0, 0);
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // 1. Create Order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id || null,
          total_amount: totalAmount,
          total_amount_usd: totalAmountUsd,
          status: 'pending',
          shipping_address: `${shippingData.address}, ${shippingData.city}, ${shippingData.country} (${shippingData.postalCode})`,
          shipping_name: shippingData.name,
          shipping_email: shippingData.email,
          shipping_phone: shippingData.phone,
          payment_method: lang === 'KOR' ? 'toss' : 'stripe'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create Order Items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        option_id: item.option_id,
        quantity: item.quantity,
        price: item.product?.price || 0,
        price_usd: item.product?.price_usd || 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Decrement Stock using RPC (Handles race conditions)
      for (const item of cartItems) {
        const { error: stockError } = await supabase.rpc('decrement_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
          p_option_id: item.option_id
        });
        if (stockError) throw stockError;
      }

      // 4. Simulate Payment (In real app, call Toss/Stripe SDK here)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 5. Update Order Status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // 6. Success
      clearCart();
      setStep('confirmation');
      toast.success(lang === 'KOR' ? '주문이 완료되었습니다!' : 'Order completed successfully!');
      window.scrollTo(0, 0);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirmation') {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-primary flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="container mx-auto px-6 text-center max-w-2xl"
        >
          <div className="w-24 h-24 bg-accent-teal/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-12 h-12 text-accent-teal" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            {lang === 'KOR' ? '주문이 완료되었습니다!' : 'Thank You for Your Order!'}
          </h1>
          <p className="text-gray-400 text-lg mb-12 leading-relaxed">
            {lang === 'KOR' 
              ? '주문 내역은 이메일로 발송되었으며, 마이페이지에서도 확인하실 수 있습니다. 도깨비몰을 이용해 주셔서 감사합니다.' 
              : 'Your order details have been sent to your email and can also be viewed in your account. Thank you for shopping with DOKB Mall.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/mypage/orders" 
              className="bg-white/10 text-white px-10 py-4 rounded-full font-bold hover:bg-white/20 transition-all"
            >
              {lang === 'KOR' ? '주문 내역 보기' : 'View Order History'}
            </Link>
            <Link 
              to="/" 
              className="bg-accent-gold text-primary px-10 py-4 rounded-full font-bold hover:brightness-110 transition-all"
            >
              {lang === 'KOR' ? '홈으로 돌아가기' : 'Back to Home'}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-primary">
      <div className="container mx-auto px-6">
        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-white/10 -z-10" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-accent-teal transition-all duration-500 -z-10" 
              style={{ width: step === 'payment' ? '100%' : '50%' }}
            />
            
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                step === 'shipping' ? "bg-accent-teal text-white scale-110" : "bg-accent-teal text-white"
              )}>
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-teal">{lang === 'KOR' ? '배송 정보' : 'Shipping'}</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                step === 'payment' ? "bg-accent-teal text-white scale-110" : "bg-white/10 text-gray-500"
              )}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                step === 'payment' ? "text-accent-teal" : "text-gray-500"
              )}>{lang === 'KOR' ? '결제' : 'Payment'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {step === 'shipping' ? (
                <motion.div 
                  key="shipping"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 lg:p-10">
                    <h2 className="text-2xl font-serif font-bold text-white mb-8 flex items-center gap-3">
                      <MapPin className="w-6 h-6 text-accent-teal" />
                      {lang === 'KOR' ? '배송지 정보' : 'Shipping Address'}
                    </h2>
                    
                    <form id="shipping-form" onSubmit={handleShippingSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '이름' : 'Full Name'}</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                              required
                              type="text" 
                              value={shippingData.name}
                              onChange={e => setShippingData({...shippingData, name: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-accent-teal transition-all text-white" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '이메일' : 'Email'}</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                              required
                              type="email" 
                              value={shippingData.email}
                              onChange={e => setShippingData({...shippingData, email: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-accent-teal transition-all text-white" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '연락처' : 'Phone'}</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                              required
                              type="tel" 
                              value={shippingData.phone}
                              onChange={e => setShippingData({...shippingData, phone: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-accent-teal transition-all text-white" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '국가' : 'Country'}</label>
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                              required
                              type="text" 
                              value={shippingData.country}
                              onChange={e => setShippingData({...shippingData, country: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-accent-teal transition-all text-white" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '주소' : 'Address'}</label>
                        <input 
                          required
                          type="text" 
                          value={shippingData.address}
                          onChange={e => setShippingData({...shippingData, address: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-accent-teal transition-all text-white" 
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '도시' : 'City'}</label>
                          <input 
                            required
                            type="text" 
                            value={shippingData.city}
                            onChange={e => setShippingData({...shippingData, city: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-accent-teal transition-all text-white" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '우편번호' : 'Postal Code'}</label>
                          <input 
                            required
                            type="text" 
                            value={shippingData.postalCode}
                            onChange={e => setShippingData({...shippingData, postalCode: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-accent-teal transition-all text-white" 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '배송 메모 (선택)' : 'Shipping Notes (Optional)'}</label>
                        <textarea 
                          rows={3}
                          value={shippingData.notes}
                          onChange={e => setShippingData({...shippingData, notes: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-accent-teal transition-all text-white resize-none" 
                        />
                      </div>
                    </form>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 lg:p-10">
                    <h2 className="text-2xl font-serif font-bold text-white mb-8 flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-accent-teal" />
                      {lang === 'KOR' ? '결제 수단' : 'Payment Method'}
                    </h2>

                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-accent-teal/10 border border-accent-teal/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2">
                            {lang === 'KOR' ? (
                              <img src="https://static.toss.im/assets/homepage/brand/logo-toss-blue.png" alt="Toss" className="w-full" />
                            ) : (
                              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="w-full" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{lang === 'KOR' ? '토스페이먼츠' : 'Stripe Payments'}</p>
                            <p className="text-xs text-gray-400">{lang === 'KOR' ? '신용카드, 계좌이체, 간편결제' : 'Credit Card, Apple Pay, Google Pay'}</p>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-accent-teal flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">{lang === 'KOR' ? '배송 정보 확인' : 'Confirm Shipping'}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">{lang === 'KOR' ? '수령인' : 'Recipient'}</p>
                            <p className="text-gray-300">{shippingData.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">{lang === 'KOR' ? '연락처' : 'Phone'}</p>
                            <p className="text-gray-300">{shippingData.phone}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500 mb-1">{lang === 'KOR' ? '배송지' : 'Address'}</p>
                            <p className="text-gray-300">{shippingData.address}, {shippingData.city}, {shippingData.country}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setStep('shipping')}
                          className="text-xs text-accent-teal font-bold hover:underline"
                        >
                          {lang === 'KOR' ? '배송 정보 수정하기' : 'Edit Shipping Info'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 sticky top-32">
              <h2 className="text-2xl font-serif font-bold text-white mb-8">
                {lang === 'KOR' ? '주문 내역' : 'Order Summary'}
              </h2>
              
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={item.product?.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white line-clamp-1">
                        {lang === 'KOR' ? item.product?.name_ko : item.product?.name_en}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-serif font-bold text-accent-gold">
                        {lang === 'KOR' ? formatPrice((item.product?.price || 0) * item.quantity, 'KRW') : formatPrice((item.product?.price_usd || 0) * item.quantity, 'USD')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-8 pt-6 border-t border-white/10">
                <div className="flex justify-between text-gray-400">
                  <span>{lang === 'KOR' ? '상품 금액' : 'Subtotal'}</span>
                  <span>{lang === 'KOR' ? formatPrice(totalAmount, 'KRW') : formatPrice(totalAmountUsd, 'USD')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>{lang === 'KOR' ? '배송비' : 'Shipping'}</span>
                  <span className="text-accent-teal font-bold">{lang === 'KOR' ? '무료' : 'FREE'}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-lg font-bold text-white">{lang === 'KOR' ? '총 결제 금액' : 'Total'}</span>
                  <span className="text-3xl font-serif font-bold text-accent-gold">
                    {lang === 'KOR' ? formatPrice(totalAmount, 'KRW') : formatPrice(totalAmountUsd, 'USD')}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {step === 'shipping' ? (
                  <button 
                    form="shipping-form"
                    type="submit"
                    className="w-full bg-accent-gold text-primary py-5 rounded-2xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/20"
                  >
                    {lang === 'KOR' ? '결제 단계로' : 'Continue to Payment'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-accent-teal text-white py-5 rounded-2xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-teal/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {lang === 'KOR' ? '결제하기' : 'Pay Now'}
                        <ShieldCheck className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
                
                <button 
                  onClick={() => step === 'shipping' ? navigate('/cart') : setStep('shipping')}
                  className="w-full text-sm text-gray-500 font-bold hover:text-white transition-colors py-2"
                >
                  {lang === 'KOR' ? '뒤로 가기' : 'Go Back'}
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-3 text-gray-500">
                  <ShieldCheck className="w-5 h-5 text-accent-teal" />
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                    {lang === 'KOR' ? '보안 결제 시스템 적용' : 'Secure Encrypted Payment'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
