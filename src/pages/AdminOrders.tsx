import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  Search, 
  Filter, 
  MoreVertical, 
  Users,
  User,
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Truck,
  ChevronRight,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ArrowRight,
  Loader2,
  Calendar
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface OrderItem {
  id: string;
  product_id: string;
  option_id: string | null;
  product_name_ko: string;
  product_name_en: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  product?: {
    thumbnail: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  total_amount: number;
  total_amount_usd: number;
  shipping_fee: number;
  currency: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  shipping_zipcode: string;
  shipping_country: string;
  shipping_name: string;
  shipping_phone: string;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
  user?: {
    email: string;
    name_ko: string;
  };
}

export const AdminOrders: React.FC<{ lang: 'KOR' | 'ENG' | 'CHI' }> = ({ lang }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (thumbnail)
          ),
          user:users (email, name_ko)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      toast.success(lang === 'KOR' ? '주문 상태가 변경되었습니다.' : 'Order status updated.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipping_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.guest_email || order.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.total_amount, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-6">
        {/* Admin Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-accent-teal mb-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{lang === 'KOR' ? '관리자 대시보드' : 'Admin Dashboard'}</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-primary">
              {lang === 'KOR' ? '주문 관리' : lang === 'ENG' ? 'Order Management' : '订单管理'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/admin/products" className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-primary font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
              <Package className="w-4 h-4" />
              {lang === 'KOR' ? '상품 관리' : 'Products'}
            </Link>
            <Link to="/admin/users" className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-primary font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
              <Users className="w-4 h-4" />
              {lang === 'KOR' ? '회원 관리' : 'Users'}
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: lang === 'KOR' ? '전체 주문' : 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'text-primary' },
            { label: lang === 'KOR' ? '결제 완료' : 'Paid', value: stats.paid, icon: CheckCircle2, color: 'text-accent-teal' },
            { label: lang === 'KOR' ? '배송 중' : 'Shipped', value: stats.shipped, icon: Truck, color: 'text-accent-teal' },
            { label: lang === 'KOR' ? '총 매출' : 'Total Revenue', value: formatPrice(stats.revenue, 'KRW'), icon: CreditCard, color: 'text-accent-gold' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-serif font-bold text-primary">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-8 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder={lang === 'KOR' ? '주문번호, 주문자명, 이메일 검색...' : 'Search by order #, name, email...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold text-primary"
              >
                <option value="all">{lang === 'KOR' ? '모든 상태' : 'All Status'}</option>
                <option value="pending">{lang === 'KOR' ? '결제 대기' : 'Pending'}</option>
                <option value="paid">{lang === 'KOR' ? '결제 완료' : 'Paid'}</option>
                <option value="shipped">{lang === 'KOR' ? '배송 중' : 'Shipped'}</option>
                <option value="delivered">{lang === 'KOR' ? '배송 완료' : 'Delivered'}</option>
                <option value="cancelled">{lang === 'KOR' ? '주문 취소' : 'Cancelled'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '주문 정보' : 'Order Info'}</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '주문자' : 'Customer'}</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '결제 금액' : 'Amount'}</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '상태' : 'Status'}</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">{lang === 'KOR' ? '관리' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent-teal mb-4" />
                      <p className="text-sm text-gray-400 font-bold">{lang === 'KOR' ? '주문 정보를 불러오는 중...' : 'Loading orders...'}</p>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <ShoppingBag className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                      <p className="text-sm text-gray-400 font-bold">{lang === 'KOR' ? '주문 내역이 없습니다.' : 'No orders found.'}</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary mb-1">{order.order_number}</span>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary mb-1">{order.shipping_name}</span>
                          <span className="text-xs text-gray-400">{order.guest_email || order.user?.email}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary mb-1">
                            {lang === 'KOR' ? formatPrice(order.total_amount, 'KRW') : formatPrice(order.total_amount_usd, 'USD')}
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest">{order.payment_method}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          order.status === 'paid' ? "bg-accent-teal/10 text-accent-teal" :
                          order.status === 'shipped' ? "bg-blue-500/10 text-blue-500" :
                          order.status === 'delivered' ? "bg-green-500/10 text-green-500" :
                          order.status === 'cancelled' ? "bg-highlight-red/10 text-highlight-red" :
                          "bg-accent-gold/10 text-accent-gold"
                        )}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsModalOpen(true);
                          }}
                          className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Detail Modal */}
        <AnimatePresence>
          {isModalOpen && selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-primary/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 lg:p-10 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-serif font-bold text-primary">
                        {selectedOrder.order_number}
                      </h2>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        selectedOrder.status === 'paid' ? "bg-accent-teal/10 text-accent-teal" :
                        selectedOrder.status === 'shipped' ? "bg-blue-500/10 text-blue-500" :
                        selectedOrder.status === 'delivered' ? "bg-green-500/10 text-green-500" :
                        selectedOrder.status === 'cancelled' ? "bg-highlight-red/10 text-highlight-red" :
                        "bg-accent-gold/10 text-accent-gold"
                      )}>
                        {getStatusLabel(selectedOrder.status)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left: Order Items */}
                    <div className="lg:col-span-2 space-y-8">
                      <section>
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-accent-teal" />
                          {lang === 'KOR' ? '주문 상품' : 'Order Items'}
                        </h3>
                        <div className="space-y-4">
                          {selectedOrder.order_items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                                <img src={item.product?.thumbnail || 'https://picsum.photos/seed/product/200/200'} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-primary truncate">
                                  {lang === 'KOR' ? item.product_name_ko : item.product_name_en}
                                </h4>
                                <p className="text-xs text-gray-400">
                                  {lang === 'KOR' ? formatPrice(item.unit_price, 'KRW') : formatPrice(item.unit_price, 'USD')} x {item.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-primary">
                                  {lang === 'KOR' ? formatPrice(item.subtotal, 'KRW') : formatPrice(item.subtotal, 'USD')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{lang === 'KOR' ? '상품 합계' : 'Subtotal'}</span>
                            <span className="font-bold text-primary">
                              {lang === 'KOR' ? formatPrice(selectedOrder.total_amount - selectedOrder.shipping_fee, 'KRW') : formatPrice(selectedOrder.total_amount_usd - (selectedOrder.shipping_fee / 1300), 'USD')}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{lang === 'KOR' ? '배송비' : 'Shipping'}</span>
                            <span className="font-bold text-primary">
                              {lang === 'KOR' ? formatPrice(selectedOrder.shipping_fee, 'KRW') : formatPrice(selectedOrder.shipping_fee / 1300, 'USD')}
                            </span>
                          </div>
                          <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-lg font-serif font-bold text-primary">{lang === 'KOR' ? '총 결제 금액' : 'Total Amount'}</span>
                            <span className="text-2xl font-serif font-bold text-accent-gold">
                              {lang === 'KOR' ? formatPrice(selectedOrder.total_amount, 'KRW') : formatPrice(selectedOrder.total_amount_usd, 'USD')}
                            </span>
                          </div>
                        </div>
                      </section>
                    </div>

                    {/* Right: Shipping & Status */}
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-accent-teal" />
                          {lang === 'KOR' ? '배송 정보' : 'Shipping Info'}
                        </h3>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                          <div className="flex items-start gap-3">
                            <User className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'KOR' ? '수령인' : 'Recipient'}</p>
                              <p className="text-sm font-bold text-primary">{selectedOrder.shipping_name}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'KOR' ? '연락처' : 'Phone'}</p>
                              <p className="text-sm font-bold text-primary">{selectedOrder.shipping_phone}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'KOR' ? '배송지' : 'Address'}</p>
                              <p className="text-sm font-bold text-primary leading-relaxed">
                                {selectedOrder.shipping_address}<br />
                                {selectedOrder.shipping_zipcode}
                                {!['South Korea', 'Korea', '대한민국', '한국'].includes(selectedOrder.shipping_country) && `, ${selectedOrder.shipping_country}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-accent-teal" />
                          {lang === 'KOR' ? '상태 변경' : 'Update Status'}
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: 'paid', label: lang === 'KOR' ? '결제 완료' : 'Paid', icon: CheckCircle2, color: 'hover:bg-accent-teal hover:text-white' },
                            { id: 'shipped', label: lang === 'KOR' ? '배송 중' : 'Shipped', icon: Truck, color: 'hover:bg-blue-500 hover:text-white' },
                            { id: 'delivered', label: lang === 'KOR' ? '배송 완료' : 'Delivered', icon: CheckCircle2, color: 'hover:bg-green-500 hover:text-white' },
                            { id: 'cancelled', label: lang === 'KOR' ? '주문 취소' : 'Cancelled', icon: XCircle, color: 'hover:bg-highlight-red hover:text-white' }
                          ].map((status) => (
                            <button 
                              key={status.id}
                              disabled={updatingStatus || selectedOrder.status === status.id}
                              onClick={() => updateOrderStatus(selectedOrder.id, status.id as Order['status'])}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 text-sm font-bold transition-all disabled:opacity-50",
                                selectedOrder.status === status.id ? "bg-primary text-white border-primary" : `bg-white text-gray-500 ${status.color}`
                              )}
                            >
                              <status.icon className="w-4 h-4" />
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>

                <div className="p-8 lg:p-10 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                  >
                    {lang === 'KOR' ? '닫기' : 'Close'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
