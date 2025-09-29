'use client';

import { useApp } from '../providers';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useApp();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={`Switch to ${language === 'en' ? 'Arabic' : 'English'}`}
    >
      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {language === 'en' ? 'EN' : 'AR'}
      </span>
    </button>
  );
}
