import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Key, Home, Gem, Phone, Mail, ArrowRight, ShieldCheck, Handshake, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface VIPItem {
  id: string;
  category: string;
  title: { KOR: string; ENG: string; CHI: string };
  description: { KOR: string; ENG: string; CHI: string };
  price: string;
  images: string[];
}

interface VIPRoomProps {
  lang: 'KOR' | 'ENG' | 'CHI';
  onContactClick: () => void;
}

export const VIPRoom: React.FC<VIPRoomProps> = ({ lang, onContactClick }) => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [items, setItems] = useState<VIPItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VIPItem | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (isAuthorized) {
      fetchVIPItems();
    }
  }, [isAuthorized]);

  const fetchVIPItems = async () => {
    if (!isSupabaseConfigured) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vip_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedItems: VIPItem[] = (data || []).map((dbItem: any) => ({
        id: dbItem.id,
        category: dbItem.category,
        title: {
          KOR: dbItem.title_ko,
          ENG: dbItem.title_en,
          CHI: dbItem.title_zh
        },
        description: {
          KOR: dbItem.description_ko,
          ENG: dbItem.description_en,
          CHI: dbItem.description_zh
        },
        price: dbItem.price,
        images: dbItem.images
      }));

      setItems(mappedItems);
    } catch (error: any) {
      console.error('Error fetching VIP items:', error);
      toast.error('Failed to load VIP items');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '888888') {
      setIsAuthorized(true);
      toast.success(lang === 'KOR' ? 'VIP 룸에 입장하셨습니다.' : 'Welcome to the VIP Room.');
    } else {
      toast.error(lang === 'KOR' ? '비밀번호가 틀렸습니다.' : 'Incorrect password.');
    }
  };

  const openDetail = (item: VIPItem) => {
    setSelectedItem(item);
    setActiveImageIdx(0);
    document.body.style.overflow = 'hidden';
  };

  const closeDetail = () => {
    setSelectedItem(null);
    document.body.style.overflow = 'unset';
  };

  const t = {
    title: lang === 'KOR' ? 'VIP 전용 프라이빗 룸' : lang === 'ENG' ? 'VIP Private Room' : 'VIP 私人客房',
    subtitle: lang === 'KOR' ? '선택받은 소수만을 위한 특별한 비즈니스 파트너십' : lang === 'ENG' ? 'Exclusive business partnership for the selected few' : '为少数人提供的独家商业合作伙伴关系',
    passwordBtn: lang === 'KOR' ? 'PASSWORD 입력' : lang === 'ENG' ? 'Enter PASSWORD' : '输入密码',
    lockedMsg: lang === 'KOR' ? '이 구역은 승인된 VIP 회원만 접근 가능합니다.' : lang === 'ENG' ? 'This area is accessible only to authorized VIP members.' : '此区域仅限授权 VIP 会员访问。',
    contactAdmin: lang === 'KOR' ? '상세 정보 및 거래 문의는 관리자에게 연락 바랍니다.' : lang === 'ENG' ? 'Please contact the administrator for details and transactions.' : '详情及交易请联系管理员。',
    antiqueTab: lang === 'KOR' ? '골동품 & 예술품' : lang === 'ENG' ? 'Antiques & Arts' : '古董与艺术品',
    realEstateTab: lang === 'KOR' ? '프리미엄 부동산' : lang === 'ENG' ? 'Premium Real Estate' : '优质房地产',
    close: lang === 'KOR' ? '닫기' : lang === 'ENG' ? 'Close' : '关闭',
    inquiry: lang === 'KOR' ? '문의하기' : lang === 'ENG' ? 'Inquiry' : '咨询',
    estValue: lang === 'KOR' ? '추정 가치' : lang === 'ENG' ? 'Estimated Value' : '估计价值'
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen pt-32 pb-20 bg-[#050505] text-white flex flex-col items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl"
        >
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-full border border-accent-gold/30 flex items-center justify-center animate-pulse">
              <Lock className="w-10 h-10 text-accent-gold" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-accent-gold mb-6 tracking-tight">
            {t.title}
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-12 font-light leading-relaxed">
            {t.subtitle}
          </p>

          {!showPasswordInput ? (
            <button 
              onClick={() => setShowPasswordInput(true)}
              className="group relative px-12 py-5 bg-transparent border border-accent-gold text-accent-gold font-bold text-xl rounded-full overflow-hidden transition-all hover:bg-accent-gold hover:text-primary dokkaebi-glow"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Key className="w-6 h-6" />
                {t.passwordBtn}
              </span>
            </button>
          ) : (
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handlePasswordSubmit}
              className="flex flex-col items-center gap-4"
            >
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="bg-white/5 border border-white/20 rounded-2xl px-8 py-4 text-2xl text-center tracking-[1em] outline-none focus:border-accent-gold transition-all w-64"
                autoFocus
              />
              <button 
                type="submit"
                className="bg-accent-gold text-primary px-12 py-4 rounded-full font-bold text-lg hover:brightness-110 transition-all"
              >
                {lang === 'KOR' ? '입장하기' : 'Enter'}
              </button>
            </motion.form>
          )}
          
          <p className="mt-12 text-gray-500 text-sm italic">
            {t.lockedMsg}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 bg-[#050505] text-white">
      <div className="container mx-auto px-6">
        <header className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-accent-gold text-sm font-bold tracking-[0.3em] uppercase mb-4 block">
              DOKB Prestige
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">
              VIP <span className="text-accent-gold italic">Gallery</span>
            </h1>
            <div className="h-px w-24 bg-accent-gold mx-auto mb-8"></div>
            <p className="text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              {t.contactAdmin}
            </p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <Loader2 className="w-12 h-12 text-accent-gold animate-spin" />
            </div>
          ) : items.length > 0 ? (
            items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                onClick={() => openDetail(item)}
                className="group relative bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden hover:border-accent-gold/50 transition-all duration-500 cursor-pointer"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img 
                    src={item.images[0] || 'https://via.placeholder.com/800/600?text=No+Image'} 
                    alt={item.title[lang]} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 left-6">
                    <span className="bg-accent-gold text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                      {item.category === 'antique' ? t.antiqueTab : t.realEstateTab}
                    </span>
                  </div>
                </div>

                <div className="p-10">
                  <h3 className="text-3xl font-serif font-bold text-white mb-4 group-hover:text-accent-gold transition-colors">
                    {item.title[lang]}
                  </h3>
                  <p className="text-gray-400 font-light leading-relaxed mb-8">
                    {item.description[lang]}
                  </p>
                  
                  <div className="flex items-center justify-between pt-8 border-t border-white/10">
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">Estimated Value</span>
                      <span className="text-2xl font-serif font-bold text-accent-gold">{item.price}</span>
                    </div>
                    <button 
                      onClick={onContactClick}
                      className="flex items-center gap-2 text-white font-bold hover:text-accent-gold transition-colors group/btn"
                    >
                      Inquiry <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-gray-500">
              {lang === 'KOR' ? '등록된 상품이 없습니다.' : 'No items registered.'}
            </div>
          )}
        </div>

        <section className="mt-32 p-12 rounded-[3rem] bg-accent-gold text-primary text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-serif font-bold mb-6">Experience the Extraordinary</h2>
            <p className="text-primary/80 max-w-xl mx-auto mb-10 font-medium">
              We provide bespoke services for high-net-worth individuals seeking unique investment opportunities and rare collectibles.
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6" />
                <span className="font-bold uppercase tracking-wider text-sm">Verified Authenticity</span>
              </div>
              <div className="flex items-center gap-3">
                <Gem className="w-6 h-6" />
                <span className="font-bold uppercase tracking-wider text-sm">Exclusive Access</span>
              </div>
              <div className="flex items-center gap-3">
                <Handshake className="w-6 h-6" />
                <span className="font-bold uppercase tracking-wider text-sm">Private Consultation</span>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        </section>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeDetail}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-6xl bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col lg:flex-row max-h-[90vh]"
              >
                {/* Close Button */}
                <button 
                  onClick={closeDetail}
                  className="absolute top-6 right-6 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Left: Image Gallery */}
                <div className="lg:w-3/5 relative bg-black flex flex-col">
                  <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImageIdx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        src={selectedItem.images[activeImageIdx]}
                        alt={selectedItem.title[lang]}
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </AnimatePresence>

                    {selectedItem.images.length > 1 && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIdx((prev) => (prev === 0 ? selectedItem.images.length - 1 : prev - 1));
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIdx((prev) => (prev === selectedItem.images.length - 1 ? 0 : prev + 1));
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all backdrop-blur-md"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {selectedItem.images.length > 1 && (
                    <div className="p-6 bg-black/50 backdrop-blur-md border-t border-white/10 flex gap-3 overflow-x-auto no-scrollbar justify-center">
                      {selectedItem.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIdx(idx)}
                          className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all ${
                            activeImageIdx === idx ? 'ring-2 ring-accent-gold scale-105' : 'opacity-50 hover:opacity-100'
                          }`}
                        >
                          <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Info */}
                <div className="lg:w-2/5 p-10 lg:p-14 overflow-y-auto custom-scrollbar flex flex-col">
                  <div className="mb-8">
                    <span className="text-accent-gold text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
                      {selectedItem.category === 'antique' ? t.antiqueTab : t.realEstateTab}
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-6 leading-tight">
                      {selectedItem.title[lang]}
                    </h2>
                    <div className="h-1 w-20 bg-accent-gold mb-8"></div>
                  </div>

                  <div className="flex-1">
                    <p className="text-gray-400 text-lg font-light leading-relaxed mb-10 whitespace-pre-wrap">
                      {selectedItem.description[lang]}
                    </p>
                  </div>

                  <div className="pt-10 border-t border-white/10 mt-auto">
                    <div className="mb-8">
                      <span className="text-gray-500 text-xs uppercase tracking-widest block mb-2">{t.estValue}</span>
                      <span className="text-4xl font-serif font-bold text-accent-gold">{selectedItem.price}</span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        closeDetail();
                        onContactClick();
                      }}
                      className="w-full bg-accent-gold text-primary py-5 rounded-2xl font-bold text-lg hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent-gold/10"
                    >
                      {t.inquiry}
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VIPRoom;
