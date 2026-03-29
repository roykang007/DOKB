import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { HERO_IMAGES } from '../constants/images';

export const AdminSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(HERO_IMAGES);
  const [hasTable, setHasTable] = useState<boolean | null>(null);

  useEffect(() => {
    checkTable();
  }, []);

  const checkTable = async () => {
    try {
      const { error } = await supabase.from('site_settings').select('id').limit(1);
      if (error && error.code === '42P01') {
        setHasTable(false);
      } else {
        setHasTable(true);
        fetchSettings();
      }
    } catch (e) {
      setHasTable(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'hero_images')
        .maybeSingle();
      
      if (data && data.value) {
        setSettings(data.value);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasTable) {
      toast.error('Site settings table does not exist. Please run the SQL first.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'hero_images', value: settings }, { onConflict: 'key' });
      
      if (error) throw error;
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    setSettings(HERO_IMAGES);
    toast.info('Reset to default values (unsaved)');
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Site Settings</h1>
          <p className="text-gray-400">Manage hero section images and other global assets.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-accent-gold text-primary font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {!hasTable && (
        <div className="bg-highlight-red/10 border border-highlight-red/20 p-6 rounded-2xl mb-10 flex gap-4">
          <AlertCircle className="w-6 h-6 text-highlight-red shrink-0" />
          <div>
            <h3 className="font-bold text-highlight-red mb-2">Database Table Missing</h3>
            <p className="text-sm text-gray-300 mb-4">
              To persist these settings, you need to create a `site_settings` table in Supabase. 
              Run the following SQL in your Supabase SQL Editor:
            </p>
            <pre className="bg-black/50 p-4 rounded-xl text-xs overflow-x-auto text-accent-teal border border-white/5">
{`CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Allow public read" ON site_settings FOR SELECT USING (true);

-- Allow authenticated admins to manage
CREATE POLICY "Allow admin manage" ON site_settings FOR ALL 
USING (auth.jwt() ->> 'email' = 'roykang007@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'roykang007@gmail.com');`}
            </pre>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <ImageIcon className="w-6 h-6 text-accent-gold" />
            <h2 className="text-xl font-bold">Hero Section Images</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Main Mascot Image URL</label>
              <div className="flex gap-4 items-start">
                <input
                  type="text"
                  value={settings.mainMascot}
                  onChange={(e) => setSettings({ ...settings, mainMascot: e.target.value })}
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:border-accent-gold outline-none transition-all"
                  placeholder="https://..."
                />
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-black/50 shrink-0">
                  <img src={settings.mainMascot} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Beauty Category Image</label>
                <input
                  type="text"
                  value={settings.categories.beauty}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    categories: { ...settings.categories, beauty: e.target.value } 
                  })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:border-accent-gold outline-none transition-all mb-3"
                />
                <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50">
                  <img src={settings.categories.beauty} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Food Category Image</label>
                <input
                  type="text"
                  value={settings.categories.food}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    categories: { ...settings.categories, food: e.target.value } 
                  })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:border-accent-gold outline-none transition-all mb-3"
                />
                <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50">
                  <img src={settings.categories.food} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Lifestyle Category Image</label>
                <input
                  type="text"
                  value={settings.categories.lifestyle}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    categories: { ...settings.categories, lifestyle: e.target.value } 
                  })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 focus:border-accent-gold outline-none transition-all mb-3"
                />
                <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50">
                  <img src={settings.categories.lifestyle} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
