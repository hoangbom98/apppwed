// frontend/hub/src/components/Footer.tsx
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto py-8 text-sm text-gray-400">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="text-white font-bold text-lg mb-1">Hub</div>
          <p className="text-xs">© {new Date().getFullYear()} Hub Portal. All rights reserved.</p>
        </div>
        <div className="flex gap-6 flex-wrap">
          <Link to="/about"   className="hover:text-white no-underline">{t('nav.about')}</Link>
          <Link to="/policy"  className="hover:text-white no-underline">Chính sách</Link>
          <Link to="/terms"   className="hover:text-white no-underline">Điều khoản</Link>
          <Link to="/faq"     className="hover:text-white no-underline">FAQ</Link>
          <Link to="/contact" className="hover:text-white no-underline">{t('nav.contact')}</Link>
        </div>
      </div>
    </footer>
  );
}
