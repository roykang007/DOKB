import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Globe, 
  LogIn, 
  LogOut, 
  User, 
  ShoppingBag,
  Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../contexts/CartContext';

const DokkaebiClubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.5,2C18.12,2 17,3.12 17,4.5C17,4.82 17.07,5.13 17.18,5.41L13.5,9.09C12.91,8.71 12.23,8.5 11.5,8.5C9.57,8.5 8,10.07 8,12C8,12.73 8.21,13.41 8.59,14L4.91,17.68C4.63,17.57 4.32,17.5 4,17.5C2.62,17.5 1.5,18.62 1.5,20C1.5,21.38 2.62,22.5 4,22.5C5.38,22.5 6.5,21.38 6.5,20C6.5,19.68 6.43,19.37 6.32,19.09L10,15.41C10.59,15.79 11.27,16 12,16C13.93,16 15.5,14.43 15.5,12.5C15.5,11.77 15.29,11.09 14.91,10.5L18.59,6.82C18.87,6.93 19.18,7 19.5,7C20.88,7 22,5.88 22,4.5C22,3.12 20.88,2 19.5,2Z" />
  </svg>
);

interface NavbarProps {
  lang: 'KOR' | 'ENG';
  setLang: (lang: 'KOR' | 'ENG') => void;
  user: any;
  onAuthClick: () => void;
  onContactClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ lang, setLang, user, onAuthClick, onContactClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { key: 'home', label: lang === 'KOR' ? '홈' : 'Home', path: '/' },
    { key: 'products', label: lang === 'KOR' ? '상품' : 'Products', path: '/products' },
    { key: 'b2b', label: lang === 'KOR' ? 'B2B 바이어' : 'B2B Buyers', path: '/#b2b' },
    { key: 'about', label: lang === 'KOR' ? '소개' : 'About', path: '/#about' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || location.pathname !== '/' ? 'bg-primary/90 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <DokkaebiClubIcon className="w-8 h-8 text-accent-gold" />
          <span className="text-2xl font-serif font-bold tracking-tighter text-accent-gold">DOKB</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            item.path.startsWith('/#') ? (
              <a key={item.key} href={item.path} className="text-sm font-medium hover:text-accent-teal transition-colors uppercase tracking-wider">
                {item.label}
              </a>
            ) : (
              <Link key={item.key} to={item.path} className="text-sm font-medium hover:text-accent-teal transition-colors uppercase tracking-wider">
                {item.label}
              </Link>
            )
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

          <Link to="/cart" className="relative text-white hover:text-accent-teal transition-colors">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-highlight-red text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              {user.user_metadata?.role === 'admin' && (
                <Link 
                  to="/admin/products"
                  className="flex items-center gap-2 text-xs font-bold text-accent-teal hover:text-white transition-colors border border-accent-teal/30 px-3 py-1 rounded-full"
                >
                  Admin
                </Link>
              )}
              <Link 
                to="/mypage/orders"
                className="flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-accent-gold transition-colors"
              >
                <User className="w-4 h-4 text-accent-teal" />
                {user.email?.split('@')[0]}
              </Link>
              <button 
                onClick={handleLogout}
                className="text-xs font-bold text-gray-400 hover:text-highlight-red transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                {lang === 'KOR' ? '로그아웃' : 'Logout'}
              </button>
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="text-xs font-bold text-white hover:text-accent-teal transition-colors flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" />
              {lang === 'KOR' ? '로그인' : 'Login'}
            </button>
          )}

          <button 
            onClick={onContactClick}
            className="bg-highlight-red text-white px-5 py-2 rounded-full text-sm font-bold hover:brightness-110 transition-all shadow-lg hover:shadow-highlight-red/20 shimmer-btn"
          >
            {lang === 'KOR' ? '바이어 문의' : 'Buyer Inquiry'}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

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
              {navItems.map((item) => (
                <Link 
                  key={item.key} 
                  to={item.path} 
                  className="text-2xl font-serif"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/cart" className="text-2xl font-serif" onClick={() => setIsMenuOpen(false)}>
                {lang === 'KOR' ? '장바구니' : 'Cart'} ({cartCount})
              </Link>
              <button 
                onClick={() => {
                  setLang(lang === 'KOR' ? 'ENG' : 'KOR');
                  setIsMenuOpen(false);
                }}
                className="mx-auto flex items-center gap-2 text-lg border border-white/20 px-4 py-2 rounded"
              >
                <Globe className="w-5 h-5" />
                {lang === 'KOR' ? 'English' : '한국어'}
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
