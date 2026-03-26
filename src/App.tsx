/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  Globe, 
  Search, 
  Truck, 
  Sparkles, 
  ChevronRight, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Mail,
  Package,
  Beaker,
  Handshake,
  Award,
  Users,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

const DokkaebiClubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.5,2C18.12,2 17,3.12 17,4.5C17,4.82 17.07,5.13 17.18,5.41L13.5,9.09C12.91,8.71 12.23,8.5 11.5,8.5C9.57,8.5 8,10.07 8,12C8,12.73 8.21,13.41 8.59,14L4.91,17.68C4.63,17.57 4.32,17.5 4,17.5C2.62,17.5 1.5,18.62 1.5,20C1.5,21.38 2.62,22.5 4,22.5C5.38,22.5 6.5,21.38 6.5,20C6.5,19.68 6.43,19.37 6.32,19.09L10,15.41C10.59,15.79 11.27,16 12,16C13.93,16 15.5,14.43 15.5,12.5C15.5,11.77 15.29,11.09 14.91,10.5L18.59,6.82C18.87,6.93 19.18,7 19.5,7C20.88,7 22,5.88 22,4.5C22,3.12 20.88,2 19.5,2Z" />
  </svg>
);

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [lang, setLang] = useState<'KOR' | 'ENG'>('KOR');
  const [scrolled, setScrolled] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const FORMSPREE_URL = "https://formspree.io/f/mbdpjpbv";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>, type: 'contact' | 'newsletter') => {
    e.preventDefault();
    setFormStatus('submitting');
    
    const formData = new FormData(e.currentTarget);
    formData.append('form_type', type);

    try {
      const response = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setFormStatus('success');
        if (type === 'contact') {
          setTimeout(() => {
            setIsContactModalOpen(false);
            setFormStatus('idle');
          }, 2000);
        } else {
          (e.target as HTMLFormElement).reset();
          setTimeout(() => setFormStatus('idle'), 3000);
        }
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      setFormStatus('error');
    }
  };

  const t = {
    nav: {
      home: lang === 'KOR' ? '홈' : 'Home',
      products: lang === 'KOR' ? '상품' : 'Products',
      b2b: lang === 'KOR' ? 'B2B 바이어' : 'B2B Buyers',
      about: lang === 'KOR' ? '소개' : 'About',
      contact: lang === 'KOR' ? '문의' : 'Contact',
      cta: lang === 'KOR' ? '바이어 문의' : 'Buyer Inquiry'
    },
    hero: {
      title: lang === 'KOR' ? '뚝딱! 최고의 K-상품을 찾아드립니다' : 'Korean Quality, Magic Delivered',
      subtitle: lang === 'KOR' ? '도깨비몰이 엄선한 프리미엄 K-상품을 국내외 시장에 공급합니다' : 'DOKB Mall supplies premium K-products curated for domestic and global markets.',
      ctaPrimary: lang === 'KOR' ? '상품 둘러보기' : 'Shop Now',
      ctaSecondary: lang === 'KOR' ? 'B2B 바이어 문의' : 'B2B Inquiry'
    },
    story: {
      title: lang === 'KOR' ? '도깨비몰 이야기' : 'Our Story',
      content: lang === 'KOR' 
        ? '도깨비는 방망이 하나로 무엇이든 만들어냅니다. 도깨비몰은 한국 최고의 품질을 가진 상품을 발굴하여, 국내외 바이어와 소비자에게 마법처럼 전달합니다.'
        : 'DOKB Mall discovers Korea\'s finest quality products and delivers them magically to buyers and consumers worldwide.',
      card1: lang === 'KOR' ? '엄선된 상품' : 'Curated Products',
      card2: lang === 'KOR' ? '글로벌 공급' : 'Global Supply',
      card3: lang === 'KOR' ? '자체 브랜드' : 'Own Brand DOKB'
    },
    categories: {
      title: lang === 'KOR' ? '도깨비몰 상품관' : 'Product Collections',
      beauty: { title: lang === 'KOR' ? 'K-뷰티' : 'K-Beauty', desc: lang === 'KOR' ? '프리미엄 스킨케어 & 메이크업' : 'Premium Skincare & Makeup' },
      food: { title: lang === 'KOR' ? 'K-푸드' : 'K-Food', desc: lang === 'KOR' ? '전통의 맛과 현대적 감각' : 'Traditional Taste, Modern Style' },
      lifestyle: { title: lang === 'KOR' ? '생활용품' : 'Lifestyle', desc: lang === 'KOR' ? '삶의 질을 높이는 혁신 아이템' : 'Innovative Items for Life' },
      brand: { title: lang === 'KOR' ? 'DOKB 자체브랜드' : 'DOKB Brand', desc: lang === 'KOR' ? '도깨비몰만의 특별한 셀렉션' : 'Exclusive DOKB Selections' },
      explore: lang === 'KOR' ? '보러가기' : 'Explore'
    },
    b2b: {
      title: lang === 'KOR' ? '글로벌 바이어를 위한 특별관' : 'For Global B2B Buyers',
      content: lang === 'KOR' ? '도매 구매, 샘플 요청, OEM 상담까지 — 도깨비몰이 함께합니다' : 'From bulk orders to sample requests and OEM consulting — DOKB Mall is with you.',
      feature1: lang === 'KOR' ? '벌크 도매 주문' : 'Bulk Orders',
      feature2: lang === 'KOR' ? '샘플 신청' : 'Sample Request',
      feature3: lang === 'KOR' ? 'OEM 협력' : 'OEM Partnership',
      cta: lang === 'KOR' ? '바이어 문의하기' : 'Contact as a Buyer'
    },
    trust: {
      title: lang === 'KOR' ? '왜 도깨비몰인가요?' : 'Why DOKB Mall?',
      stat1: lang === 'KOR' ? '50+ 입점 브랜드' : '50+ Partner Brands',
      stat2: lang === 'KOR' ? '100+ 엄선 상품' : '100+ Curated SKUs',
      stat3: lang === 'KOR' ? '30+ 국가 공급' : '30+ Countries Served',
      stat4: lang === 'KOR' ? 'KOTRA 협력' : 'KOTRA Partner'
    },
    newsletter: {
      title: lang === 'KOR' ? '도깨비몰 소식을 받아보세요' : 'Stay in the Loop',
      subtext: lang === 'KOR' ? '신상품 및 바이어 특가 정보를 가장 먼저 받아보세요' : 'Be the first to receive new product updates and exclusive buyer deals.',
      subscribe: lang === 'KOR' ? '구독하기' : 'Subscribe'
    }
  };

  return (
    <div className="min-h-screen selection:bg-accent-teal selection:text-primary">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-primary/90 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DokkaebiClubIcon className="w-8 h-8 text-accent-gold" />
            <span className="text-2xl font-serif font-bold tracking-tighter text-accent-gold">DOKB</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {Object.entries(t.nav).slice(0, 5).map(([key, value]) => (
              <a key={key} href={`#${key}`} className="text-sm font-medium hover:text-accent-teal transition-colors uppercase tracking-wider">
                {value}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setLang(lang === 'KOR' ? 'ENG' : 'KOR')}
              className="flex items-center gap-1 text-xs font-bold border border-white/20 px-2 py-1 rounded hover:bg-white/10 transition-colors"
            >
              <Globe className="w-3 h-3" />
              {lang}
            </button>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="bg-highlight-red text-white px-5 py-2 rounded-full text-sm font-bold hover:brightness-110 transition-all shadow-lg hover:shadow-highlight-red/20 shimmer-btn"
            >
              {t.nav.cta}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-primary pt-24 px-6 md:hidden"
          >
            <nav className="flex flex-col gap-6 text-center">
              {Object.entries(t.nav).map(([key, value]) => (
                <a 
                  key={key} 
                  href={`#${key}`} 
                  className="text-2xl font-serif"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {value}
                </a>
              ))}
              <button 
                onClick={() => setLang(lang === 'KOR' ? 'ENG' : 'KOR')}
                className="mx-auto flex items-center gap-2 text-lg border border-white/20 px-4 py-2 rounded"
              >
                <Globe className="w-5 h-5" />
                {lang === 'KOR' ? 'English' : '한국어'}
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

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
                  src="https://picsum.photos/seed/dokkaebi-hero/1000/1000" 
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

              {/* Floating Product Cards Redesign */}
              <AnimatePresence>
                {[
                  { id: 'beauty', img: 'https://picsum.photos/seed/kbeauty-hero/200/200', label: 'K-Beauty', color: 'bg-accent-teal', delay: 0, x: -80, y: -60, lgX: -120, lgY: -80 },
                  { id: 'food', img: 'https://picsum.photos/seed/kfood-hero/200/200', label: 'K-Food', color: 'bg-highlight-red', delay: 0.5, x: 100, y: 80, lgX: 140, lgY: 100 },
                  { id: 'lifestyle', img: 'https://picsum.photos/seed/lifestyle-hero/200/200', label: 'Lifestyle', color: 'bg-accent-gold', delay: 1, x: -60, y: 100, lgX: -100, lgY: 140 }
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

              {/* Fire Particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="fire-particle"
                  initial={{ 
                    x: Math.random() * 200 - 100, 
                    y: 100, 
                    opacity: 0 
                  }}
                  animate={{ 
                    y: -150, 
                    opacity: [0, 1, 0],
                    x: (Math.random() * 200 - 100) + (Math.sin(i) * 30)
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 2, 
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                />
              ))}
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
            <button className="flex items-center justify-center gap-2 text-accent-teal font-bold hover:gap-4 transition-all">
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
                <button className="bg-white/10 backdrop-blur-md border border-white/20 py-2.5 lg:py-3 rounded-xl font-bold group-hover:bg-white group-hover:text-primary transition-all text-sm lg:text-base">
                  {t.categories.explore}
                </button>
              </motion.div>
            ))}
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
            {/* Partner Logos Placeholder */}
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
            {formStatus === 'success' && (
              <p className="mt-4 text-accent-teal font-bold animate-pulse">
                {lang === 'KOR' ? '구독해주셔서 감사합니다!' : 'Thank you for subscribing!'}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary pt-16 lg:pt-24 pb-10 lg:pb-12 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12 mb-16 lg:mb-20">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <DokkaebiClubIcon className="w-7 h-7 lg:w-8 lg:h-8 text-accent-gold" />
                <span className="text-xl lg:text-2xl font-serif font-bold tracking-tighter text-accent-gold">DOKB</span>
              </div>
              <p className="text-gray-400 text-xs lg:text-sm leading-relaxed mb-6">
                (주)코라트레이드 | Cora Trade Co., Ltd.<br />
                www.dokbmall.com
              </p>
              <div className="flex gap-4">
                <Instagram className="w-5 h-5 text-gray-400 hover:text-accent-teal cursor-pointer" />
                <Linkedin className="w-5 h-5 text-gray-400 hover:text-accent-teal cursor-pointer" />
                <Youtube className="w-5 h-5 text-gray-400 hover:text-accent-teal cursor-pointer" />
                <Mail className="w-5 h-5 text-gray-400 hover:text-accent-teal cursor-pointer" />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm lg:text-base mb-4 lg:mb-6">{lang === 'KOR' ? '회사소개' : 'Company'}</h4>
              <ul className="flex flex-col gap-3 lg:gap-4 text-xs lg:text-sm text-gray-400">
                <li className="hover:text-white cursor-pointer">{lang === 'KOR' ? '브랜드 스토리' : 'Brand Story'}</li>
                <li className="hover:text-white cursor-pointer">{lang === 'KOR' ? '채용 정보' : 'Careers'}</li>
                <li className="hover:text-white cursor-pointer">{lang === 'KOR' ? '공지사항' : 'Announcements'}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm lg:text-base mb-4 lg:mb-6">{lang === 'KOR' ? '비즈니스' : 'Business'}</h4>
              <ul className="flex flex-col gap-3 lg:gap-4 text-xs lg:text-sm text-gray-400">
                <li className="hover:text-white cursor-pointer">{lang === 'KOR' ? '상품 소싱 문의' : 'Sourcing Inquiry'}</li>
                <li className="hover:text-white cursor-pointer">{lang === 'KOR' ? 'B2B 바이어 센터' : 'B2B Buyer Center'}</li>
                <li className="hover:text-white cursor-pointer">{lang === 'KOR' ? 'OEM/ODM 상담' : 'OEM/ODM Consulting'}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-sm lg:text-base mb-4 lg:mb-6">{lang === 'KOR' ? '고객지원' : 'Support'}</h4>
              <ul className="flex flex-col gap-3 lg:gap-4 text-xs lg:text-sm text-gray-400">
                <li className="hover:text-white cursor-pointer">{lang === 'KOR' ? '자주 묻는 질문' : 'FAQ'}</li>
                <li className="hover:text-white cursor-pointer">{lang === 'KOR' ? '개인정보처리방침' : 'Privacy Policy'}</li>
                <li className="hover:text-white cursor-pointer">{lang === 'KOR' ? '이용약관' : 'Terms of Service'}</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-10 lg:pt-12 border-t border-white/5 text-[10px] lg:text-xs text-gray-500">
            © 2025 DOKB Mall, Cora Trade Co., Ltd. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactModalOpen(false)}
              className="absolute inset-0 bg-primary/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white text-primary p-8 lg:p-12 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setIsContactModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-8">
                <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-4 text-accent-gold">
                  {lang === 'KOR' ? '바이어 문의' : 'Buyer Inquiry'}
                </h2>
                <p className="text-gray-500">
                  {lang === 'KOR' 
                    ? '도깨비몰과 함께할 글로벌 파트너를 기다립니다. 문의 내용을 남겨주시면 담당자가 연락드리겠습니다.' 
                    : 'We look forward to global partnerships. Please leave your inquiry and we will get back to you.'}
                </p>
              </div>

              {formStatus === 'success' ? (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 bg-accent-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-accent-teal" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {lang === 'KOR' ? '문의가 접수되었습니다!' : 'Inquiry Received!'}
                  </h3>
                  <p className="text-gray-500">
                    {lang === 'KOR' ? '빠른 시일 내에 답변 드리겠습니다.' : 'We will respond as soon as possible.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => handleFormSubmit(e, 'contact')} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '이름' : 'Name'}</label>
                      <input name="name" required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '이메일' : 'Email'}</label>
                      <input name="email" required type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '회사명' : 'Company'}</label>
                    <input name="company" required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '문의 내용' : 'Message'}</label>
                    <textarea name="message" required rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors resize-none" />
                  </div>
                  <button 
                    type="submit"
                    disabled={formStatus === 'submitting'}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:brightness-110 transition-all shimmer-btn disabled:opacity-50"
                  >
                    {formStatus === 'submitting' ? (lang === 'KOR' ? '전송 중...' : 'Sending...') : (lang === 'KOR' ? '문의하기' : 'Send Inquiry')}
                  </button>
                  {formStatus === 'error' && (
                    <p className="text-highlight-red text-center text-sm font-bold">
                      {lang === 'KOR' ? '오류가 발생했습니다. 다시 시도해주세요.' : 'An error occurred. Please try again.'}
                    </p>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
