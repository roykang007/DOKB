import React, { useState, useEffect } from 'react';
import { useNavigate, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { X, Mail, LogIn, User, AlertTriangle } from 'lucide-react';

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
import { AdminOrders } from './pages/AdminOrders';
import { AdminSettings } from './pages/AdminSettings';

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
        const isMainAdmin = session.user.email === 'admin@dokbmall.com';
        
        if (!isMainAdmin && session.user.user_metadata?.role !== 'admin') {
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
  const [lang, setLang] = useState<'KOR' | 'ENG' | 'CHI'>('KOR');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check initial session
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Separate effect to handle user profile synchronization and inquiries
  useEffect(() => {
    const syncUserProfile = async () => {
      if (user && isSupabaseConfigured) {
        // Ensure user profile exists in the 'users' table
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!profile && !profileError) {
            await supabase.from('users').insert([{
              id: user.id,
              auth_id: user.id,
              email: user.email,
              role: 'customer',
              name_ko: user.email?.split('@')[0] || 'User'
            }]);
          }

          fetchUserInquiries(user.id);
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      } else if (!user) {
        setUserInquiries([]);
      }
    };

    syncUserProfile();
  }, [user?.id]);

  const fetchUserInquiries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('buyer_inquiries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST205') {
          console.warn('Table "buyer_inquiries" does not exist in Supabase. Please create it to use inquiry features.');
          setUserInquiries([]);
          return;
        }
        throw error;
      }
      setUserInquiries(data || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error(
        lang === 'KOR' ? '데이터베이스가 연결되지 않았습니다. 관리자에게 문의하세요.' : 
        lang === 'ENG' ? 'Database not connected. Please contact admin.' : 
        '数据库未连接。请联系管理员。'
      );
      return;
    }
    setFormStatus('submitting');
    setAuthError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (authMode === 'signup') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        
        if (signUpData.user) {
          // Create user profile in public.users table
          // We set both 'id' and 'auth_id' to the Supabase Auth UID
          // to ensure foreign key constraints in other tables (like cart_items) work correctly.
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: signUpData.user.id,
                auth_id: signUpData.user.id,
                email: email,
                role: 'customer',
                name_ko: email.split('@')[0] // Default name from email
              }
            ]);
          
          if (profileError) {
            console.error('Error creating user profile:', profileError);
            // We don't throw here to avoid blocking the signup process if the profile creation fails
            // but the auth was successful.
          }
        }

        setFormStatus('success');
        toast.success(
          lang === 'KOR' ? '인증 메일을 확인해주세요!' : 
          lang === 'ENG' ? 'Please check your verification email!' : 
          '请检查您的验证电子邮件！'
        );
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setFormStatus('idle');
        }, 3000);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setIsAuthModalOpen(false);
        setFormStatus('idle');
        toast.success(
          lang === 'KOR' ? '로그인되었습니다.' : 
          lang === 'ENG' ? 'Logged in successfully.' : 
          '登录成功。'
        );
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
      toast.error(
        lang === 'KOR' ? '올바른 이메일 형식을 입력해주세요.' : 
        lang === 'ENG' ? 'Please enter a valid email address.' : 
        '请输入有效的电子邮件地址。'
      );
      setFormStatus('idle');
      return;
    }

    try {
      let error;
      if (type === 'newsletter') {
        if (isSupabaseConfigured) {
          const { error: newsletterError } = await supabase
            .from('subscribers')
            .insert([{ email: data.email, source: 'landing_page', user_id: user?.id || null }]);
          error = newsletterError;
        } else {
          toast.success(
            lang === 'KOR' ? '구독해주셔서 감사합니다!' : 
            lang === 'ENG' ? 'Thank you for subscribing!' : 
            '感谢您的订阅！'
          );
          setFormStatus('success');
          setTimeout(() => setFormStatus('idle'), 3000);
          return;
        }
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

        // Send to Formspree
        try {
          await fetch('https://formspree.io/f/mbdpjpbv', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              subject: 'New Buyer Inquiry from DOKB Mall',
              ...payload
            })
          });
        } catch (fsError) {
          console.error('Formspree submission error:', fsError);
        }

        if (isSupabaseConfigured) {
          const { error: inquiryError } = await supabase.from('buyer_inquiries').insert([payload]);
          if (inquiryError && inquiryError.code === 'PGRST205') {
            toast.error(
              lang === 'KOR' ? '문의 테이블이 존재하지 않습니다. 관리자에게 문의하세요.' : 
              lang === 'ENG' ? 'Inquiry table does not exist. Please contact admin.' : 
              '咨询表不存在。请联系管理员。'
            );
            return;
          }
          error = inquiryError;
        } else {
          toast.success(
            lang === 'KOR' ? '문의가 접수되었습니다. 곧 연락드리겠습니다!' : 
            lang === 'ENG' ? 'Inquiry submitted. We will contact you soon!' : 
            '咨询已提交。我们将尽快与您联系！'
          );
          setFormStatus('success');
          setTimeout(() => {
            setIsContactModalOpen(false);
            setFormStatus('idle');
          }, 3000);
          return;
        }
      }

      if (error) throw error;
      if (user) fetchUserInquiries(user.id);

      setFormStatus('success');
      toast.success(
        lang === 'KOR' ? '성공적으로 접수되었습니다!' : 
        lang === 'ENG' ? 'Successfully submitted!' : 
        '提交成功！'
      );
      
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

          {!isSupabaseConfigured && (
            <div className="fixed bottom-6 left-6 right-6 z-[100] bg-highlight-red/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-white/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Supabase Configuration Missing</p>
                  <p className="text-xs opacity-90">Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="bg-white text-highlight-red px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shrink-0"
              >
                Retry
              </button>
            </div>
          )}

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
            <Route path="/admin/orders" element={
              <ProtectedRoute user={user} requireAdmin>
                <AdminOrders lang={lang} />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute user={user} requireAdmin>
                <AdminSettings />
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
                      {authMode === 'login' 
                        ? (lang === 'KOR' ? '로그인' : lang === 'ENG' ? 'Login' : '登录') 
                        : (lang === 'KOR' ? '회원가입' : lang === 'ENG' ? 'Sign Up' : '注册')}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {lang === 'KOR' 
                        ? '도깨비몰의 마법 같은 혜택을 누리세요' 
                        : lang === 'ENG' 
                        ? 'Enjoy the magical benefits of DOKB Mall' 
                        : '享受 DOKB Mall 的神奇优惠'}
                    </p>
                  </div>

                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '이메일' : lang === 'ENG' ? 'Email' : '电子邮件'}</label>
                      <input name="email" required type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '비밀번호' : lang === 'ENG' ? 'Password' : '密码'}</label>
                      <input name="password" required type="password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                    </div>
                    
                    {authError && <p className="text-highlight-red text-xs font-bold">{authError}</p>}
                    
                    <button 
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
                    >
                      {formStatus === 'submitting' 
                        ? (lang === 'KOR' ? '처리 중...' : lang === 'ENG' ? 'Processing...' : '处理中...') 
                        : (authMode === 'login' 
                          ? (lang === 'KOR' ? '로그인' : lang === 'ENG' ? 'Login' : '登录') 
                          : (lang === 'KOR' ? '가입하기' : lang === 'ENG' ? 'Sign Up' : '注册'))}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button 
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="text-sm text-accent-teal font-bold hover:underline"
                    >
                      {authMode === 'login' 
                        ? (lang === 'KOR' ? '계정이 없으신가요? 회원가입' : lang === 'ENG' ? 'No account? Sign Up' : '没有账号？注册') 
                        : (lang === 'KOR' ? '이미 계정이 있으신가요? 로그인' : lang === 'ENG' ? 'Already have an account? Login' : '已有账号？登录')}
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
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-primary mb-2">
                      {lang === 'KOR' ? '바이어 문의하기' : lang === 'ENG' ? 'Buyer Inquiry' : '买家咨询'}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {lang === 'KOR' ? '전문 상담원이 24시간 이내에 답변해 드립니다' : lang === 'ENG' ? 'Our experts will respond within 24 hours' : '我们的专家将在 24 小时内回复'}
                    </p>
                  </div>

                  <form onSubmit={(e) => handleFormSubmit(e, 'contact')} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '이름' : lang === 'ENG' ? 'Name' : '姓名'}</label>
                        <input name="contact_name" required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '이메일' : lang === 'ENG' ? 'Email' : '电子邮件'}</label>
                        <input name="email" required type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '회사명' : lang === 'ENG' ? 'Company' : '公司名称'}</label>
                        <input name="company_name" required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '연락처' : lang === 'ENG' ? 'Phone' : '电话'}</label>
                        <input name="phone" type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '국가' : lang === 'ENG' ? 'Country' : '国家'}</label>
                      <input name="country" type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-400">{lang === 'KOR' ? '문의 내용' : lang === 'ENG' ? 'Message' : '咨询内容'}</label>
                      <textarea name="message" required rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors resize-none text-primary" />
                    </div>
                    <button 
                      type="submit"
                      disabled={formStatus === 'submitting'}
                      className="w-full bg-highlight-red text-white py-4 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg disabled:opacity-50"
                    >
                      {formStatus === 'submitting' 
                        ? (lang === 'KOR' ? '전송 중...' : lang === 'ENG' ? 'Sending...' : '发送中...') 
                        : (lang === 'KOR' ? '문의 제출하기' : lang === 'ENG' ? 'Submit Inquiry' : '提交咨询')}
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
