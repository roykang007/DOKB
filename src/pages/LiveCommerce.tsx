import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Users, 
  Heart, 
  Share2, 
  ShoppingBag, 
  MessageCircle, 
  X, 
  ChevronRight, 
  Calendar,
  Clock,
  Volume2,
  VolumeX,
  Maximize2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface LiveSession {
  id: string;
  title: { KOR: string; ENG: string; CHI: string };
  host: string;
  hostAvatar: string;
  category: { KOR: string; ENG: string; CHI: string };
  viewers: string;
  status: 'live' | 'upcoming' | 'replay';
  performance: { label: { KOR: string; ENG: string; CHI: string }; value: string; isPositive?: boolean };
  lastChat?: string;
  likes: string;
  comments: string;
  thumbnail: string;
  videoUrl?: string;
}

const MOCK_LIVES: LiveSession[] = [
  {
    id: '1',
    title: { KOR: 'Miku의 데일리 룩', ENG: 'Miku\'s Daily Look', CHI: 'Miku 的日常穿搭' },
    host: 'Miku_Style',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
    category: { KOR: '의류', ENG: 'Apparel', CHI: '服装' },
    viewers: '8.2K',
    status: 'live',
    performance: { label: { KOR: '월간 매출', ENG: 'Monthly Sales', CHI: '月销售额' }, value: '21,315,000₩/월' },
    lastChat: 'Nuitonode: 이 옷 어디꺼에요?',
    likes: '12.4K',
    comments: '3.2K',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    title: { KOR: 'GameX 프로의 실시간 스트리밍', ENG: 'GameX Pro Live Stream', CHI: 'GameX Pro 实时直播' },
    host: 'GameX_Pro',
    hostAvatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80',
    category: { KOR: '게임', ENG: 'Gaming', CHI: '游戏' },
    viewers: '15.1K',
    status: 'live',
    performance: { label: { KOR: '월간 매출', ENG: 'Monthly Sales', CHI: '月销售额' }, value: '16,443,000₩/월' },
    lastChat: 'Gamer_1: 와 컨트롤 대박!',
    likes: '28.7K',
    comments: '8.9K',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    title: { KOR: '타나카 셰프의 라멘 비법', ENG: 'Chef Tanaka\'s Ramen Secret', CHI: '田中厨师的拉面秘诀' },
    host: 'Chef_Tanaka',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80',
    category: { KOR: '음식점', ENG: 'Restaurant', CHI: '餐厅' },
    viewers: '4.5K',
    status: 'live',
    performance: { label: { KOR: '월간 매출', ENG: 'Monthly Sales', CHI: '月销售额' }, value: '320방문객 +%', isPositive: true },
    lastChat: 'buyer_c: 어디에요?',
    likes: '6.8K',
    comments: '2.1K',
    thumbnail: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80',
  }
];

const LiveCard: React.FC<{ live: LiveSession; lang: 'KOR' | 'ENG' | 'CHI' }> = ({ live, lang }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-[#111420] rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col h-full"
    >
      {/* Video/Thumbnail Area */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img src={live.thumbnail} className="w-full h-full object-cover" alt={live.title[lang]} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        {/* Top Badges */}
        <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#FF3B30] text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              LIVE
            </div>
            <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {live.viewers}
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold">
            {live.category[lang]}
          </div>
        </div>

        {/* Bottom Overlay Info */}
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div className="max-w-[70%]">
            {live.lastChat && (
              <div className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] text-white/90 flex items-center gap-2">
                <span className="text-highlight-red font-bold">{live.lastChat.split(':')[0]}</span>
                <span className="truncate">{live.lastChat.split(':')[1]}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center">
              <Heart className="w-5 h-5 text-[#FF3B30] fill-[#FF3B30] mb-1" />
              <span className="text-[10px] font-bold text-white">{live.likes}</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle className="w-5 h-5 text-white mb-1" />
              <span className="text-[10px] font-bold text-white">{live.comments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent-teal/30">
            <img src={live.hostAvatar} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">{live.host}</h3>
            <p className="text-gray-500 text-[10px]">{live.category[lang]}</p>
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-gray-400 text-[11px]">{live.performance.label[lang]}</span>
          <span className={`text-sm font-bold ${live.performance.isPositive ? 'text-accent-teal' : 'text-accent-teal'}`}>
            {live.performance.value}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export const LiveCommerce: React.FC<{ lang: 'KOR' | 'ENG' | 'CHI' }> = ({ lang }) => {
  const t = {
    title: lang === 'KOR' ? 'DOKB 라이브방송' : lang === 'ENG' ? 'DOKB Live Stream' : 'DOKB 直播',
    subtitle: lang === 'KOR' ? 'LiVEON 스트리머 현황' : lang === 'ENG' ? 'LiVEON Streamer Status' : 'LiVEON 主播现状',
  };

  return (
    <div className="min-h-screen bg-[#05070a] pt-32 pb-20">
      <div className="container mx-auto px-4 lg:px-6">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-4">{t.title}</h1>
          <p className="text-gray-400 text-lg">{t.subtitle}</p>
        </div>

        {/* Live Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {MOCK_LIVES.map(live => (
            <LiveCard key={live.id} live={live} lang={lang} />
          ))}
        </div>

      </div>
    </div>
  );
};
