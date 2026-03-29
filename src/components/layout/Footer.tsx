import React from 'react';
import { Instagram, Linkedin, Youtube, Mail } from 'lucide-react';

interface FooterProps {
  lang: 'KOR' | 'ENG' | 'CHI';
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  return (
    <footer className="bg-primary pt-20 pb-10 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-serif font-bold tracking-tighter text-accent-gold">DOKB</span>
            </div>
            <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
              {lang === 'KOR' 
                ? '도깨비몰은 한국의 우수한 상품을 전 세계에 알리고 연결하는 글로벌 이커머스 플랫폼입니다. (주)코라트레이드가 운영합니다.'
                : lang === 'ENG'
                ? 'DOKB Mall is a global e-commerce platform that promotes and connects excellent Korean products to the world. Operated by Cora Trade Co., Ltd.'
                : 'DOKB Mall 是一个全球电子商务平台，致力于向世界推广和连接韩国的优秀产品。由 Cora Trade Co., Ltd. 运营。'}
            </p>
            <div className="flex gap-4">
              {[Instagram, Linkedin, Youtube, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-accent-teal hover:border-accent-teal transition-all">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">{lang === 'KOR' ? '고객지원' : lang === 'ENG' ? 'Support' : '客户支持'}</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-accent-gold transition-colors">{lang === 'KOR' ? '이용약관' : lang === 'ENG' ? 'Terms of Service' : '服务条款'}</a></li>
              <li><a href="#" className="hover:text-accent-gold transition-colors">{lang === 'KOR' ? '개인정보처리방침' : lang === 'ENG' ? 'Privacy Policy' : '隐私政策'}</a></li>
              <li><a href="#" className="hover:text-accent-gold transition-colors">{lang === 'KOR' ? '배송안내' : lang === 'ENG' ? 'Shipping Info' : '配送信息'}</a></li>
              <li><a href="#" className="hover:text-accent-gold transition-colors">{lang === 'KOR' ? 'FAQ' : lang === 'ENG' ? 'FAQ' : '常见问题'}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">{lang === 'KOR' ? '회사정보' : lang === 'ENG' ? 'Company' : '公司信息'}</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li>(주)코라트레이드 | Cora Trade Co., Ltd.</li>
              <li>CEO: Roy Kang</li>
              <li>Business ID: 123-45-67890</li>
              <li>Address: Seoul, South Korea</li>
            </ul>
          </div>
        </div>
        <div className="pt-10 border-t border-white/5 text-center text-xs text-gray-500">
          © 2026 DOKB Mall. All rights reserved. Magic Delivered by Cora Trade.
        </div>
      </div>
    </footer>
  );
};
