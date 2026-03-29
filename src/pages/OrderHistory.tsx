import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Package, ChevronRight, ShoppingBag, ArrowRight, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice, cn } from '../lib/utils';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product: {
    name_ko: string;
    name_en: string;
    thumbnail: string;
  };
  quantity: number;
  price: number;
  price_usd: number;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  total_amount_usd: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  order_items: OrderItem[];
}

export const OrderHistory: React.FC<{ lang: 'KOR' | 'ENG' | 'CHI' }> = ({ lang }) => {
  const { dbUserId } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!dbUserId) {
        // If not logged in, or dbUserId not yet available
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error(lang === 'KOR' ? '로그인이 필요합니다.' : lang === 'ENG' ? 'Login required.' : '需要登录。');
          navigate('/');
          return;
        }
        // If user exists but dbUserId is not yet in context, we wait or set loading false
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
          )
        `)
        .eq('user_id', dbUserId)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error(error.message);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [lang, navigate, dbUserId]);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-accent-gold" />;
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-accent-teal" />;
      case 'shipped': return <Truck className="w-4 h-4 text-accent-teal" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4 text-accent-teal" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-highlight-red" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    const labels = {
      pending: lang === 'KOR' ? '결제 대기' : lang === 'ENG' ? 'Pending' : '待支付',
      paid: lang === 'KOR' ? '결제 완료' : lang === 'ENG' ? 'Paid' : '已支付',
      shipped: lang === 'KOR' ? '배송 중' : lang === 'ENG' ? 'Shipped' : '已发货',
      delivered: lang === 'KOR' ? '배송 완료' : lang === 'ENG' ? 'Delivered' : '已送达',
      cancelled: lang === 'KOR' ? '주문 취소' : lang === 'ENG' ? 'Cancelled' : '已取消'
    };
    return labels[status];
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-teal" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-primary">
        <div className="container mx-auto px-6 text-center py-40">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <Package className="w-12 h-12 text-gray-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-4">
            {lang === 'KOR' ? '주문 내역이 없습니다' : lang === 'ENG' ? 'No order history' : '暂无订单历史'}
          </h1>
          <p className="text-gray-500 mb-12 max-w-md mx-auto">
            {lang === 'KOR' ? '도깨비몰의 마법 같은 상품들을 만나보세요!' : lang === 'ENG' ? 'Meet the magical products of DOKB Mall!' : '遇见 DOKB Mall 的神奇产品！'}
          </p>
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 bg-accent-gold text-primary px-10 py-4 rounded-full font-bold hover:brightness-110 transition-all"
          >
            {lang === 'KOR' ? '상품 보러 가기' : lang === 'ENG' ? 'View Products' : '查看产品'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-primary">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-12">
            {lang === 'KOR' ? '주문 내역' : lang === 'ENG' ? 'Order History' : '订单历史'}
          </h1>

          <div className="space-y-8">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-white/5 p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{lang === 'KOR' ? '주문 날짜' : lang === 'ENG' ? 'Order Date' : '订单日期'}</p>
                      <p className="text-sm font-bold text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{lang === 'KOR' ? '주문 번호' : lang === 'ENG' ? 'Order ID' : '订单 ID'}</p>
                      <p className="text-sm font-bold text-white uppercase">{order.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    {getStatusIcon(order.status)}
                    <span className="text-xs font-bold text-white">{getStatusLabel(order.status)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6 space-y-6">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex gap-6 items-center">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0">
                        <img 
                          src={(item.product?.thumbnail && item.product.thumbnail.trim() !== "") ? item.product.thumbnail : 'https://picsum.photos/seed/product/200/200'} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white line-clamp-1">
                          {lang === 'KOR' ? item.product?.name_ko : item.product?.name_en}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                        <p className="text-sm font-serif font-bold text-accent-gold mt-1">
                          {lang === 'KOR' ? formatPrice(item.price * item.quantity, 'KRW') : formatPrice(item.price_usd * item.quantity, 'USD')}
                        </p>
                      </div>
                      <Link 
                        to={`/products/${item.product_id}`}
                        className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-accent-teal hover:bg-white/10 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="p-6 bg-white/5 border-t border-white/10 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-400">{lang === 'KOR' ? '총 결제 금액' : lang === 'ENG' ? 'Total Amount' : '总金额'}</span>
                  <span className="text-2xl font-serif font-bold text-accent-gold">
                    {lang === 'KOR' ? formatPrice(order.total_amount, 'KRW') : formatPrice(order.total_amount_usd, 'USD')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
