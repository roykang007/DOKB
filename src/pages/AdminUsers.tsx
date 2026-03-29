import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  UserCheck, 
  Shield, 
  Building2, 
  User as UserIcon,
  ArrowLeft,
  Check,
  Trash2,
  RefreshCcw
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface UserProfile {
  id: string;
  email: string;
  name_ko: string | null;
  role: 'customer' | 'b2b_buyer' | 'admin';
  created_at: string;
}

export const AdminUsers: React.FC<{ lang: 'KOR' | 'ENG' | 'CHI' }> = ({ lang }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    if (!isSupabaseConfigured) {
      setIsAdmin(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    // Special case for the main admin email - check this BEFORE database query
    const isMainAdmin = user.email === 'admin@dokbmall.com';
    
    if (isMainAdmin) {
      setIsAdmin(true);
      fetchUsers();
      return;
    }

    // Check database for admin role
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (error || userData?.role !== 'admin') {
      if (error && error.code === '42501') {
        console.error('Permission denied for users table. Please check RLS policies.');
      }
      toast.error(lang === 'KOR' ? '관리자 권한이 없습니다.' : lang === 'ENG' ? 'Admin access denied.' : '拒绝访问管理员。');
      navigate('/');
      setIsAdmin(false);
      return;
    }

    setIsAdmin(true);
    fetchUsers();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name_ko, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserProfile['role']) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(lang === 'KOR' ? '권한이 변경되었습니다.' : lang === 'ENG' ? 'Role updated successfully.' : '角色更新成功。');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(lang === 'KOR' ? '정말로 이 회원을 삭제하시겠습니까? (DB 프로필만 삭제됩니다)' : lang === 'ENG' ? 'Are you sure you want to delete this user? (Only DB profile will be deleted)' : '您确定要删除此用户吗？（仅删除数据库配置文件）')) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter(u => u.id !== userId));
      toast.success(lang === 'KOR' ? '회원이 삭제되었습니다.' : lang === 'ENG' ? 'User deleted successfully.' : '用户删除成功。');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name_ko && u.name_ko.toLowerCase().includes(search.toLowerCase()))
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
                {lang === 'KOR' ? '회원 권한 관리' : lang === 'ENG' ? 'User Role Management' : '用户角色管理'}
              </h1>
              <p className="text-gray-500">
                {lang === 'KOR' ? 'DOKB 회원들의 등급과 권한을 관리하세요' : lang === 'ENG' ? 'Manage grades and permissions of DOKB members' : '管理 DOKB 会员的等级和权限'}
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
                  placeholder={lang === 'KOR' ? '이메일 또는 이름으로 검색...' : lang === 'ENG' ? 'Search by email or name...' : '按电子邮件或姓名搜索...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-primary shadow-sm transition-all text-primary"
                />
              </div>
              <button 
                onClick={fetchUsers}
                disabled={loading}
                className={cn(
                  "w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-primary hover:shadow-md transition-all border border-gray-100",
                  loading && "opacity-50"
                )}
                title={lang === 'KOR' ? '새로고침' : lang === 'ENG' ? 'Refresh' : '刷新'}
              >
                <RefreshCcw className={cn("w-6 h-6", loading && "animate-spin")} />
              </button>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-4">
            <Users className="w-6 h-6 text-accent-teal" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '총 회원 수' : lang === 'ENG' ? 'Total Users' : '总用户数'}</p>
              <p className="text-xl font-bold text-primary">{users.length}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-6">{lang === 'KOR' ? '회원 정보' : lang === 'ENG' ? 'User Info' : '用户信息'}</th>
                  <th className="px-6 py-6">{lang === 'KOR' ? '가입일' : lang === 'ENG' ? 'Joined At' : '加入日期'}</th>
                  <th className="px-6 py-6">{lang === 'KOR' ? '현재 권한' : lang === 'ENG' ? 'Current Role' : '当前角色'}</th>
                  <th className="px-8 py-6 text-right">{lang === 'KOR' ? '권한 변경' : lang === 'ENG' ? 'Change Role' : '更改角色'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={user.id} 
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            user.role === 'admin' ? "bg-red-50 text-red-600" : 
                            user.role === 'b2b_buyer' ? "bg-teal-50 text-teal-600" : 
                            "bg-blue-50 text-blue-600"
                          )}>
                            {user.role === 'admin' ? <Shield className="w-6 h-6" /> : 
                             user.role === 'b2b_buyer' ? <Building2 className="w-6 h-6" /> : 
                             <UserIcon className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-bold text-primary">{user.name_ko || (lang === 'KOR' ? '이름 없음' : lang === 'ENG' ? 'No Name' : '无姓名')}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString(lang === 'KOR' ? 'ko-KR' : lang === 'ENG' ? 'en-US' : 'zh-CN')}
                      </td>
                      <td className="px-6 py-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          user.role === 'admin' ? "bg-red-100 text-red-700" : 
                          user.role === 'b2b_buyer' ? "bg-teal-100 text-teal-700" : 
                          "bg-blue-100 text-blue-700"
                        )}>
                          {user.role === 'admin' ? (lang === 'KOR' ? '관리자' : lang === 'ENG' ? 'Admin' : '管理员') : 
                           user.role === 'b2b_buyer' ? (lang === 'KOR' ? 'B2B 바이어' : lang === 'ENG' ? 'B2B Buyer' : 'B2B 买家') : 
                           (lang === 'KOR' ? '일반 유저' : lang === 'ENG' ? 'Customer' : '普通用户')}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value as UserProfile['role'])}
                            className={cn(
                              "bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 outline-none focus:border-primary transition-all font-bold text-xs cursor-pointer text-primary",
                              user.role === 'admin' && "text-red-600 border-red-100",
                              user.role === 'b2b_buyer' && "text-teal-600 border-teal-100"
                            )}
                          >
                            <option value="customer">{lang === 'KOR' ? '👤 일반유저' : lang === 'ENG' ? '👤 Customer' : '👤 普通用户'}</option>
                            <option value="b2b_buyer">{lang === 'KOR' ? '🏢 B2B 바이어' : lang === 'ENG' ? '🏢 B2B Buyer' : '🏢 B2B 买家'}</option>
                            <option value="admin">{lang === 'KOR' ? '🔑 관리자' : lang === 'ENG' ? '🔑 Admin' : '🔑 管理员'}</option>
                          </select>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all"
                            title={lang === 'KOR' ? '삭제' : lang === 'ENG' ? 'Delete' : '删除'}
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
            
            {filteredUsers.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold">
                  {lang === 'KOR' ? '검색 결과가 없습니다.' : lang === 'ENG' ? 'No users found.' : '未找到用户。'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
