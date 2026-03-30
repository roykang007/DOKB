import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ArrowRight, Truck, CreditCard, ShieldCheck, CheckCircle2, Info, MapPin, User, Mail, Phone, Globe, Eye, ShoppingBag } from 'lucide-react';
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

type CheckoutStep = 'shipping' | 'review' | 'payment' | 'confirmation';

export const Checkout: React.FC<{ lang: 'KOR' | 'ENG' | 'CHI' }> = ({ lang }) => {
  const { cartItems, totalAmount, totalAmountUsd, clearCart, loading: cartLoading } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const totalShippingFee = cartItems.reduce((acc, item) => acc + (item.product?.shipping_fee || 0), 0);
  const totalShippingFeeUsd = totalShippingFee / 1300;
  
  const [shippingData, setShippingData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    addressDetail: '',
    city: '',
    country: lang === 'KOR' ? 'South Korea' : lang === 'ENG' ? 'USA' : 'China',
    postalCode: '',
    notes: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Fetch saved shipping info from 'users' table
        try {
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', user.id)
            .maybeSingle();

          if (profile && !error) {
            setShippingData(prev => {
              const displayName = profile.name_ko || profile.shipping_name || profile.name_en || profile.name_zh || user.user_metadata?.full_name || prev.name || '';
              return {
                ...prev,
                email: user.email || '',
                name: displayName,
                phone: profile.shipping_phone || profile.phone || prev.phone || '',
                address: profile.shipping_address || prev.address || '',
                addressDetail: profile.shipping_address_detail || prev.addressDetail || '',
                city: profile.shipping_city || prev.city || '',
                country: profile.shipping_country || prev.country,
                postalCode: profile.shipping_zipcode || prev.postalCode || ''
              };
            });
          } else {
            setShippingData(prev => ({
              ...prev,
              email: user.email || '',
              name: user.user_metadata?.full_name || prev.name || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!cartLoading && cartItems.length === 0 && step !== 'confirmation') {
      navigate('/cart');
    }
  }, [cartItems.length, cartLoading, navigate, step]);

  if (cartLoading && step !== 'confirmation') {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-teal" />
      </div>
    );
  }

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('review');
    window.scrollTo(0, 0);
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // 1. Create Order in Supabase (Directly as 'paid' for test version)
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          user_id: user?.id || null,
          guest_email: shippingData.email,
          total_amount: totalAmount + totalShippingFee,
          total_amount_usd: totalAmountUsd + totalShippingFeeUsd,
          shipping_fee: totalShippingFee,
          currency: lang === 'KOR' ? 'KRW' : lang === 'ENG' ? 'USD' : 'USD',
          status: 'paid', // Test version: Directly set to paid
          shipping_address: `${shippingData.address}${shippingData.addressDetail ? ' ' + shippingData.addressDetail : ''}${shippingData.city ? ', ' + shippingData.city : ''}`,
          shipping_address1: shippingData.address,
          shipping_address2: shippingData.addressDetail || null,
          shipping_zipcode: shippingData.postalCode,
          shipping_country: shippingData.country,
          shipping_name: shippingData.name,
          shipping_phone: shippingData.phone,
          payment_method: 'test' // Use 'test' for test orders
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Order Creation Error:', orderError);
        throw orderError;
      }
      if (!order) throw new Error(lang === 'KOR' ? '주문 생성에 실패했습니다.' : lang === 'ENG' ? 'Failed to create order.' : '创建订单失败。');

      // 2. Create Order Items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        option_id: item.option_id,
        product_name_ko: item.product?.name_ko || '',
        product_name_en: item.product?.name_en || '',
        unit_price: lang === 'KOR' ? (item.product?.price || 0) : (item.product?.price_usd || 0),
        quantity: item.quantity,
        subtotal: (lang === 'KOR' ? (item.product?.price || 0) : (item.product?.price_usd || 0)) * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order Items Error:', itemsError);
        throw itemsError;
      }

      // 3. Decrement Stock using RPC (Handles race conditions)
      for (const item of cartItems) {
        try {
          const { error: stockError } = await supabase.rpc('decrement_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
            p_option_id: item.option_id
          });
          if (stockError) {
            console.warn('Stock decrement failed for item:', item.product_id, stockError);
          }
        } catch (e) {
          console.warn('RPC call failed:', e);
        }
      }

      // 4. Simulate a very brief processing for UX
      await new Promise(resolve => setTimeout(resolve, 300));

      // 5. Update User's Default Shipping Info for next time
      if (user) {
        try {
          await supabase
            .from('users')
            .update({
              shipping_name: shippingData.name,
              shipping_phone: shippingData.phone,
              shipping_address: shippingData.address,
              shipping_address_detail: shippingData.addressDetail,
              shipping_city: shippingData.city,
              shipping_country: shippingData.country,
              shipping_zipcode: shippingData.postalCode
            })
            .eq('auth_id', user.id);
        } catch (err) {
          console.warn('Failed to update user shipping info:', err);
        }
      }

      // 6. Success
      clearCart();
      setStep('confirmation');
      toast.success(lang === 'KOR' ? '주문이 완료되었습니다! (테스트 결제 완료)' : lang === 'ENG' ? 'Order completed successfully! (Test Payment Successful)' : '订单已完成！（测试支付成功）');
      window.scrollTo(0, 0);

    } catch (error: any) {
      console.error('Checkout Error:', error);
      toast.error(error.message || (lang === 'KOR' ? '주문 처리 중 오류가 발생했습니다.' : lang === 'ENG' ? 'An error occurred during checkout.' : '结账过程中发生错误。'));
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
            {lang === 'KOR' ? '주문이 완료되었습니다!' : lang === 'ENG' ? 'Thank You for Your Order!' : '感谢您的订单！'}
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
              {lang === 'KOR' ? '주문 내역 보기' : lang === 'ENG' ? 'View Order History' : '查看订单历史'}
            </Link>
            <Link 
              to="/" 
              className="bg-accent-gold text-primary px-10 py-4 rounded-full font-bold hover:brightness-110 transition-all"
            >
              {lang === 'KOR' ? '홈으로 돌아가기' : lang === 'ENG' ? 'Back to Home' : '返回首页'}
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
              style={{ 
                width: step === 'confirmation' ? '100%' : 
                       step === 'payment' ? '75%' : 
                       step === 'review' ? '50%' : '25%' 
              }}
            />
            
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                step === 'shipping' ? "bg-accent-teal text-white scale-110" : "bg-accent-teal text-white"
              )}>
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-teal">{lang === 'KOR' ? '배송 정보' : lang === 'ENG' ? 'Shipping' : '配送'}</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                step === 'review' ? "bg-accent-teal text-white scale-110" : 
                (step === 'payment' || step === 'confirmation') ? "bg-accent-teal text-white" : "bg-white/10 text-gray-500"
              )}>
                <Eye className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                (step === 'review' || step === 'payment' || step === 'confirmation') ? "text-accent-teal" : "text-gray-500"
              )}>{lang === 'KOR' ? '주문 확인' : lang === 'ENG' ? 'Review' : '预览'}</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                step === 'payment' ? "bg-accent-teal text-white scale-110" : 
                step === 'confirmation' ? "bg-accent-teal text-white" : "bg-white/10 text-gray-500"
              )}>
                <CreditCard className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                (step === 'payment' || step === 'confirmation') ? "text-accent-teal" : "text-gray-500"
              )}>{lang === 'KOR' ? '결제' : lang === 'ENG' ? 'Payment' : '支付'}</span>
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
                      {lang === 'KOR' ? '배송지 정보' : lang === 'ENG' ? 'Shipping Address' : '配送地址'}
                    </h2>
                    
                    <form id="shipping-form" onSubmit={handleShippingSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '수령인 이름' : lang === 'ENG' ? 'Recipient Name' : '收件人姓名'}</label>
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
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '이메일' : lang === 'ENG' ? 'Email' : '电子邮件'}</label>
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
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '연락처' : lang === 'ENG' ? 'Phone' : '电话'}</label>
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
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '국가' : lang === 'ENG' ? 'Country' : '国家'}</label>
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
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '주소' : lang === 'ENG' ? 'Address' : '地址'}</label>
                        <input 
                          required
                          type="text" 
                          placeholder={lang === 'KOR' ? '기본 주소' : 'Street Address'}
                          value={shippingData.address}
                          onChange={e => setShippingData({...shippingData, address: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-accent-teal transition-all text-white" 
                        />
                        <input 
                          type="text" 
                          placeholder={lang === 'KOR' ? '상세 주소 (동, 호수 등)' : 'Detailed Address (Apt, Suite, etc.)'}
                          value={shippingData.addressDetail}
                          onChange={e => setShippingData({...shippingData, addressDetail: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-accent-teal transition-all text-white mt-2" 
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '도시' : lang === 'ENG' ? 'City' : '城市'}</label>
                          <input 
                            type="text" 
                            value={shippingData.city}
                            onChange={e => setShippingData({...shippingData, city: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-accent-teal transition-all text-white" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '우편번호' : lang === 'ENG' ? 'Postal Code' : '邮政编码'}</label>
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
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">{lang === 'KOR' ? '배송 메모 (선택)' : lang === 'ENG' ? 'Shipping Notes (Optional)' : '配送备注（可选）'}</label>
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
              ) : step === 'review' ? (
                <motion.div 
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 lg:p-10">
                    <h2 className="text-2xl font-serif font-bold text-white mb-8 flex items-center gap-3">
                      <Eye className="w-6 h-6 text-accent-teal" />
                      {lang === 'KOR' ? '주문 내용 확인' : lang === 'ENG' ? 'Review Your Order' : '确认您的订单'}
                    </h2>

                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Truck className="w-4 h-4 text-accent-teal" />
                            {lang === 'KOR' ? '배송지 정보' : lang === 'ENG' ? 'Shipping Info' : '配送信息'}
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="text-gray-500">{lang === 'KOR' ? '수령인' : lang === 'ENG' ? 'Recipient' : '收件人'}</p>
                              <p className="text-white font-bold text-lg">{shippingData.name}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">{lang === 'KOR' ? '연락처' : lang === 'ENG' ? 'Phone' : '电话'}</p>
                              <p className="text-white font-medium">{shippingData.phone}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">{lang === 'KOR' ? '주소' : lang === 'ENG' ? 'Address' : '地址'}</p>
                              <p className="text-white font-medium">
                                {shippingData.address}
                                {shippingData.addressDetail ? ` ${shippingData.addressDetail}` : ''}
                                {shippingData.city ? `, ${shippingData.city}` : ''}
                                {!['South Korea', 'Korea', '대한민국', '한국'].includes(shippingData.country) && `, ${shippingData.country}`}
                                {` (${shippingData.postalCode})`}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-accent-teal" />
                            {lang === 'KOR' ? '주문 요약' : lang === 'ENG' ? 'Order Summary' : '订单摘要'}
                          </h3>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <p className="text-gray-500">{lang === 'KOR' ? '총 상품 수' : lang === 'ENG' ? 'Total Items' : '商品总数'}</p>
                              <p className="text-white font-medium">{cartItems.length}</p>
                            </div>
                            <div className="flex justify-between">
                              <p className="text-gray-500">{lang === 'KOR' ? '총 결제 금액' : lang === 'ENG' ? 'Total Amount' : '总金额'}</p>
                              <p className="text-accent-gold font-bold text-lg">
                                {lang === 'KOR' ? formatPrice(totalAmount, 'KRW') : formatPrice(totalAmountUsd, 'USD')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">{lang === 'KOR' ? '주문 상품' : lang === 'ENG' ? 'Order Items' : '订单商品'}</h3>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                          {cartItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5">
                                  <img src={item.product?.thumbnail} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="text-white text-sm font-medium">{lang === 'KOR' ? item.product?.name_ko : item.product?.name_en}</p>
                                  <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <p className="text-white text-sm">
                                {lang === 'KOR' ? formatPrice((item.product?.price || 0) * item.quantity, 'KRW') : formatPrice((item.product?.price_usd || 0) * item.quantity, 'USD')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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
                      {lang === 'KOR' ? '결제 수단 (테스트 모드)' : lang === 'ENG' ? 'Payment Method (Test Mode)' : '支付方式（测试模式）'}
                    </h2>

                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-accent-teal/10 border border-accent-teal/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2">
                            <CreditCard className="w-8 h-8 text-accent-teal" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{lang === 'KOR' ? '테스트 결제' : lang === 'ENG' ? 'Test Payment' : '测试支付'}</p>
                            <p className="text-xs text-gray-400">{lang === 'KOR' ? '실제 결제가 발생하지 않는 테스트 모드입니다.' : lang === 'ENG' ? 'This is a test mode. No real payment will be processed.' : '这是测试模式。不会处理实际支付。'}</p>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-accent-teal flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
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
                {lang === 'KOR' ? '주문 내역' : lang === 'ENG' ? 'Order Summary' : '订单摘要'}
              </h2>
              
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                      <img 
                        src={(item.product?.thumbnail && item.product.thumbnail.trim() !== "") ? item.product.thumbnail : 'https://picsum.photos/seed/product/200/200'} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
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
                  <span>{lang === 'KOR' ? '상품 금액' : lang === 'ENG' ? 'Subtotal' : '小计'}</span>
                  <span>{lang === 'KOR' ? formatPrice(totalAmount, 'KRW') : formatPrice(totalAmountUsd, 'USD')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>{lang === 'KOR' ? '배송비' : lang === 'ENG' ? 'Shipping' : '运费'}</span>
                  <span className={cn("font-bold", totalShippingFee === 0 ? "text-accent-teal" : "text-white")}>
                    {totalShippingFee === 0 
                      ? (lang === 'KOR' ? '무료' : lang === 'ENG' ? 'FREE' : '免费') 
                      : (lang === 'KOR' ? formatPrice(totalShippingFee, 'KRW') : formatPrice(totalShippingFeeUsd, 'USD'))
                    }
                  </span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-lg font-bold text-white">{lang === 'KOR' ? '총 결제 금액' : lang === 'ENG' ? 'Total' : '总计'}</span>
                  <span className="text-3xl font-serif font-bold text-accent-gold">
                    {lang === 'KOR' ? formatPrice(totalAmount + totalShippingFee, 'KRW') : formatPrice(totalAmountUsd + totalShippingFeeUsd, 'USD')}
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
                    {lang === 'KOR' ? '주문 내용 확인' : lang === 'ENG' ? 'Review Order' : '确认订单'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : step === 'review' ? (
                  <button 
                    onClick={() => setStep('payment')}
                    className="w-full bg-accent-gold text-primary py-5 rounded-2xl font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/20"
                  >
                    {lang === 'KOR' ? '결제 단계로' : lang === 'ENG' ? 'Continue to Payment' : '继续支付'}
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
                        {lang === 'KOR' ? '결제하기' : lang === 'ENG' ? 'Pay Now' : '立即支付'}
                        <ShieldCheck className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
                
                <button 
                  onClick={() => {
                    if (step === 'shipping') navigate('/cart');
                    else if (step === 'review') setStep('shipping');
                    else if (step === 'payment') setStep('review');
                  }}
                  className="w-full text-sm text-gray-500 font-bold hover:text-white transition-colors py-2"
                >
                  {lang === 'KOR' ? '뒤로 가기' : lang === 'ENG' ? 'Go Back' : '返回'}
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-3 text-gray-500">
                  <ShieldCheck className="w-5 h-5 text-accent-teal" />
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-tight">
                    {lang === 'KOR' ? '보안 결제 시스템 적용' : lang === 'ENG' ? 'Secure Encrypted Payment' : '安全加密支付'}
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
