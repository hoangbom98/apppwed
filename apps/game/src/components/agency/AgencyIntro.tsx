import React, { useState } from 'react';
import { Copy, CheckCircle, Users, TrendingUp } from 'lucide-react';
import { formatVND } from '@/utils/dinhDang';
import Button from '@/components/chung/NutBam';

export const AgentReferral: React.FC<{
  agentInfo: any;
  referralCode: string;
  referralLink: string;
}> = ({ agentInfo, referralCode, referralLink }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-primary dark:text-accent" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{agentInfo?.total_referred || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Người được mời</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-lg font-black text-green-600 dark:text-green-400">
            {formatVND(agentInfo?.total_commission || 0)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tổng hoa hồng</p>
        </div>
      </div>

      {/* Referral box */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 border border-primary/20 dark:border-primary/30 rounded-xl p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Mã giới thiệu của bạn</p>
        <div className="flex items-center gap-2 mb-3">
          <code className="text-xl font-black text-gray-900 dark:text-white tracking-widest flex-1">{referralCode}</code>
          <Button variant="primary" size="sm" onClick={handleCopy}>
            {copied ? <><CheckCircle className="w-3.5 h-3.5 mr-1" />Đã copy</> : <><Copy className="w-3.5 h-3.5 mr-1" />Copy</>}
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 break-all">{referralLink}</p>
      </div>

      {/* Commission rate */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <TrendingUp className="w-6 h-6 text-primary dark:text-accent shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Tỷ lệ hoa hồng</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Nhận {agentInfo?.agent?.commission_rate || 2}% từ giao dịch của người bạn mời
          </p>
        </div>
      </div>
    </div>
  );
};
