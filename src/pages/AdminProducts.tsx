import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Users,
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingBag,
  Upload,
  X,
  Info,
  ChevronRight,
  ChevronLeft,
  Save,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPrice, cn } from '../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name_ko: string;
  name_en: string;
  description_ko: string;
  description_en: string;
  price: number;
  price_usd: number;
  thumbnail: string;
  images: string[];
  category: string;
  brand: string;
  tags: string[];
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

interface ProductOption {
  id?: string;
  option_name_ko: string;
  option_name_en: string;
  option_value_ko: string;
  option_value_en: string;
  additional_price: number;
  stock_quantity: number;
}

export const AdminProducts: React.FC<{ lang: 'KOR' | 'ENG' }> = ({ lang }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    todayOrders: 0
  });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name_ko: '',
    name_en: '',
    description_ko: '',
    description_en: '',
    price: 0,
    price_usd: 0,
    category: 'beauty',
    brand: 'DOKB',
    stock_quantity: 0,
    is_active: true,
    images: [],
    thumbnail: '',
    tags: []
  });
  const [formOptions, setFormOptions] = useState<ProductOption[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(lang === 'KOR' ? '로그인이 필요합니다.' : 'Login required.');
      navigate('/');
      setIsAdmin(false);
      return;
    }

    // Check metadata first
    if (user.user_metadata?.role === 'admin') {
      setIsAdmin(true);
      fetchData();
      return;
    }

    // Double check with database
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    // Special case for the main admin email
    const isMainAdmin = user.email === 'admin@dokbmall.com';

    if (!isMainAdmin && (error || userData?.role !== 'admin')) {
      toast.error(lang === 'KOR' ? '관리자 권한이 없습니다.' : 'Admin access denied.');
      navigate('/');
      setIsAdmin(false);
      return;
    }

    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch Stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: totalCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: lowStockCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock_quantity', 10);
      const { count: todayOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString());

      setStats({
        total: totalCount || 0,
        lowStock: lowStockCount || 0,
        todayOrders: todayOrdersCount || 0
      });

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      setProducts(products.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
      toast.success(lang === 'KOR' ? '상태가 변경되었습니다.' : 'Status updated.');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'KOR' ? '정말 삭제하시겠습니까?' : 'Are you sure you want to delete?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false }) // Soft delete
        .eq('id', id);
      
      if (error) throw error;
      setProducts(products.map(p => p.id === id ? { ...p, is_active: false } : p));
      toast.success(lang === 'KOR' ? '삭제되었습니다.' : 'Deleted successfully.');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedProducts.length === 0) return;
    
    try {
      let updateData = {};
      if (action === 'activate') updateData = { is_active: true };
      if (action === 'deactivate') updateData = { is_active: false };
      if (action === 'delete') updateData = { is_active: false };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .in('id', selectedProducts);
      
      if (error) throw error;
      
      setProducts(products.map(p => 
        selectedProducts.includes(p.id) ? { ...p, ...updateData } : p
      ));
      setSelectedProducts([]);
      toast.success(lang === 'KOR' ? '일괄 처리가 완료되었습니다.' : 'Bulk action completed.');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 파일 유효성 검사
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSizeMB = 5;

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: ${lang === 'KOR' ? '허용되지 않는 파일 형식입니다. (JPG, PNG, WEBP, GIF만 가능)' : 'Unsupported file format.'}`);
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name}: ${lang === 'KOR' ? '파일 크기가 5MB를 초과합니다.' : 'File size exceeds 5MB.'}`);
        return;
      }
    }

    setImageFiles(prev => [...prev, ...files]);
    
    // FileReader를 이용한 로컬 미리보기 생성
    const newPreviews: string[] = [];
    for (const file of files) {
      const previewUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
      if (previewUrl) newPreviews.push(previewUrl);
    }
    
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    console.log('Starting uploadImages, imageFiles length:', imageFiles.length);
    if (imageFiles.length === 0) return [];
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of imageFiles) {
        console.log('Uploading file:', file.name);
        // 고유 파일명 생성 (타임스탬프 + 랜덤)
        const ext = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = `products/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (uploadError) {
          console.error('Storage 업로드 에러:', uploadError.message);
          if (uploadError.message.toLowerCase().includes('bucket not found')) {
            throw new Error(lang === 'KOR' ? 'Supabase Storage에 "product-images" 버킷이 없습니다. 버킷을 먼저 생성해주세요.' : 'Storage bucket "product-images" not found. Please create it in Supabase.');
          }
          throw uploadError;
        }

        // Public URL 가져오기
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);
        
        const publicUrl = urlData?.publicUrl;

        // URL 유효성 검사 — 빈 문자열 방지
        if (!publicUrl || publicUrl === '') {
          console.error('Public URL 생성 실패');
          continue;
        }

        console.log('File uploaded successfully, publicUrl:', publicUrl);
        uploadedUrls.push(publicUrl);
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.message || 'Image upload failed');
      throw error;
    } finally {
      setIsUploading(false);
    }

    return uploadedUrls;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Starting handleSaveProduct');

    try {
      const newImageUrls = await uploadImages();
      console.log('New image URLs:', newImageUrls);

      // 이미지 URL 검증 — 빈 값 완전 제거
      const allImages = [...(formData.images || []), ...newImageUrls].filter(url => url && url.trim() !== "");
      console.log('All image URLs:', allImages);

      const thumbnail = allImages[0] || null; // null로 설정 (빈 문자열 아님)
      console.log('Selected thumbnail:', thumbnail);

      const { id, created_at, ...restFormData } = formData;
      const productData = {
        ...restFormData,
        images: allImages,
        thumbnail: thumbnail
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) {
          if (error.code === '42501') {
            toast.error(lang === 'KOR' ? '권한이 부족하여 상품을 수정할 수 없습니다. (RLS 정책 확인 필요)' : 'Insufficient permissions to update product. (Check RLS policies)');
          }
          console.error('Error updating product:', error);
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        if (error) {
          if (error.code === '42501') {
            toast.error(lang === 'KOR' ? '권한이 부족하여 상품을 등록할 수 없습니다. (RLS 정책 확인 필요)' : 'Insufficient permissions to add product. (Check RLS policies)');
          }
          console.error('Error inserting product:', error);
          throw error;
        }
        productId = data.id;
      }

      // Handle Options
      if (productId) {
        // Delete existing options if editing
        if (editingProduct) {
          const { error: deleteError } = await supabase.from('product_options').delete().eq('product_id', productId);
          if (deleteError) console.error('Error deleting old options:', deleteError);
        }

        if (formOptions.length > 0) {
          // Strip id from options before inserting to let database generate new ones
          const optionsToInsert = formOptions.map(({ id: _, ...opt }: any) => ({
            ...opt,
            product_id: productId
          }));
          
          const { error: optError } = await supabase.from('product_options').insert(optionsToInsert);
          if (optError) {
            console.error('Error inserting options:', optError);
            throw optError;
          }
        }
      }

      toast.success(lang === 'KOR' ? '저장되었습니다.' : 'Saved successfully.');
      setIsModalOpen(false);
      fetchData();
      resetForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm(lang === 'KOR' ? '정말 삭제하시겠습니까?' : 'Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(lang === 'KOR' ? '삭제되었습니다.' : 'Deleted successfully.');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name_ko: '',
      name_en: '',
      description_ko: '',
      description_en: '',
      price: 0,
      price_usd: 0,
      category: 'beauty',
      brand: 'DOKB',
      stock_quantity: 0,
      is_active: true,
      images: [],
      thumbnail: '',
      tags: []
    });
    setFormOptions([]);
    setImageFiles([]);
    setImagePreviews([]);
  };

  const openEditModal = async (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    
    // Fetch options
    const { data: optionsData } = await supabase
      .from('product_options')
      .select('*')
      .eq('product_id', product.id);
    
    setFormOptions(optionsData || []);
    setIsModalOpen(true);
  };

  const addOptionRow = () => {
    setFormOptions([...formOptions, {
      option_name_ko: '',
      option_name_en: '',
      option_value_ko: '',
      option_value_en: '',
      additional_price: 0,
      stock_quantity: 0
    }]);
  };

  const removeOptionRow = (index: number) => {
    setFormOptions(formOptions.filter((_, i) => i !== index));
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name_ko.toLowerCase().includes(search.toLowerCase()) || 
                         p.name_en.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isAdmin === null) return null;

  return (
    <div className="pt-32 pb-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">
              {lang === 'KOR' ? '상품 관리' : 'Product Management'}
            </h1>
            <p className="text-gray-500">
              {lang === 'KOR' ? '도깨비몰의 상품 카탈로그를 관리하세요' : 'Manage your DOKB Mall product catalog'}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-2 bg-white text-primary border border-gray-100 px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
            >
              <Users className="w-5 h-5 text-accent-teal" />
              {lang === 'KOR' ? '회원 관리' : 'User Management'}
            </button>
            <button 
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              {lang === 'KOR' ? '새 상품 등록' : 'Add New Product'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'KOR' ? '전체 상품' : 'Total Products'}</p>
              <p className="text-3xl font-serif font-bold text-primary">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'KOR' ? '재고 부족' : 'Low Stock'}</p>
              <p className="text-3xl font-serif font-bold text-primary">{stats.lowStock}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'KOR' ? '오늘의 주문' : 'Today\'s Orders'}</p>
              <p className="text-3xl font-serif font-bold text-primary">{stats.todayOrders}</p>
            </div>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={lang === 'KOR' ? '상품 검색...' : 'Search products...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-primary transition-all text-primary"
                />
              </div>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-50 border border-gray-100 rounded-xl px-6 py-3 outline-none focus:border-primary transition-all font-bold text-sm text-primary"
              >
                <option value="all">{lang === 'KOR' ? '전체 카테고리' : 'All Categories'}</option>
                <option value="beauty">Beauty</option>
                <option value="food">Food</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="dokb_brand">DOKB Brand</option>
              </select>
            </div>

            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                <span className="text-sm font-bold text-primary">{selectedProducts.length} {lang === 'KOR' ? '개 선택됨' : 'selected'}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleBulkAction('activate')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"><CheckCircle2 className="w-5 h-5" /></button>
                  <button onClick={() => handleBulkAction('deactivate')} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"><XCircle className="w-5 h-5" /></button>
                  <button onClick={() => handleBulkAction('delete')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-6">
                    <input 
                      type="checkbox" 
                      onChange={(e) => setSelectedProducts(e.target.checked ? filteredProducts.map(p => p.id) : [])}
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-6">{lang === 'KOR' ? '상품 정보' : 'Product Info'}</th>
                  <th className="px-6 py-6">{lang === 'KOR' ? '카테고리' : 'Category'}</th>
                  <th className="px-6 py-6">{lang === 'KOR' ? '가격' : 'Price'}</th>
                  <th className="px-6 py-6">{lang === 'KOR' ? '재고' : 'Stock'}</th>
                  <th className="px-6 py-6">{lang === 'KOR' ? '상태' : 'Status'}</th>
                  <th className="px-8 py-6 text-right">{lang === 'KOR' ? '관리' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <input 
                        type="checkbox" 
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedProducts([...selectedProducts, product.id]);
                          else setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.thumbnail && typeof product.thumbnail === 'string' && product.thumbnail.trim() !== "" ? (
                            <img src={product.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-primary line-clamp-1">{lang === 'KOR' ? product.name_ko : product.name_en}</p>
                          <p className="text-xs text-gray-400 uppercase tracking-wider">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-6 font-bold text-primary">
                      {formatPrice(product.price, 'KRW')}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold",
                          product.stock_quantity < 10 ? "text-orange-600" : "text-primary"
                        )}>
                          {product.stock_quantity}
                        </span>
                        {product.stock_quantity < 10 && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <button 
                        onClick={() => handleToggleStatus(product.id, product.is_active)}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                          product.is_active ? "bg-accent-teal" : "bg-gray-200"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          product.is_active ? "translate-x-6" : "translate-x-1"
                        )} />
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(product)} className="p-2 text-gray-400 hover:text-primary transition-colors"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
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
                className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-8 lg:p-10 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-3xl font-serif font-bold text-primary">
                    {editingProduct ? (lang === 'KOR' ? '상품 수정' : 'Edit Product') : (lang === 'KOR' ? '새 상품 등록' : 'Add New Product')}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                  <form onSubmit={handleSaveProduct} className="space-y-12">
                    {/* Basic Info */}
                    <section className="space-y-6">
                      <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Info className="w-5 h-5 text-accent-teal" />
                        {lang === 'KOR' ? '기본 정보' : 'Basic Information'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '상품명 (국문)' : 'Product Name (KR)'}</label>
                          <input 
                            required
                            type="text" 
                            value={formData.name_ko}
                            onChange={e => setFormData({...formData, name_ko: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 outline-none focus:border-primary transition-all text-primary" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '상품명 (영문)' : 'Product Name (EN)'}</label>
                          <input 
                            required
                            type="text" 
                            value={formData.name_en}
                            onChange={e => setFormData({...formData, name_en: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 outline-none focus:border-primary transition-all text-primary" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '카테고리' : 'Category'}</label>
                          <select 
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 outline-none focus:border-primary transition-all font-bold text-primary"
                          >
                            <option value="beauty">Beauty</option>
                            <option value="food">Food</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="dokb_brand">DOKB Brand</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '브랜드' : 'Brand'}</label>
                          <input 
                            type="text" 
                            value={formData.brand}
                            onChange={e => setFormData({...formData, brand: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 outline-none focus:border-primary transition-all text-primary" 
                          />
                        </div>
                      </div>
                    </section>

                    {/* Pricing & Stock */}
                    <section className="space-y-6">
                      <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent-teal" />
                        {lang === 'KOR' ? '가격 및 재고' : 'Pricing & Stock'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '가격 (KRW)' : 'Price (KRW)'}</label>
                          <input 
                            required
                            type="number" 
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 outline-none focus:border-primary transition-all font-bold text-primary" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '가격 (USD)' : 'Price (USD)'}</label>
                          <input 
                            required
                            type="number" 
                            step="0.01"
                            value={formData.price_usd}
                            onChange={e => setFormData({...formData, price_usd: Number(e.target.value)})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 outline-none focus:border-primary transition-all font-bold text-primary" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '재고 수량' : 'Stock Quantity'}</label>
                          <input 
                            required
                            type="number" 
                            value={formData.stock_quantity}
                            onChange={e => setFormData({...formData, stock_quantity: Number(e.target.value)})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 outline-none focus:border-primary transition-all font-bold text-primary" 
                          />
                        </div>
                      </div>
                    </section>

                    {/* Images */}
                    <section className="space-y-6">
                      <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Upload className="w-5 h-5 text-accent-teal" />
                        {lang === 'KOR' ? '이미지 등록' : 'Image Upload'}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* Existing Images */}
                        {formData.images?.filter(url => url && url.trim() !== "").map((url, i) => (
                          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 group">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, images: formData.images?.filter((_, idx) => idx !== i)})}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            {i === 0 && <div className="absolute bottom-2 left-2 bg-primary text-white text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Main</div>}
                          </div>
                        ))}
                        
                        {/* New Image Previews */}
                        {imagePreviews.filter(url => url && url.trim() !== "").map((url, i) => (
                          <div key={`new-${i}`} className="relative aspect-square rounded-2xl overflow-hidden border border-primary/20 group">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-accent-teal text-white text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">New</div>
                          </div>
                        ))}

                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-all"
                        >
                          <Plus className="w-6 h-6" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{lang === 'KOR' ? '이미지 추가' : 'Add Image'}</span>
                        </button>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handleImageChange}
                        />
                      </div>
                    </section>

                    {/* Options */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-accent-teal" />
                          {lang === 'KOR' ? '옵션 설정' : 'Option Management'}
                        </h3>
                        <button 
                          type="button"
                          onClick={addOptionRow}
                          className="text-xs font-bold text-accent-teal hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          {lang === 'KOR' ? '옵션 추가' : 'Add Option'}
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {formOptions.map((opt, i) => (
                          <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 relative group">
                            <button 
                              type="button"
                              onClick={() => removeOptionRow(i)}
                              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '옵션명 (국문)' : 'Option Name (KR)'}</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 색상"
                                  value={opt.option_name_ko}
                                  onChange={e => {
                                    const newOpts = [...formOptions];
                                    newOpts[i].option_name_ko = e.target.value;
                                    setFormOptions(newOpts);
                                  }}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-primary" 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '옵션값 (국문)' : 'Option Value (KR)'}</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. 블랙"
                                  value={opt.option_value_ko}
                                  onChange={e => {
                                    const newOpts = [...formOptions];
                                    newOpts[i].option_value_ko = e.target.value;
                                    setFormOptions(newOpts);
                                  }}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-primary" 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '추가 금액' : 'Add. Price'}</label>
                                <input 
                                  type="number" 
                                  value={opt.additional_price}
                                  onChange={e => {
                                    const newOpts = [...formOptions];
                                    newOpts[i].additional_price = Number(e.target.value);
                                    setFormOptions(newOpts);
                                  }}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-primary" 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{lang === 'KOR' ? '옵션 재고' : 'Opt. Stock'}</label>
                                <input 
                                  type="number" 
                                  value={opt.stock_quantity}
                                  onChange={e => {
                                    const newOpts = [...formOptions];
                                    newOpts[i].stock_quantity = Number(e.target.value);
                                    setFormOptions(newOpts);
                                  }}
                                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-primary" 
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Description */}
                    <section className="space-y-6">
                      <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Edit className="w-5 h-5 text-accent-teal" />
                        {lang === 'KOR' ? '상세 설명' : 'Description'}
                      </h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '설명 (국문)' : 'Description (KR)'}</label>
                          <textarea 
                            rows={4}
                            value={formData.description_ko}
                            onChange={e => setFormData({...formData, description_ko: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 outline-none focus:border-primary transition-all resize-none text-primary" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{lang === 'KOR' ? '설명 (영문)' : 'Description (EN)'}</label>
                          <textarea 
                            rows={4}
                            value={formData.description_en}
                            onChange={e => setFormData({...formData, description_en: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 outline-none focus:border-primary transition-all resize-none text-primary" 
                          />
                        </div>
                      </div>
                    </section>

                    <div className="pt-12 border-t border-gray-100 flex justify-end gap-4">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                      >
                        {lang === 'KOR' ? '취소' : 'Cancel'}
                      </button>
                      <button 
                        type="submit"
                        disabled={loading || isUploading}
                        className="bg-primary text-white px-12 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                      >
                        {loading || isUploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        {lang === 'KOR' ? '상품 저장하기' : 'Save Product'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
