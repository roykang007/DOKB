import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, Upload, Loader2, Search, Filter } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'sonner';

interface VIPItem {
  id: string;
  category: 'antique' | 'real-estate';
  title: { KOR: string; ENG: string; CHI: string };
  description: { KOR: string; ENG: string; CHI: string };
  price: string;
  images: string[];
  created_at?: string;
}

export const AdminVIP: React.FC = () => {
  const [items, setItems] = useState<VIPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VIPItem | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<VIPItem>>({
    category: 'antique',
    title: { KOR: '', ENG: '', CHI: '' },
    description: { KOR: '', ENG: '', CHI: '' },
    price: '별도 문의 (Inquiry Required)',
    images: []
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vip_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map flat DB structure to nested UI structure
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
        images: dbItem.images,
        created_at: dbItem.created_at
      }));

      setItems(mappedItems);
    } catch (error: any) {
      console.error('Error fetching VIP items:', error);
      toast.error('Failed to load VIP items');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages = [...(formData.images || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `vip/${fileName}`;

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
        // Update state immediately for each image to show progress
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), publicUrl] }));
      } catch (error: any) {
        console.error('Error uploading image:', error);
        toast.error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
      }
    }

    setUploading(false);
  };

  const removeImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;

    setLoading(true);
    try {
      // Map nested UI structure to flat DB structure
      const dbPayload = {
        category: formData.category,
        title_ko: formData.title?.KOR,
        title_en: formData.title?.ENG,
        title_zh: formData.title?.CHI,
        description_ko: formData.description?.KOR,
        description_en: formData.description?.ENG,
        description_zh: formData.description?.CHI,
        price: formData.price,
        images: formData.images
      };

      if (editingItem) {
        const { error } = await supabase
          .from('vip_items')
          .update(dbPayload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('VIP item updated');
      } else {
        const { error } = await supabase
          .from('vip_items')
          .insert([dbPayload]);
        if (error) throw error;
        toast.success('VIP item created');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({
        category: 'antique',
        title: { KOR: '', ENG: '', CHI: '' },
        description: { KOR: '', ENG: '', CHI: '' },
        price: '별도 문의 (Inquiry Required)',
        images: []
      });
      fetchItems();
    } catch (error: any) {
      console.error('Error saving VIP item:', error);
      toast.error('Failed to save VIP item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this VIP item?')) return;

    try {
      const { error } = await supabase
        .from('vip_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('VIP item deleted');
      fetchItems();
    } catch (error: any) {
      console.error('Error deleting VIP item:', error);
      toast.error('Failed to delete VIP item');
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-primary">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold text-accent-gold mb-2">VIP Item Management</h1>
            <p className="text-gray-400">Manage exclusive antiques and luxury real estate listings.</p>
          </div>
          <button 
            onClick={() => {
              setEditingItem(null);
              setFormData({
                category: 'antique',
                title: { KOR: '', ENG: '', CHI: '' },
                description: { KOR: '', ENG: '', CHI: '' },
                price: '별도 문의 (Inquiry Required)',
                images: []
              });
              setIsModalOpen(true);
            }}
            className="bg-accent-gold text-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add VIP Item
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-accent-teal animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden group">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={item.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
                    alt={item.title.ENG}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary/80 backdrop-blur-md text-accent-gold px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingItem(item);
                        setFormData(item);
                        setIsModalOpen(true);
                      }}
                      className="bg-white text-primary p-2 rounded-full hover:bg-accent-teal hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="bg-white text-highlight-red p-2 rounded-full hover:bg-highlight-red hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-bold text-white mb-2">{item.title.ENG}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">{item.description.ENG}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-accent-gold font-bold">{item.price}</span>
                    <span className="text-gray-500 text-xs">{item.images.length} Images</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-primary/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[2rem] p-8 lg:p-10 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
              >
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-primary transition-colors">
                  <X className="w-6 h-6" />
                </button>

                <h2 className="text-3xl font-serif font-bold text-primary mb-8">
                  {editingItem ? 'Edit VIP Item' : 'Add New VIP Item'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Details */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Category</label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary"
                        >
                          <option value="antique">Antique & Art</option>
                          <option value="real-estate">Real Estate</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Title</label>
                        <input 
                          placeholder="KOR"
                          value={formData.title?.KOR}
                          onChange={(e) => setFormData({ ...formData, title: { ...formData.title!, KOR: e.target.value } })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary"
                        />
                        <input 
                          placeholder="ENG"
                          value={formData.title?.ENG}
                          onChange={(e) => setFormData({ ...formData, title: { ...formData.title!, ENG: e.target.value } })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary"
                        />
                        <input 
                          placeholder="CHI"
                          value={formData.title?.CHI}
                          onChange={(e) => setFormData({ ...formData, title: { ...formData.title!, CHI: e.target.value } })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Price / Value</label>
                        <input 
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary"
                        />
                      </div>
                    </div>

                    {/* Right Column: Description & Images */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Description</label>
                        <textarea 
                          placeholder="KOR"
                          rows={3}
                          value={formData.description?.KOR}
                          onChange={(e) => setFormData({ ...formData, description: { ...formData.description!, KOR: e.target.value } })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary resize-none"
                        />
                        <textarea 
                          placeholder="ENG"
                          rows={3}
                          value={formData.description?.ENG}
                          onChange={(e) => setFormData({ ...formData, description: { ...formData.description!, ENG: e.target.value } })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary resize-none"
                        />
                        <textarea 
                          placeholder="CHI"
                          rows={3}
                          value={formData.description?.CHI}
                          onChange={(e) => setFormData({ ...formData, description: { ...formData.description!, CHI: e.target.value } })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-accent-teal transition-colors text-primary resize-none"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Images (Multiple)</label>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {formData.images?.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                              <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 bg-highlight-red text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <label className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent-teal hover:bg-gray-50 transition-all">
                            <Upload className="w-6 h-6 text-gray-400" />
                            <span className="text-[10px] text-gray-400 mt-1">Upload</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-8 border-t">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || uploading}
                      className="bg-primary text-white px-12 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {editingItem ? 'Update Item' : 'Create Item'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminVIP;
