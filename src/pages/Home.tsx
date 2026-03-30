import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Sparkles, 
  ArrowRight, 
  Search, 
  Globe, 
  ShoppingBag, 
  Truck, 
  Award, 
  Package, 
  Beaker, 
  Handshake, 
  Mail,
  User
} from 'lucide-react';
import { HERO_IMAGES } from '../constants/images';

const DokkaebiClubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.5,2C18.12,2 17,3.12 17,4.5C17,4.82 17.07,5.13 17.18,5.41L13.5,9.09C12.91,8.71 12.23,8.5 11.5,8.5C9.57,8.5 8,10.07 8,12C8,12.73 8.21,13.41 8.59,14L4.91,17.68C4.63,17.57 4.32,17.5 4,17.5C2.62,17.5 1.5,18.62 1.5,20C1.5,21.38 2.62,22.5 4,22.5C5.38,22.5 6.5,21.38 6.5,20C6.5,19.68 6.43,19.37 6.32,19.09L10,15.41C10.59,15.79 11.27,16 12,16C13.93,16 15.5,14.43 15.5,12.5C15.5,11.77 15.29,11.09 14.91,10.5L18.59,6.82C18.87,6.93 19.18,7 19.5,7C20.88,7 22,5.88 22,4.5C22,3.12 20.88,2 19.5,2Z" />
  </svg>
);

interface HomeProps {
  lang: 'KOR' | 'ENG' | 'CHI';
  user: any;
  userInquiries: any[];
  formStatus: string;
  handleFormSubmit: (e: React.FormEvent<HTMLFormElement>, type: 'contact' | 'newsletter') => void;
  setIsContactModalOpen: (open: boolean) => void;
}

