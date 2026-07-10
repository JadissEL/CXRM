import React, { createContext, useContext, useState, useEffect } from 'react';

// Traductions
const translations = {
  fr: {
    welcome: 'Bienvenue sur ShopTheBarber',
    search: 'Rechercher un barbier, un service...',
    book: 'Réserver',
    login: 'Connexion',
    signup: 'Inscription',
    dashboard: 'Tableau de bord',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    // ... plus de traductions
  },
  en: {
    welcome: 'Welcome to ShopTheBarber',
    search: 'Search for a barber, service...',
    book: 'Book',
    login: 'Login',
    signup: 'Sign up',
    dashboard: 'Dashboard',
    settings: 'Settings',
    logout: 'Logout',
    // ... plus de traductions
  },
  ar: {
    welcome: 'مرحباً بك في ShopTheBarber',
    search: 'ابحث عن حلاق أو خدمة...',
    book: 'احجز',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    dashboard: 'لوحة التحكم',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    // ... plus de traductions
  }
};

type Language = 'fr' | 'en' | 'ar';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    // Détection automatique de la langue
    const savedLang = localStorage.getItem('language') as Language;
    const browserLang = navigator.language.split('-')[0] as Language;
    const defaultLang = savedLang || (translations[browserLang] ? browserLang : 'fr');
    setLanguage(defaultLang);
  }, []);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}; 