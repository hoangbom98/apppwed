import React from 'react';

export interface FooterConfig {
  logoUrl: string;
  slogan: string;
  description: string;
  partnerImageUrl: string;
  copyright: string;
}

interface FooterProps {
  config: FooterConfig;
}

export const LkvipFooter: React.FC<FooterProps> = ({ config }) => {
  return (
    <footer className="mx-auto max-w-[560px] px-2 pb-8 mt-6">
      <div className="relative">
        <div className="overflow-hidden">
          <div className="px-3 pt-3">
            <div className="flex items-center gap-3">
              <img alt="LKVIP Logo" className="h-[56px] w-[360px]" loading="lazy" src={config.logoUrl} />
            </div>
            <div className="my-4 text-[18px] italic text-[#FF6A00]">{config.slogan}</div>
            <p className="mt-3 text-[13px] text-[#333]">{config.description}</p>
          </div>

          <div className="mt-4">
            <div className="flex items-start justify-between rounded-[12px] px-4 py-3">
              <div className="flex-1">
                <h3 className="text-[18px] font-semibold text-[#333] border-b border-gray-300 pb-1 mb-2">Thông Tin</h3>
                <ul className="space-y-[6px] mt-3 font-[400] text-[10px] text-[#333]">
                  <li className="cursor-pointer transition-colors">Giới Thiệu Về LKVIP</li>
                  <li className="cursor-pointer hover:text-[#FF6A00] transition-colors">Điều Khoản Sử Dụng</li>
                  <li className="cursor-pointer hover:text-[#FF6A00] transition-colors">Chính Sách Quyền Riêng Tư</li>
                  <li className="cursor-pointer hover:text-[#FF6A00] transition-colors">Cẩm Nang Hướng Dẫn</li>
                  <li className="cursor-pointer hover:text-[#FF6A00] transition-colors">Liên Hệ</li>
                </ul>
              </div>
              <div className="relative flex-shrink-0">
                <div className="relative">
                  <img alt="Đối tác LKVIP 2025-2026" className="w-[180px] h-[156px] object-contain" loading="lazy" src={config.partnerImageUrl} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-3 pb-3">
            <img alt="VN Flag" className="h-[36px] w-auto object-contain image-crisp" loading="lazy" src="/assets/images/vietnam.webp" />
            <img alt="18+" className="h-[28px] w-[28px]" loading="lazy" src="/assets/images/18+.webp" />
          </div>

          <div className="px-3 pb-4 pt-1 font-[500] text-center text-[15px] text-[#565656]">
            {config.copyright}
          </div>
        </div>
      </div>
    </footer>
  );
};