export const Home: React.FC<HomeProps> = ({ lang, user, userInquiries, formStatus, handleFormSubmit, setIsContactModalOpen }) => {
  const navigate = useNavigate();
  const [heroImages, setHeroImages] = React.useState(HERO_IMAGES);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'hero_images')
          .maybeSingle();
        
        if (data && data.value) {
          setHeroImages(data.value);
        }
      } catch (error) {
        console.error('Error fetching hero images:', error);
      }
    };
    fetchSettings();
  }, []);

  const t = {
    hero: {
      title: lang === 'KOR' ? '뚝딱! 최고의 K-상품을 찾아드립니다' : lang === 'ENG' ? 'Korean Quality, Magic Delivered' : '韩流品质，魔力送达',
      subtitle: lang === 'KOR' ? '도깨비몰이 엄선한 프리미엄 K-상품을 국내외 시장에 공급합니다' : lang === 'ENG' ? 'DOKB Mall supplies premium K-products curated for domestic and global markets.' : 'DOKB Mall 为国内外市场提供精选的优质韩国产品。',
      ctaPrimary: lang === 'KOR' ? '상품 둘러보기' : lang === 'ENG' ? 'Shop Now' : '立即购物',
      ctaSecondary: lang === 'KOR' ? 'B2B 바이어 문의' : lang === 'ENG' ? 'B2B Inquiry' : 'B2B 咨询'
    },
    story: {
      title: lang === 'KOR' ? '도깨비몰 이야기' : lang === 'ENG' ? 'Our Story' : '我们的故事',
      content: lang === 'KOR' 
        ? '도깨비는 방망이 하나로 무엇이든 만들어냅니다. 도깨비몰은 한국 최고의 품질을 가진 상품을 발굴하여, 국내외 바이어와 소비자에게 마법처럼 전달합니다.'
        : lang === 'ENG' ? 'DOKB Mall discovers Korea\'s finest quality products and delivers them magically to buyers and consumers worldwide.' : 'DOKB Mall 发现韩国最优质的产品，并神奇地将其交付给全球的买家和消费者。',
      card1: lang === 'KOR' ? '엄선된 상품' : lang === 'ENG' ? 'Curated Products' : '精选产品',
      card2: lang === 'KOR' ? '글로벌 공급' : lang === 'ENG' ? 'Global Supply' : '全球供应',
      card3: lang === 'KOR' ? '자체 브랜드' : lang === 'ENG' ? 'Own Brand DOKB' : '自有品牌 DOKB'
    },
    categories: {
      title: lang === 'KOR' ? '도깨비몰 상품관' : lang === 'ENG' ? 'Product Collections' : '产品系列',
      beauty: { title: lang === 'KOR' ? 'K-뷰티' : lang === 'ENG' ? 'K-Beauty' : '韩国美容', desc: lang === 'KOR' ? '프리미엄 스킨케어 & 메이크업' : lang === 'ENG' ? 'Premium Skincare & Makeup' : '优质护肤和化妆品' },
      food: { title: lang === 'KOR' ? 'K-푸드' : lang === 'ENG' ? 'K-Food' : '韩国食品', desc: lang === 'KOR' ? '전통의 맛과 현대적 감각' : lang === 'ENG' ? 'Traditional Taste, Modern Style' : '传统口味，现代风格' },
      lifestyle: { title: lang === 'KOR' ? '생활용품' : lang === 'ENG' ? 'Lifestyle' : '生活方式', desc: lang === 'KOR' ? '삶의 질을 높이는 혁신 아이템' : lang === 'ENG' ? 'Innovative Items for Life' : '提升生活品质的创新产品' },
      brand: { title: lang === 'KOR' ? 'DOKB 자체브랜드' : lang === 'ENG' ? 'DOKB Brand' : 'DOKB 品牌', desc: lang === 'KOR' ? '도깨비몰만의 특별한 셀렉션' : lang === 'ENG' ? 'Exclusive DOKB Selections' : '独家 DOKB 精选' },
      explore: lang === 'KOR' ? '보러가기' : lang === 'ENG' ? 'Explore' : '探索'
    },
    mypage: {
      title: lang === 'KOR' ? '나의 문의 내역' : lang === 'ENG' ? 'My Inquiries' : '我的咨询',
      empty: lang === 'KOR' ? '문의 내역이 없습니다.' : lang === 'ENG' ? 'No inquiries found.' : '未找到咨询。',
      type: lang === 'KOR' ? '유형' : lang === 'ENG' ? 'Type' : '类型',
      date: lang === 'KOR' ? '날짜' : lang === 'ENG' ? 'Date' : '日期',
      status: lang === 'KOR' ? '상태' : lang === 'ENG' ? 'Status' : '状态',
      pending: lang === 'KOR' ? '검토 중' : lang === 'ENG' ? 'Pending' : '待处理'
    },
    b2b: {
      title: lang === 'KOR' ? '글로벌 바이어를 위한 특별관' : lang === 'ENG' ? 'For Global B2B Buyers' : '面向全球 B2B 买家',
      content: lang === 'KOR' ? '도매 구매, 샘플 요청, OEM 상담까지 — 도깨비몰이 함께합니다' : lang === 'ENG' ? 'From bulk orders to sample requests and OEM consulting — DOKB Mall is with you.' : '从批量订单到样品请求和 OEM 咨询 — DOKB Mall 与您同在。',
      feature1: lang === 'KOR' ? '벌크 도매 주문' : lang === 'ENG' ? 'Bulk Orders' : '批量订单',
      feature2: lang === 'KOR' ? '샘플 신청' : lang === 'ENG' ? 'Sample Request' : '样品请求',
      feature3: lang === 'KOR' ? 'OEM 협력' : lang === 'ENG' ? 'OEM Partnership' : 'OEM 合作伙伴',
      cta: lang === 'KOR' ? '바이어 문의하기' : lang === 'ENG' ? 'Contact as a Buyer' : '作为买家联系'
    },
    trust: {
      title: lang === 'KOR' ? '왜 도깨비몰인가요?' : lang === 'ENG' ? 'Why DOKB Mall?' : '为什么选择 DOKB Mall？',
      stat1: lang === 'KOR' ? '50+ 입점 브랜드' : lang === 'ENG' ? '50+ Partner Brands' : '50+ 合作伙伴品牌',
      stat2: lang === 'KOR' ? '100+ 엄선 상품' : lang === 'ENG' ? '100+ Curated SKUs' : '100+ 精选 SKU',
      stat3: lang === 'KOR' ? '30+ 국가 공급' : lang === 'ENG' ? '30+ Countries Served' : '服务 30+ 国家',
      stat4: lang === 'KOR' ? 'KOTRA 협력' : lang === 'ENG' ? 'KOTRA Partner' : 'KOTRA 合作伙伴'
    },
    newsletter: {
      title: lang === 'KOR' ? '도깨비몰 소식을 받아보세요' : lang === 'ENG' ? 'Stay in the Loop' : '保持联系',
      subtext: lang === 'KOR' ? '신상품 및 바이어 특가 정보를 가장 먼저 받아보세요' : lang === 'ENG' ? 'Be the first to receive new product updates and exclusive buyer deals.' : '率先接收新产品更新和独家买家优惠。',
      subscribe: lang === 'KOR' ? '구독하기' : lang === 'ENG' ? 'Subscribe' : '订阅'
    }
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-32 pb-20 lg:pt-20 overflow-hidden traditional-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-primary to-primary z-0" />
        
        {/* Animated Dokkaebi Fire Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 lg:w-96 lg:h-96 bg-accent-teal/10 rounded-full blur-[100px] lg:blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 lg:w-[500px] lg:h-[500px] bg-accent-gold/5 rounded-full blur-[120px] lg:blur-[150px] animate-pulse" />

        <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left order-1"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-accent-teal/10 border border-accent-teal/20 px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-accent-teal" />
              <span className="text-[10px] lg:text-xs font-bold text-accent-teal uppercase tracking-widest">Premium Korean Selection</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-serif font-bold leading-[1.1] mb-8">
              <span className="block text-accent-gold mb-2">{t.hero.title.split('!')[0]}!</span>
              <span className="relative inline-block">
                {t.hero.title.split('!')[1] || t.hero.title}
                <svg className="absolute -bottom-2 lg:-bottom-4 left-0 w-full h-2 lg:h-3 text-accent-teal/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-10 lg:mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-col md:flex-row justify-center lg:justify-start gap-4 lg:gap-6">
              <button 
                onClick={() => {
                  const el = document.getElementById('products');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full md:w-auto bg-accent-gold text-primary px-10 py-4 lg:py-5 rounded-full font-bold text-lg lg:text-xl hover:scale-105 transition-transform shadow-2xl shadow-accent-gold/30 flex items-center justify-center gap-3 group shimmer-btn"
              >
                {t.hero.ctaPrimary}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setIsContactModalOpen(true)}
                className="w-full md:w-auto border-2 border-white/20 text-white px-10 py-4 lg:py-5 rounded-full font-bold text-lg lg:text-xl hover:bg-white/5 transition-all backdrop-blur-sm shimmer-btn"
              >
                {t.hero.ctaSecondary}
              </button>
            </div>
          </motion.div>

          <motion.div 
            className="relative flex justify-center items-center order-2"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            {/* Main Character Container */}
            <div className="relative w-full max-w-[280px] md:max-w-md lg:max-w-lg aspect-square">
              {/* Dokkaebi Fire Glow Effect */}
              <div className="absolute inset-0 bg-accent-teal/30 rounded-full blur-[60px] lg:blur-[80px] dokkaebi-glow" />
              
              {/* Character Image */}
              <div className="relative z-10 w-full h-full dokkaebi-fire">
                <img 
                  src={heroImages.mainMascot} 
                  alt="DOKB Mascot" 
                  className="w-full h-full object-cover rounded-[2.5rem] lg:rounded-[4rem] shadow-[0_0_50px_rgba(0,201,177,0.3)] border-4 border-accent-teal/20"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating Club Icon */}
                <motion.div 
                  className="absolute -top-6 -right-6 lg:-top-10 lg:-right-10 z-30 bg-accent-gold p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] shadow-[0_20px_40px_rgba(245,200,66,0.4)]"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    y: [0, -10, 0]
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <DokkaebiClubIcon className="w-10 h-10 lg:w-16 lg:h-16 text-primary" />
                </motion.div>
              </div>

              {/* Floating Product Cards */}
              <AnimatePresence>
                {[
                  { id: 'beauty', img: heroImages.categories.beauty, label: 'K-Beauty', color: 'bg-accent-teal', delay: 0, x: -80, y: -60, lgX: -120, lgY: -80 },
                  { id: 'food', img: heroImages.categories.food, label: 'K-Food', color: 'bg-highlight-red', delay: 0.5, x: 100, y: 80, lgX: 140, lgY: 100 },
                  { id: 'lifestyle', img: heroImages.categories.lifestyle, label: 'Lifestyle', color: 'bg-accent-gold', delay: 1, x: -60, y: 100, lgX: -100, lgY: 140 }
                ].map((card) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      x: window.innerWidth < 1024 ? card.x : card.lgX,
                      y: window.innerWidth < 1024 ? card.y : card.lgY,
                    }}
                    transition={{ 
                      delay: card.delay + 0.5,
                      duration: 0.8,
                      type: "spring",
                      stiffness: 100
                    }}
                    className="absolute top-1/2 left-1/2 z-20"
                  >
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ 
                        duration: 3 + Math.random() * 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="bg-primary/40 backdrop-blur-xl p-2 lg:p-4 rounded-2xl lg:rounded-3xl border border-white/20 shadow-2xl w-24 sm:w-32 lg:w-40"
                    >
                      <div className="relative mb-2 lg:mb-3 overflow-hidden rounded-xl lg:rounded-2xl aspect-square">
                        <img src={card.img} alt={card.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className={`absolute top-1 left-1 lg:top-2 lg:left-2 px-1.5 lg:px-2 py-0.5 rounded-full text-[8px] lg:text-[10px] font-bold text-white ${card.color}`}>
                          {card.label}
                        </div>
                      </div>
                      <div className="h-1 lg:h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${card.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: "70%" }}
                          transition={{ delay: card.delay + 1.5, duration: 1 }}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section id="about" className="py-20 lg:py-24 hanji-texture relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-accent-gold mb-4">{t.story.title}</h2>
            <p className="text-2xl md:text-3xl lg:text-5xl font-serif font-bold mb-12 max-w-4xl mx-auto leading-tight">
              "{t.story.content}"
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-16">
            {[
              { icon: Search, title: t.story.card1, color: 'text-accent-teal' },
              { icon: Globe, title: t.story.card2, color: 'text-accent-gold' },
              { icon: Sparkles, title: t.story.card3, color: 'text-highlight-red' }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="bg-white p-8 lg:p-10 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all group"
              >
                <item.icon className={`w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-6 ${item.color} group-hover:scale-110 transition-transform`} />
                <h3 className="text-lg lg:text-xl font-bold text-primary">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Category Section */}
      <section id="products" className="py-20 lg:py-24 bg-primary relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl lg:text-6xl font-serif font-bold mb-4">{t.categories.title}</h2>
              <div className="h-1 w-20 lg:w-24 bg-accent-gold mx-auto md:mx-0" />
            </div>
            <button 
              onClick={() => navigate('/products')}
              className="flex items-center justify-center gap-2 text-accent-teal font-bold hover:gap-4 transition-all"
            >
              {t.categories.explore} <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { title: t.categories.beauty.title, desc: t.categories.beauty.desc, bg: 'bg-[#004D40]', icon: Sparkles },
              { title: t.categories.food.title, desc: t.categories.food.desc, bg: 'bg-[#8E0000]', icon: ShoppingBag },
              { title: t.categories.lifestyle.title, desc: t.categories.lifestyle.desc, bg: 'bg-[#744D00]', icon: Truck },
              { title: t.categories.brand.title, desc: t.categories.brand.desc, bg: 'bg-primary border-2 border-accent-gold', icon: Award }
            ].map((cat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className={`${cat.bg} p-6 lg:p-8 rounded-3xl h-[320px] lg:h-[400px] flex flex-col justify-between group cursor-pointer overflow-hidden relative card-glow-hover`}
              >
                <div className="absolute top-0 right-0 p-6 lg:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <cat.icon className="w-24 h-24 lg:w-32 lg:h-32" />
                </div>
                <div>
                  <h3 className="text-xl lg:text-2xl font-bold mb-2">{cat.title}</h3>
                  <p className="text-white/70 text-xs lg:text-sm">{cat.desc}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const categoryMap: { [key: number]: string } = {
                      0: 'beauty',
                      1: 'food',
                      2: 'lifestyle',
                      3: 'dokb_brand'
                    };
                    navigate(`/products?category=${categoryMap[idx]}`);
                  }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 py-2.5 lg:py-3 rounded-xl font-bold group-hover:bg-white group-hover:text-primary transition-all text-sm lg:text-base"
                >
                  {t.categories.explore}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Section Promotion */}
      <section className="py-24 bg-[#050505] text-white overflow-hidden relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2"
            >
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-accent-gold text-sm font-bold tracking-[0.3em] uppercase mb-4 block"
              >
                DOKB Prestige
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-serif font-bold mb-8 leading-tight"
              >
                The <span className="text-accent-gold italic">VIP</span> <br />Experience
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 text-lg mb-10 font-light leading-relaxed max-w-xl"
              >
                {lang === 'KOR' 
                  ? '오직 선택받은 소수만을 위한 특별한 비즈니스 파트너십. 고미술품부터 프리미엄 부동산까지, DOKB가 제안하는 최상의 가치를 경험하십시오.' 
                  : 'An exclusive business partnership for the selected few. From fine antiques to premium real estate, experience the ultimate value proposed by DOKB.'}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Link 
                  to="/vip"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-transparent border border-accent-gold text-accent-gold font-bold text-lg rounded-full hover:bg-accent-gold hover:text-primary transition-all dokkaebi-glow"
                >
                  {lang === 'KOR' ? 'VIP 룸 입장하기' : 'Enter VIP Room'}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:w-1/2 relative"
            >
              <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/10">
                <img 
                  src="https://picsum.photos/seed/luxury-interior/1000/1000" 
                  alt="Luxury Interior" 
                  className="w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-gold/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-teal/20 rounded-full blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* B2B Buyer Section */}
      <section id="b2b" className="py-20 lg:py-24 relative">
        <div className="absolute inset-0 bg-accent-gold/5 border-y border-accent-gold/20" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto bg-primary/50 backdrop-blur-xl p-8 md:p-12 lg:p-20 rounded-[30px] lg:rounded-[40px] border border-accent-gold/30 shadow-2xl"
          >
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-5xl font-serif font-bold mb-6 text-accent-gold">{t.b2b.title}</h2>
              <p className="text-base lg:text-xl text-gray-300">{t.b2b.content}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-12 lg:mb-16">
              {[
                { icon: Package, title: t.b2b.feature1 },
                { icon: Beaker, title: t.b2b.feature2 },
                { icon: Handshake, title: t.b2b.feature3 }
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-accent-gold/10 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 border border-accent-gold/20">
                    <item.icon className="w-6 h-6 lg:w-8 lg:h-8 text-accent-gold" />
                  </div>
                  <h4 className="text-base lg:text-lg font-bold">{item.title}</h4>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button 
                onClick={() => setIsContactModalOpen(true)}
                className="w-full sm:w-auto bg-accent-gold text-primary px-10 lg:px-12 py-4 lg:py-5 rounded-full font-bold text-lg lg:text-xl hover:scale-105 transition-transform shadow-2xl shadow-accent-gold/30 shimmer-btn"
              >
                {t.b2b.cta}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Credibility Section */}
      <section className="py-20 lg:py-24 bg-white text-primary">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-center text-xs font-bold uppercase tracking-[0.3em] text-accent-gold mb-12 lg:mb-16">{t.trust.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16 lg:mb-24">
              {Object.values(t.trust).slice(1).map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl lg:text-5xl font-serif font-bold text-primary mb-2">{stat.split(' ')[0]}</div>
                  <div className="text-xs lg:text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.split(' ').slice(1).join(' ')}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 lg:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all">
            {['KOTRA', 'Cora Trade', 'SME', 'Global Biz', 'K-Brand'].map((logo) => (
              <span key={logo} className="text-lg lg:text-2xl font-serif font-bold italic">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-[#004D40] to-accent-teal opacity-90" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-serif font-bold mb-6">{t.newsletter.title}</h2>
            <p className="text-base lg:text-xl text-white/80 mb-10 lg:mb-12 max-w-2xl mx-auto">{t.newsletter.subtext}</p>
            
            <form 
              onSubmit={(e) => handleFormSubmit(e, 'newsletter')}
              className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto"
            >
              <input 
                type="email" 
                name="email"
                required
                placeholder="Email Address" 
                className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 lg:px-8 py-3.5 lg:py-4 outline-none focus:bg-white/20 transition-all text-sm lg:text-base"
              />
              <button 
                type="submit"
                disabled={formStatus === 'submitting'}
                className="w-full md:w-auto bg-accent-gold text-primary px-8 py-3.5 lg:py-4 rounded-full font-bold hover:brightness-110 transition-all text-sm lg:text-base shimmer-btn disabled:opacity-50"
              >
                {formStatus === 'submitting' ? (lang === 'KOR' ? '처리 중...' : 'Processing...') : t.newsletter.subscribe}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* My Page Section (Only for logged in users) */}
      {user && (
        <section id="mypage" className="py-20 lg:py-24 bg-primary/50 border-t border-white/5">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 bg-accent-gold/20 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-accent-gold" />
                </div>
                <div>
                  <h2 className="text-3xl lg:text-4xl font-serif font-bold">{t.mypage.title}</h2>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
              </div>

              {userInquiries.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {userInquiries.map((inquiry) => (
                    <motion.div 
                      key={inquiry.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${inquiry.company_name ? 'bg-accent-teal/20 text-accent-teal' : 'bg-accent-gold/20 text-accent-gold'}`}>
                            {inquiry.company_name ? (lang === 'KOR' ? '바이어 문의' : 'Buyer Inquiry') : (lang === 'KOR' ? '뉴스레터' : 'Newsletter')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(inquiry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white">
                          {inquiry.message?.substring(0, 50)}{inquiry.message?.length > 50 ? '...' : ''}
                        </h4>
                        {inquiry.company_name && <p className="text-xs text-gray-400">{inquiry.company_name}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent-teal rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-accent-teal uppercase tracking-widest">{t.mypage.pending}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">{t.mypage.empty}</p>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}
    </main>
  );
};
