import React, { useState, useEffect } from 'react';
import { useNavigate, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { supabase } from './lib/supabase';
import { X, Mail, LogIn, User } from 'lucide-react';

// Layout & Context
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartProvider } from './contexts/CartContext';

// Pages
import { Home } from './pages/Home';
import { ProductList } from './pages/ProductList';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderHistory } from './pages/OrderHistory';
import { AdminProducts } from './pages/AdminProducts';
import { AdminUsers } from './pages/AdminUsers';

const ProtectedRoute = ({ user, children, requireAdmin = false }: { user: any, children: React.ReactNode, requireAdmin?: boolean }) => {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Login required');
        navigate('/');
        return;
      }

      if (requireAdmin) {
        // First check metadata for quick check
        if (session.user.user_metadata?.role !== 'admin') {
          // Double check with database for security
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('auth_id', session.user.id)
            .single();

          if (error || userData?.role !== 'admin') {
            toast.error('Admin access denied');
            navigate('/');
            return;
          }
        }
      }
      
      setIsVerifying(false);
    };

    checkAccess();
  }, [user, navigate, requireAdmin]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-teal"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<any>(null);
  const [userInquiries, setUserInquiries] = useState<any[]>([]);
  const [lang, setLang] = useState<'KOR' | 'ENG'>('KOR');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserInquiries(session.user.id);
      } else {
        setUserInquiries([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserInquiries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('buyer_inquiries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserInquiries(data || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('submitting');
    setAuthError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setFormStatus('success');
        toast.success(lang === 'KOR' ? '인증 메일을 확인해주세요!' : 'Please check your verification email!');
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setFormStatus('idle');
        }, 3000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setIsAuthModalOpen(false);
        setFormStatus('idle');
        toast.success(lang === 'KOR' ? '로그인되었습니다.' : 'Logged in successfully.');
      }
    } catch (error: any) {
      setAuthError(error.message);
      setFormStatus('error');
      toast.error(error.message);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>, type: 'contact' | 'newsletter') => {
    e.preventDefault();
    setFormStatus('submitting');
    
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      toast.error(lang === 'KOR' ? '올바른 이메일 형식을 입력해주세요.' : 'Please enter a valid email address.');
      setFormStatus('idle');
      return;
    }

    try {
      let error;
      if (type === 'newsletter') {
        const { error: newsletterError } = await supabase
          .from('subscribers')
          .insert([{ email: data.email, source: 'landing_page', user_id: user?.id || null }]);
        error = newsletterError;
      } else {
        const payload = {
          company_name: data.company_name,
          contact_name: data.contact_name,
          email: data.email,
          phone: data.phone || null,
          country: data.country || null,
          message: data.message,
          user_id: user?.id || null
        };
        const { error: inquiryError } = await supabase.from('buyer_inquiries').insert([payload]);
        error = inquiryError;
      }

      if (error) throw error;
      if (user) fetchUserInquiries(user.id);

      setFormStatus('success');
      toast.success(lang === 'KOR' ? '성공적으로 접수되었습니다!' : 'Successfully submitted!');
      
      if (type === 'contact') {
        setTimeout(() => {
          setIsContactModalOpen(false);
          setFormStatus('idle');
        }, 2000);
      } else {
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setFormStatus('idle'), 3000);
      }
    } catch (error: any) {
      toast.error(error.message);
      setFormStatus('error');
    }
  };

  return (
    <Router>
      <CartProvider>
        <div className="min-h-screen selection:bg-accent-teal selection:text-primary">
          <Toaster position="top-center" richColors />
          
          <Navbar 
            lang={lang} 
            setLang={setLang} 
            user={user} 
            onAuthClick={() => setIsAuthModalOpen(true)}
            onContactClick={() => setIsContactModalOpen(true)}
          />

          <Routes>
            <Route path="/" element={
              <Home 
                lang={lang} 
                user={user} 
                userInquiries={userInquiries} 
                formStatus={formStatus}
                handleFormSubmit={handleFormSubmit}
                setIsContactModalOpen={setIsContactModalOpen}
              />
            } />
            <Route path="/products" element={<ProductList lang={lang} />} />
            <Route path="/products/:id" element={<ProductDetail lang={lang} />} />
            <Route path="/cart" element={<Cart lang={lang} />} />
            <Route path="/checkout" element={<Checkout lang={lang} />} />
            <Route path="/mypage/orders" element={<OrderHistory lang={lang} />} />
            <Route path="/admin/products" element={
              <ProtectedRoute user={user} requireAdmin>
                <AdminProducts lang={lang} />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute user={user} requireAdmin>
                <AdminUsers lang={lang} />
              </ProtectedRoute>
            } />
          </Routes>


          <Footer lang={lang} />

          {/* Auth Modal */}
          <AnimatePresence>
            {isAuthModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAuthModalOpen(false)}
                  className="absolute inset-0 bg-primary/80 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-md bg-white rounded-[2rem] p-8 lg:p-10 shadow-2xl overflow-hidden"
                >
                  <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-primary transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                  
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif font-bold text-primary mb-2">
                      {authMode === 'login' ? (lang === 'KOR' ? '로그인' : 'Login') : (lang === 'KOR' ? '회원가입' : 'Sign Up')}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {lang === 'KOR' ? '도깨비몰의 마법 같은 혜택을 누리세요' : 'Enjoy the magical benefits of DOKB Mall'}
                    </p>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '이메일' : 'Email'}</label>
                      <input name="email" required type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '비밀번호' : 'Password'}</label>
                      <input name="password" required type="password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                    </div>
                    
                    {authError && <p className="text-highlight-red text-xs font-bold">{authError}</p>}
                    
                    <button 
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
                    >
                      {formStatus === 'submitting' ? (lang === 'KOR' ? '처리 중...' : 'Processing...') : (authMode === 'login' ? (lang === 'KOR' ? '로그인' : 'Login') : (lang === 'KOR' ? '가입하기' : 'Sign Up'))}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button 
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="text-sm text-accent-teal font-bold hover:underline"
                    >
                      {authMode === 'login' ? (lang === 'KOR' ? '계정이 없으신가요? 회원가입' : 'No account? Sign Up') : (lang === 'KOR' ? '이미 계정이 있으신가요? 로그인' : 'Already have an account? Login')}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Contact Modal */}
          <AnimatePresence>
            {isContactModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsContactModalOpen(false)}
                  className="absolute inset-0 bg-primary/80 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-2xl bg-white rounded-[2rem] p-8 lg:p-10 shadow-2xl overflow-hidden"
                >
                  <button onClick={() => setIsContactModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-primary transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                  
                  <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-2">{lang === 'KOR' ? '바이어 문의하기' : 'Buyer Inquiry'}</h3>
                    <p className="text-gray-500 text-sm">{lang === 'KOR' ? '전문 상담원이 24시간 이내에 답변해 드립니다' : 'Our experts will respond within 24 hours'}</p>
                  </div>

                  <form onSubmit={(e) => handleFormSubmit(e, 'contact')} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '이름' : 'Name'}</label>
                        <input name="contact_name" required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '이메일' : 'Email'}</label>
                        <input name="email" required type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '회사명' : 'Company'}</label>
                        <input name="company_name" required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '연락처' : 'Phone'}</label>
                        <input name="phone" type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '국가' : 'Country'}</label>
                      <input name="country" type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '문의 내용' : 'Message'}</label>
                      <textarea name="message" required rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors resize-none text-primary" />
                    </div>
                    <button 
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="w-full bg-highlight-red text-white py-4 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg disabled:opacity-50"
                    >
                      {formStatus === 'submitting' ? (lang === 'KOR' ? '전송 중...' : 'Sending...') : (lang === 'KOR' ? '문의 제출하기' : 'Submit Inquiry')}
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </CartProvider>
    </Router>
  );
}
