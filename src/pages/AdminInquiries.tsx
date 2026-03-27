import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Search, 
  Filter, 
  ArrowLeft,
  Trash2,
  RefreshCcw,
  Building2,
  User as UserIcon,
  Globe,
  Phone,
  Calendar,
  ChevronRight,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Inquiry {
  id: string;
  created_at: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  message: string;
  user_id: string | null;
  status?: string; // We can add status later if needed
}

export const AdminInquiries: React.FC<{ lang: 'KOR' | 'ENG' }> = ({ lang }) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    const isMainAdmin = user.email === 'admin@dokbmall.com';
    
    if (isMainAdmin) {
      setIsAdmin(true);
      fetchInquiries();
      return;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (error || userData?.role !== 'admin') {
      toast.error(lang === 'KOR' ? '관리자 권한이 없습니다.' : 'Admin access denied.');
      navigate('/');
      setIsAdmin(false);
      return;
    }

    setIsAdmin(true);
    fetchInquiries();
  };

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('buyer_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205') {
          toast.error(lang === 'KOR' ? '문의 테이블이 존재하지 않습니다.' : 'Inquiry table does not exist.');
          setInquiries([]);
          return;
        }
        throw error;
      }
      setInquiries(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!window.confirm(lang === 'KOR' ? '정말로 이 문의를 삭제하시겠습니까?' : 'Are you sure you want to delete this inquiry?')) return;
    
    try {
      const { error } = await supabase
        .from('buyer_inquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInquiries(inquiries.filter(i => i.id !== id));
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
      toast.success(lang === 'KOR' ? '문의가 삭제되었습니다.' : 'Inquiry deleted successfully.');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredInquiries = inquiries.filter(i => 
    i.email.toLowerCase().includes(search.toLowerCase()) ||
    i.company_name.toLowerCase().includes(search.toLowerCase()) ||
    i.contact_name.toLowerCase().includes(search.toLowerCase()) ||
    i.message.toLowerCase().includes(search.toLowerCase())
  );

  if (isAdmin === null) return null;

  return (
    <div className="pt-32 pb-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/products')}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary hover:shadow-md transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-serif font-bold text-primary mb-2">
                {lang === 'KOR' ? '바이어 문의 관리' : 'Buyer Inquiry Management'}
              </h1>
              <p className="text-gray-500">
                {lang === 'KOR' ? '제출된 B2B 바이어 문의 내역을 확인하고 관리하세요' : 'Review and manage submitted B2B buyer inquiries'}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <div className="relative flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={lang === 'KOR' ? '이메일, 회사명, 이름으로 검색...' : 'Search by email, company, or name...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-primary shadow-sm transition-all text-primary"
                />
              </div>
              <button 
                onClick={fetchInquiries}
                disabled={loading}
                className={cn(
                  "w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary hover:shadow-md transition-all border border-gray-100",
                  loading && "opacity-50"
                )}
              >
                <RefreshCcw className={cn("w-6 h-6", loading && "animate-spin")} />
              </button>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-4">
            <Mail className="w-6 h-6 text-accent-teal" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '총 문의 수' : 'Total Inquiries'}</p>
              <p className="text-xl font-bold text-primary">{inquiries.length}</p>
            </div>
          </div>
        </div>

        {/* Inquiries List */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-6">{lang === 'KOR' ? '바이어 정보' : 'Buyer Info'}</th>
                  <th className="px-6 py-6">{lang === 'KOR' ? '국가' : 'Country'}</th>
                  <th className="px-6 py-6">{lang === 'KOR' ? '제출일' : 'Submitted At'}</th>
                  <th className="px-6 py-6">{lang === 'KOR' ? '내용 요약' : 'Message Summary'}</th>
                  <th className="px-8 py-6 text-right">{lang === 'KOR' ? '관리' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {filteredInquiries.map((inquiry) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={inquiry.id} 
                      className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedInquiry(inquiry)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-accent-teal/10 rounded-xl flex items-center justify-center text-accent-teal">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-bold text-primary">{inquiry.company_name}</p>
                            <p className="text-sm text-gray-400">{inquiry.contact_name} ({inquiry.email})</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4 text-gray-400" />
                          {inquiry.country || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(inquiry.created_at).toLocaleDateString(lang === 'KOR' ? 'ko-KR' : 'en-US')}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-sm text-gray-600 line-clamp-1 max-w-xs">
                          {inquiry.message}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInquiry(inquiry);
                            }}
                            className="p-2 text-gray-400 hover:text-primary transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInquiry(inquiry.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            
            {filteredInquiries.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold">
                  {lang === 'KOR' ? '문의 내역이 없습니다.' : 'No inquiries found.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Inquiry Detail Modal */}
        <AnimatePresence>
          {selectedInquiry && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedInquiry(null)}
                className="absolute inset-0 bg-primary/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-teal text-white rounded-2xl flex items-center justify-center shadow-lg shadow-accent-teal/20">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary">{lang === 'KOR' ? '문의 상세 내용' : 'Inquiry Details'}</h3>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">ID: {selectedInquiry.id.substring(0, 8)}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedInquiry(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors shadow-sm">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '회사명' : 'Company'}</p>
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Building2 className="w-4 h-4 text-accent-teal" />
                        {selectedInquiry.company_name}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '담당자' : 'Contact Person'}</p>
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <UserIcon className="w-4 h-4 text-accent-teal" />
                        {selectedInquiry.contact_name}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '이메일' : 'Email'}</p>
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Mail className="w-4 h-4 text-accent-teal" />
                        {selectedInquiry.email}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '연락처' : 'Phone'}</p>
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Phone className="w-4 h-4 text-accent-teal" />
                        {selectedInquiry.phone || '-'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '국가' : 'Country'}</p>
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Globe className="w-4 h-4 text-accent-teal" />
                        {selectedInquiry.country || '-'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '문의 일시' : 'Submitted At'}</p>
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Calendar className="w-4 h-4 text-accent-teal" />
                        {new Date(selectedInquiry.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-6 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '문의 내용' : 'Message'}</p>
                    <div className="bg-gray-50 p-6 rounded-2xl text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100 italic">
                      "{selectedInquiry.message}"
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
                  <button 
                    onClick={() => {
                      window.location.href = `mailto:${selectedInquiry.email}?subject=Re: DOKB Mall B2B Inquiry`;
                    }}
                    className="flex-1 sm:flex-none bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {lang === 'KOR' ? '이메일 답장하기' : 'Reply via Email'}
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
